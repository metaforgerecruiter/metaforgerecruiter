import { BadRequestException } from '@nestjs/common';
import * as path from 'path';

/** Align with Candidate Search & Entry UI (15 MB). */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export const RESUME_ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.bmp',
  '.tif',
  '.tiff',
]);

const EXT_TO_MIME: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword', 'application/octet-stream'],
  '.docx': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/octet-stream',
  ],
  '.txt': ['text/plain', 'application/octet-stream'],
  '.png': ['image/png'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.webp': ['image/webp'],
  '.bmp': ['image/bmp', 'image/x-ms-bmp'],
  '.tif': ['image/tiff'],
  '.tiff': ['image/tiff'],
};

const EICAR_MARK = 'EICAR-STANDARD-ANTIVIRUS-TEST-FILE';

export interface UploadLike {
  originalname?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
  path?: string;
}

function extOf(name: string): string {
  return path.extname(name || '').toLowerCase();
}

function hasPrefix(buf: Buffer, bytes: number[]): boolean {
  if (!buf || buf.length < bytes.length) return false;
  return bytes.every((b, i) => buf[i] === b);
}

function bufferLooksLikeZip(buf: Buffer): boolean {
  return hasPrefix(buf, [0x50, 0x4b, 0x03, 0x04]) || hasPrefix(buf, [0x50, 0x4b, 0x05, 0x06]);
}

function bufferLooksLikePdf(buf: Buffer): boolean {
  return buf.length >= 5 && buf.slice(0, 5).toString('latin1') === '%PDF-';
}

