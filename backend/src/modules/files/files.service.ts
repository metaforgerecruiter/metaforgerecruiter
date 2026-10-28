import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { FilesRepository } from './repositories/files.repository';
import { FileMetadataDocument } from './schemas/file-metadata.schema';
import { requireOrgId } from '../../common/security/resource-access.util';
import {
  resolveResumeStorageDir,
  resolveStoredFilePath,
  resolveStorageRoot,
} from '../../common/security/storage-paths.util';
import {
  buildSignedDownloadPath,
  createFileDownloadToken,
  defaultSignedUrlTtlSeconds,
  verifyFileDownloadToken,
} from '../../common/security/signed-url.util';
import {
  assertSafeUploadFilename,
  scanUploadBuffer,
  validateUploadedResume,
} from '../../common/security/upload-validation.util';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly storageRoot: string;

  constructor(private readonly filesRepository: FilesRepository) {
    this.storageRoot = resolveStorageRoot();
    this.logger.log(`Resume storage root: ${this.storageRoot}`);
  }

  private getOrgId(currentUser: any): Types.ObjectId {
    return requireOrgId(currentUser);
  }

  private getUserId(currentUser: any): Types.ObjectId {
    const raw = currentUser?.id || currentUser?._id || currentUser?.userId;
    if (!raw || !Types.ObjectId.isValid(String(raw))) {
      throw new BadRequestException('Authenticated user id is required for uploads');
    }
    return new Types.ObjectId(String(raw));
  }

  async findAll(currentUser: any, query?: { page?: string; limit?: string; search?: string }) {
    const orgId = this.getOrgId(currentUser);
    const filter: Record<string, any> = { orgId, deletedAt: null };

    if (query?.search && query.search.trim()) {
      const term = query.search.trim();
      const regex = new RegExp(term, 'i');
      filter.$or = [
        { originalName: regex },
        { fileId: regex },
        { mimeType: regex },
      ];
    }

    const page = Math.max(1, parseInt(String(query?.page || 1), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(query?.limit || 20), 10)));

    return this.filesRepository.findAll(filter, page, limit);
  }

  async findOne(currentUser: any, id: string) {
    const orgId = this.getOrgId(currentUser);
    const file = await this.filesRepository.findById(orgId, id);
    if (!file) {
      throw new NotFoundException(`File with ID "${id}" not found`);
    }
    return file;
  }

  async uploadFile(currentUser: any, file: any) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No file payload provided');
    }

    const orgId = this.getOrgId(currentUser);
    const uploadedBy = this.getUserId(currentUser);
    const originalName = assertSafeUploadFilename(file.originalname || 'unnamed_file');

    // Defense in depth: re-scan even if controller already validated.
    let scanStatus: 'CLEAN' | 'INFECTED' | 'PENDING' = 'PENDING';
    try {
      validateUploadedResume({ ...file, originalname: originalName });
      scanUploadBuffer(originalName, file.buffer, file.mimetype);
      scanStatus = 'CLEAN';
    } catch (err) {
      scanStatus = 'INFECTED';
      throw err;
    }

    const count = await this.filesRepository.countFiles(orgId);
    const fileId = `FILE-${Date.now()}-${String(count + 1).padStart(3, '0')}`;
    const ext = path.extname(originalName).toLowerCase() || '.bin';
    const opaqueName = `${crypto.randomUUID()}${ext}`;
    const orgDir = resolveResumeStorageDir(orgId.toString());
    const absolutePath = path.join(orgDir, opaqueName);
    // Relative key under STORAGE_ROOT (never store absolute web paths).
    const storageKey = path
      .relative(this.storageRoot, absolutePath)
      .split(path.sep)
      .join('/');

    fs.writeFileSync(absolutePath, file.buffer, { mode: 0o600 });

    const checksumSha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');

    const saved = await this.filesRepository.create({
      orgId,
      fileId,
      originalName,
      mimeType: file.mimetype || 'application/octet-stream',
      sizeBytes: file.size || file.buffer.length,
      storageProvider: 'LOCAL',
      bucketName: 'private-resumes',
      storageKey,
      checksumSha256,
      scanStatus,
      uploadedBy,
      deletedAt: null,
      schemaVersion: 1,
    });

    const signed = this.createSignedDownloadForRecord(saved, currentUser);
    return {
      ...saved.toObject(),
      id: saved._id.toString(),
      downloadUrl: signed.url,
      downloadExpiresAt: signed.expiresAt,
    };
  }

  /** Mint a short-lived signed download URL (auth required). */
  async createSignedDownloadUrl(
    currentUser: any,
    id: string,
    expiresInSeconds?: number,
  ): Promise<{ url: string; expiresAt: string; token: string }> {
    const file = await this.findOne(currentUser, id);
    if (file.scanStatus === 'INFECTED') {
      throw new BadRequestException('Infected file cannot be downloaded');
    }
    return this.createSignedDownloadForRecord(file, currentUser, expiresInSeconds);
  }

  private createSignedDownloadForRecord(
    file: FileMetadataDocument,
    currentUser: any,
    expiresInSeconds?: number,
  ): { url: string; expiresAt: string; token: string } {
    const ttl = Math.min(
      Math.max(Number(expiresInSeconds) || defaultSignedUrlTtlSeconds(), 30),
      3600,
    );
    const exp = Math.floor(Date.now() / 1000) + ttl;
    const token = createFileDownloadToken({
      fid: file._id.toString(),
      oid: file.orgId.toString(),
      uid: (currentUser?.id || currentUser?._id || '').toString() || undefined,
      exp,
    });
    return {
      token,
      url: buildSignedDownloadPath(token),
      expiresAt: new Date(exp * 1000).toISOString(),
    };
  }

  /**
   * New resumes live under STORAGE_ROOT. Older uploads were written as a bare
   * filename in backend/uploads and are still readable from there.
   */
  private resolveExistingFilePath(storageKey: string): string {
    const primary = resolveStoredFilePath(storageKey);
    if (fs.existsSync(primary)) return primary;

    const key = String(storageKey || '').replace(/\\/g, '/').replace(/^\/+/, '');
    if (!key || key.includes('..') || key.includes('/') || path.isAbsolute(storageKey)) {
      throw new NotFoundException('File content on disk not found');
    }
    const legacyRoot = path.resolve(process.cwd(), 'uploads');
    const legacy = path.resolve(legacyRoot, key);
    const rootWithSep = legacyRoot.endsWith(path.sep) ? legacyRoot : legacyRoot + path.sep;
    if (!legacy.toLowerCase().startsWith(rootWithSep.toLowerCase()) || !fs.existsSync(legacy)) {
      throw new NotFoundException('File content on disk not found');
    }
    return legacy;
  }

  async getFilePath(currentUser: any, id: string): Promise<{ fileRecord: FileMetadataDocument; absolutePath: string }> {
    const fileRecord = await this.findOne(currentUser, id);
    if (fileRecord.scanStatus === 'INFECTED') {
      throw new BadRequestException('Infected file cannot be downloaded');
    }
    const absolutePath = this.resolveExistingFilePath(fileRecord.storageKey);
    return { fileRecord, absolutePath };
  }

  /** Resolve path using signed token only (no session) — for time-boxed downloads. */
  async getFilePathFromSignedToken(token: string): Promise<{ fileRecord: FileMetadataDocument; absolutePath: string }> {
    const claims = verifyFileDownloadToken(token);
    if (!Types.ObjectId.isValid(claims.oid)) {
      throw new BadRequestException('Invalid organization in download token');
    }
    const orgId = new Types.ObjectId(claims.oid);
    const fileRecord = await this.filesRepository.findById(orgId, claims.fid);
    if (!fileRecord) {
      throw new NotFoundException('File not found');
    }
    if (fileRecord.scanStatus === 'INFECTED') {
      throw new BadRequestException('Infected file cannot be downloaded');
    }
    const absolutePath = this.resolveExistingFilePath(fileRecord.storageKey);
    return { fileRecord, absolutePath };
  }

  async remove(currentUser: any, id: string) {
    const orgId = this.getOrgId(currentUser);
    const file = await this.filesRepository.findById(orgId, id);
    if (!file) {
      throw new NotFoundException(`File with ID "${id}" not found`);
    }

    await this.filesRepository.softDelete(orgId, id);

    try {
      const diskPath = this.resolveExistingFilePath(file.storageKey);
      if (fs.existsSync(diskPath)) {
        fs.unlinkSync(diskPath);
      }
    } catch (err) {
      this.logger.warn(`Disk cleanup failed for ${id}: ${(err as Error).message}`);
    }

    return { success: true, message: `File ${id} deleted successfully` };
  }
}
