import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  MAX_UPLOAD_BYTES,
  resumeMulterFileFilter,
  validateUploadedResume,
} from '../../common/security/upload-validation.util';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /**
   * GET /api/v1/files/signed-download?token=...
   * Time-boxed HMAC download — no session cookie required (link is the credential).
   * Must be registered before :id routes.
   */
  @Get('signed-download')
  async signedDownload(@Query('token') token: string, @Res() res: Response) {
    if (!token?.trim()) {
      throw new BadRequestException('Download token is required');
    }
    const { fileRecord, absolutePath } = await this.filesService.getFilePathFromSignedToken(
      token.trim(),
    );
    res.setHeader('Content-Type', fileRecord.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileRecord.originalName)}"`,
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.sendFile(absolutePath);
  }

  /** GET /api/v1/files */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.filesService.findAll(req.user, { page, limit, search });
  }

  /** GET /api/v1/files/:id */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.filesService.findOne(req.user, id);
  }

  /**
   * GET /api/v1/files/:id/download
   * Authenticated convenience path — issues a 302 to a short-lived signed URL.
   */
  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  async downloadFile(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const signed = await this.filesService.createSignedDownloadUrl(req.user, id);
    return res.redirect(302, signed.url);
  }

  /** POST /api/v1/files/:id/signed-url — mint signed download URL */
  @Post(':id/signed-url')
  @UseGuards(JwtAuthGuard)
  async createSignedUrl(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body?: { expiresInSeconds?: number },
  ) {
    return this.filesService.createSignedDownloadUrl(
      req.user,
      id,
      body?.expiresInSeconds,
    );
  }

  /** POST /api/v1/files — resumes / documents only (type, size, content scan). */
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
      fileFilter: resumeMulterFileFilter,
    }),
  )
  async uploadFile(@Req() req: any, @UploadedFile() file: any) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No file payload provided');
    }
    validateUploadedResume(file);
    return this.filesService.uploadFile(req.user, file);
  }

  /** DELETE /api/v1/files/:id */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.filesService.remove(req.user, id);
  }
}