function bufferLooksLikePng(buf: Buffer): boolean {
  return hasPrefix(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
}

function bufferLooksLikeJpeg(buf: Buffer): boolean {
  return hasPrefix(buf, [0xff, 0xd8, 0xff]);
}

function bufferLooksLikeWebp(buf: Buffer): boolean {
  return (
    buf.length >= 12 &&
    buf.slice(0, 4).toString('latin1') === 'RIFF' &&
    buf.slice(8, 12).toString('latin1') === 'WEBP'
  );
}

function bufferLooksLikeBmp(buf: Buffer): boolean {
  return hasPrefix(buf, [0x42, 0x4d]);
}

function bufferLooksLikeTiff(buf: Buffer): boolean {
  return hasPrefix(buf, [0x49, 0x49, 0x2a, 0x00]) || hasPrefix(buf, [0x4d, 0x4d, 0x00, 0x2a]);
}

function bufferLooksLikeOleDoc(buf: Buffer): boolean {
  // Legacy .doc compound file
  return hasPrefix(buf, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
}

function isExecutableOrScript(buf: Buffer): string | null {
  if (hasPrefix(buf, [0x4d, 0x5a])) return 'Windows executable (PE/MZ)';
  if (hasPrefix(buf, [0x7f, 0x45, 0x4c, 0x46])) return 'Linux executable (ELF)';
  if (hasPrefix(buf, [0xca, 0xfe, 0xba, 0xbe]) || hasPrefix(buf, [0xcf, 0xfa, 0xed, 0xfe])) {
    return 'Mach-O executable';
  }
  const head = buf.slice(0, Math.min(buf.length, 512)).toString('utf8').toLowerCase();
  if (head.includes('<?php') || head.includes('<%=') || /^\s*<!doctype html/i.test(head) || /^\s*<html/i.test(head)) {
    return 'script/HTML content';
  }
  if (head.includes(EICAR_MARK.toLowerCase()) || buf.includes(Buffer.from(EICAR_MARK))) {
    return 'EICAR test malware signature';
  }
  return null;
}

function pdfHasActiveContent(buf: Buffer): string | null {
  // Scan a bounded window for common PDF active-content tokens
  const sample = buf.slice(0, Math.min(buf.length, 2 * 1024 * 1024)).toString('latin1');
  const dangerous = [
    /\/JavaScript\b/i,
    /\/JS\b/,
    /\/Launch\b/i,
    /\/EmbeddedFile\b/i,
    /\/AA\b/,
    /\/OpenAction\b/i,
    /\/RichMedia\b/i,
  ];
  for (const re of dangerous) {
    if (re.test(sample)) return `PDF active content matched ${re}`;
  }
  return null;
}

function docxHasMacros(buf: Buffer): string | null {
  if (!bufferLooksLikeZip(buf)) return null;
  // OOXML packages listing vbaProject.bin indicate macros
  const asLatin = buf.slice(0, Math.min(buf.length, 4 * 1024 * 1024)).toString('latin1');
  if (/vbaProject\.bin/i.test(asLatin) || /word\/macros/i.test(asLatin)) {
    return 'DOCX contains macros (vbaProject.bin)';
  }
  return null;
}

function magicMatchesExtension(ext: string, buf: Buffer): boolean {
  switch (ext) {
    case '.pdf':
      return bufferLooksLikePdf(buf);
    case '.docx':
      return bufferLooksLikeZip(buf);
    case '.doc':
      return bufferLooksLikeOleDoc(buf) || bufferLooksLikeZip(buf);
    case '.png':
      return bufferLooksLikePng(buf);
    case '.jpg':
    case '.jpeg':
      return bufferLooksLikeJpeg(buf);
    case '.webp':
      return bufferLooksLikeWebp(buf);
    case '.bmp':
      return bufferLooksLikeBmp(buf);
    case '.tif':
    case '.tiff':
      return bufferLooksLikeTiff(buf);
    case '.txt': {
      // Reject binary/control-heavy payloads disguised as text
      const sample = buf.slice(0, Math.min(buf.length, 4096));
      let weird = 0;
      for (const b of sample) {
        if (b === 0) return false;
        if (b < 7 || (b > 13 && b < 32)) weird++;
      }
      return weird / Math.max(sample.length, 1) < 0.3;
    }
    default:
      return false;
  }
}

/** Sanitize and validate filename (no path traversal / null bytes / double dangerous ext). */
export function assertSafeUploadFilename(originalname: string): string {
  const raw = String(originalname || '').trim();
  if (!raw) throw new BadRequestException('Filename is required');
  if (raw.includes('\0')) throw new BadRequestException('Filename contains illegal characters');
  const base = path.basename(raw).replace(/[<>:"|?*\\]/g, '_');
  if (!base || base === '.' || base === '..') {
    throw new BadRequestException('Invalid filename');
  }
  // Block double extensions like resume.pdf.exe
  const lower = base.toLowerCase();
  if (/\.(exe|bat|cmd|com|msi|scr|ps1|js|jar|dll|sh|php|aspx?)(\.|$)/i.test(lower.replace(/\.[^.]+$/, ''))) {
    throw new BadRequestException(`Suspicious filename rejected: ${base}`);
  }
  return base;
}

export function assertAllowedResumeExtension(originalname: string): string {
  const safeName = assertSafeUploadFilename(originalname);
  const ext = extOf(safeName);
  if (!RESUME_ALLOWED_EXTENSIONS.has(ext)) {
    throw new BadRequestException(
      `${safeName}: unsupported format. Use PDF, DOCX, DOC, TXT or an image.`,
    );
  }
  return ext;
}

export function assertUploadSize(size: number, maxBytes = MAX_UPLOAD_BYTES): void {
  if (!Number.isFinite(size) || size <= 0) {
    throw new BadRequestException('Empty file upload rejected');
  }
  if (size > maxBytes) {
    throw new BadRequestException(`File exceeds maximum size of ${Math.floor(maxBytes / (1024 * 1024))} MB`);
  }
}

export function assertMimeMatchesExtension(ext: string, mimetype?: string): void {
  if (!mimetype) return;
  const allowed = EXT_TO_MIME[ext] || [];
  const normalized = mimetype.toLowerCase().split(';')[0].trim();
  if (allowed.length && !allowed.includes(normalized) && normalized !== 'application/octet-stream') {
    throw new BadRequestException(`MIME type "${mimetype}" does not match file extension ${ext}`);
  }
}

/**
 * Content inspection for resumes/uploads: magic-byte match + lightweight malware heuristics.
 * Complements (does not replace) an enterprise AV gateway when available.
 */
export function scanUploadBuffer(originalname: string, buffer: Buffer, mimetype?: string): void {
  if (!buffer?.length) {
    throw new BadRequestException('Empty file content rejected');
  }
  assertUploadSize(buffer.length);
  const ext = assertAllowedResumeExtension(originalname);
  assertMimeMatchesExtension(ext, mimetype);

  const execHit = isExecutableOrScript(buffer);
  if (execHit) {
    throw new BadRequestException(`Malware/unsafe content detected (${execHit})`);
  }

  if (!magicMatchesExtension(ext, buffer)) {
    throw new BadRequestException(
      `${path.basename(originalname)}: file content does not match extension ${ext}`,
    );
  }

  if (ext === '.pdf') {
    const hit = pdfHasActiveContent(buffer);
    if (hit) throw new BadRequestException(`Unsafe PDF rejected (${hit})`);
  }

  if (ext === '.docx' || (ext === '.doc' && bufferLooksLikeZip(buffer))) {
    const hit = docxHasMacros(buffer);
    if (hit) throw new BadRequestException(`Unsafe Office document rejected (${hit})`);
  }
}

/** Multer fileFilter for resume uploads (extension gate before buffering completes). */
export function resumeMulterFileFilter(
  _req: any,
  file: { originalname: string; mimetype: string },
  cb: (error: Error | null, acceptFile: boolean) => void,
): void {
  try {
    const ext = assertAllowedResumeExtension(file.originalname);
    assertMimeMatchesExtension(ext, file.mimetype);
    cb(null, true);
  } catch (err: any) {
    cb(err instanceof Error ? err : new BadRequestException('Invalid upload'), false);
  }
}

/** Full validation after multer has the buffer (or after reading from disk). */
export function validateUploadedResume(file: UploadLike): void {
  const name = assertSafeUploadFilename(file.originalname || 'upload.bin');
  assertUploadSize(Number(file.size || file.buffer?.length || 0));
  if (!file.buffer?.length) {
    throw new BadRequestException('Upload buffer missing — cannot scan file');
  }
  scanUploadBuffer(name, file.buffer, file.mimetype);
}
