import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import {
  parseResumeBuffer,
  parseResumeBuffersBulk,
  isMetaforgeParserAvailable,
  getAiParsingSuspendedReason,
} from '../metaforgeParser';

/**
 * In-memory upload for resume text extraction (no disk writes).
 * Supports standard PDF, Word documents, text files, and scanned images.
 */
/**
 * Validates file signature (magic bytes) against declared extension to prevent spoofing
 */
export function isValidResumeSignature(buffer: Buffer, filename: string): boolean {
  if (!buffer || buffer.length < 4) return false;
  const ext = path.extname(filename).toLowerCase();

  if (ext === '.pdf') {
    return buffer.slice(0, 5).toString('ascii').startsWith('%PDF');
  }
  if (ext === '.docx') {
    return buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
  }
  if (ext === '.doc') {
    return buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0;
  }
  if (ext === '.png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  }
  if (ext === '.jpg' || ext === '.jpeg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }
  if (ext === '.webp') {
    return buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';
  }
  if (ext === '.bmp') {
    return buffer[0] === 0x42 && buffer[1] === 0x4D;
  }
  if (ext === '.tif' || ext === '.tiff') {
    return (buffer[0] === 0x49 && buffer[1] === 0x49) || (buffer[0] === 0x4D && buffer[1] === 0x4D);
  }
  if (ext === '.txt') {
    return true;
  }
  return false;
}

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = new Set([
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
  if (!allowed.has(ext)) {
    return cb(new Error(`File format ${ext} is not supported. Supported: PDF, DOCX, DOC, TXT, and common image formats.`));
  }
  return cb(null, true);
};

/**
 * 2026 Baseline limits: 5 MB limit, one file per single request
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter,
});

const bulkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter,
});

export const resumeParserRouter = Router();

/**
 * @route   GET /health
 * @desc    Check parser status and AI availability
 */
resumeParserRouter.get('/health', (_req: Request, res: Response) => {
  const aiAvailable = isMetaforgeParserAvailable();
  const suspendedReason = getAiParsingSuspendedReason();

  res.json({
    status: 'ok',
    service: 'resume-parser-module',
    aiParserAvailable: aiAvailable,
    aiSuspendedNotice: suspendedReason,
    mode: aiAvailable && !suspendedReason ? 'hybrid-ai-with-fallback' : 'local-deterministic',
  });
});

/**
 * @route   POST /parse
 * @desc    Parse a single resume file (5MB limit, magic-byte validated)
 * @body    multipart/form-data with field name 'resume' (or 'file')
 */
resumeParserRouter.post(
  '/parse',
  (req, res, next) => {
    req.setTimeout(5 * 60 * 1000);
    res.setTimeout(5 * 60 * 1000);
    next();
  },
  upload.single('resume'),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file?.buffer) {
        res.status(400).json({
          success: false,
          message: 'Resume file is required under form field "resume"',
        });
        return;
      }

      const filename = file.originalname || 'resume.pdf';
      if (!isValidResumeSignature(file.buffer, filename)) {
        res.status(400).json({
          success: false,
          message: `Invalid file signature for ${filename}. File content does not match declared extension.`,
        });
        return;
      }

      const parsed = await parseResumeBuffer(file.buffer, filename);

      res.json({
        success: true,
        message: 'Resume parsed successfully',
        data: parsed,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to parse resume',
      });
    }
  }
);

/**
 * @route   POST /parse/bulk
 * @desc    Parse multiple resumes (up to 5, 5MB each, magic-byte validated)
 * @body    multipart/form-data with field name 'resumes' (or 'files')
 */
resumeParserRouter.post(
  '/parse/bulk',
  (req, res, next) => {
    req.setTimeout(10 * 60 * 1000);
    res.setTimeout(10 * 60 * 1000);
    next();
  },
  bulkUpload.array('resumes', 5),
  async (req: Request, res: Response) => {
    try {
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      if (!files.length) {
        res.status(400).json({
          success: false,
          message: 'At least one resume file is required under form field "resumes"',
        });
        return;
      }

      if (files.length > 5) {
        res.status(400).json({
          success: false,
          message: 'Maximum 5 resumes allowed per batch upload',
        });
        return;
      }

      // Check file signatures
      for (const f of files) {
        if (f?.buffer && !isValidResumeSignature(f.buffer, f.originalname || '')) {
          res.status(400).json({
            success: false,
            message: `Invalid file signature for ${f.originalname}. File content does not match declared extension.`,
          });
          return;
        }
      }

      const inputs = files
        .filter((f) => f?.buffer)
        .map((f) => ({
          buffer: f.buffer,
          filename: f.originalname || 'resume.pdf',
        }));

      if (!inputs.length) {
        res.status(400).json({
          success: false,
          message: 'No valid resume file buffers received',
        });
        return;
      }

      const results = await parseResumeBuffersBulk(inputs);
      const usedLegacy = results.some((r) => r.status === 'done' && r.data.parser === 'legacy');
      const aiNotice = getAiParsingSuspendedReason();

      res.json({
        success: true,
        message: 'Bulk resume parse completed',
        count: results.length,
        parser:
          isMetaforgeParserAvailable() && !usedLegacy && !aiNotice ? 'metaforge' : 'legacy',
        notice: aiNotice,
        results,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Bulk resume parse failed',
      });
    }
  }
);

export default resumeParserRouter;
