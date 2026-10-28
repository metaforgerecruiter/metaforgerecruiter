import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/** Uploaded file as provided by multer (memory storage). */
export interface UploadedResume {
  buffer: Buffer;
  originalname: string;
  size: number;
  mimetype?: string;
}

/** Normalized candidate fields returned to the Candidate Search & Entry page. */
export interface ParsedResume {
  candidateName: string | null;
  email: string | null;
  contactNumber: string | null;
  linkedInUrl: string | null;
  qualification: string | null;
  skills: string | null;
  technologies: string | null;
  totalExperience: string | null;
  relevantExperience: string | null;
  currentCompany: string | null;
  currentLocation: string | null;
  sourceFile: string;
  parser: 'metaforge' | 'legacy' | string;
}

export interface BulkParseResult {
  sourceFile: string;
  status: 'done' | 'error';
  data?: ParsedResume;
  error?: string;
}

export {
  RESUME_ALLOWED_EXTENSIONS as RESUME_EXTENSIONS,
  MAX_UPLOAD_BYTES as MAX_RESUME_BYTES,
} from '../../common/security/upload-validation.util';
export const MAX_BULK_RESUMES = 5;

/**
 * Bridges the standalone resume-parser module (../resume-parser-module-ready) into the backend.
 * The module is loaded from its compiled dist at runtime so it keeps its own dependencies
 * (pdf-parse, mammoth, OCR) and its own Gemini configuration.
 */
@Injectable()
export class ResumeParserService implements OnModuleInit {
  private readonly logger = new Logger(ResumeParserService.name);
  private lib: any = null;
  private loadError: string | null = null;

  onModuleInit() {
    const dir = process.env.RESUME_PARSER_DIR || path.resolve(process.cwd(), '..', 'resume-parser-module-ready');
    try {
      this.loadGeminiSettings(path.join(dir, '.env'));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.lib = require(path.join(dir, 'dist'));
      const h = this.health();
      this.logger.log(`Resume parser loaded from ${dir} (mode: ${h.mode})`);
    } catch (err: any) {
      this.loadError = `Resume parser module not available at ${dir}: ${err?.message}`;
      this.logger.error(this.loadError);
    }
  }

  /** Copy only the module's GEMINI_* settings into the environment (never overrides existing values). */
  private loadGeminiSettings(envFile: string) {
    if (!fs.existsSync(envFile)) return;
    for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*(GEMINI_[A-Z_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const value = m[2].replace(/^["']|["']$/g, '').trim();
      if (value && !process.env[m[1]]) process.env[m[1]] = value;
    }
  }

  private requireLib() {
    if (!this.lib) throw new ServiceUnavailableException(this.loadError || 'Resume parser is not loaded');
    return this.lib;
  }

  health() {
    if (!this.lib) return { status: 'unavailable', error: this.loadError, mode: 'unavailable' };
    const aiAvailable = !!this.lib.isMetaforgeParserAvailable?.();
    const suspended = this.lib.getAiParsingSuspendedReason?.() || null;
    return {
      status: 'ok',
      aiParserAvailable: aiAvailable,
      aiSuspendedNotice: suspended,
      mode: aiAvailable && !suspended ? 'hybrid-ai-with-fallback' : 'local-deterministic',
    };
  }

  async parseOne(file: UploadedResume): Promise<ParsedResume> {
    const raw = await this.requireLib().parseResumeBuffer(file.buffer, file.originalname || 'resume.pdf');
    return normalize(raw, file.originalname);
  }

  async parseMany(files: UploadedResume[]): Promise<BulkParseResult[]> {
    const results = await this.requireLib().parseResumeBuffersBulk(
      files.map((f) => ({ buffer: f.buffer, filename: f.originalname || 'resume.pdf' })),
    );
    return (results as any[]).map((r) =>
      r.status === 'done'
        ? { sourceFile: r.sourceFile, status: 'done' as const, data: normalize(r.data, r.sourceFile) }
        : { sourceFile: r.sourceFile, status: 'error' as const, error: r.error || 'Failed to parse resume' },
    );
  }
}

function text(v: unknown): string | null {
  const s = String(v ?? '').trim();
  return s && !['null', 'undefined', 'n/a', 'na'].includes(s.toLowerCase()) ? s : null;
}

/** "+91 98765 43210" -> "+919876543210" (the module's documented format). */
function normalizePhone(v: unknown): string | null {
  const s = text(v);
  if (!s) return null;
  // If multiple phone numbers are separated by comma, slash, pipe, newline, or 'or', take the first one
  const firstPart = s.split(/[\/,|\n]|(?:\bor\b)/i)[0].trim();
  const digits = firstPart.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  if (!digits) return null;
  // If digits were glued together without delimiter (e.g. +919067528514919167483752), take the first valid phone
  if (digits.startsWith('+91') && digits.length > 13) {
    return digits.slice(0, 13);
  }
  if (digits.length > 15) {
    return digits.slice(0, 12);
  }
  return digits || null;
}

function normalize(raw: any, filename: string): ParsedResume {
  return {
    candidateName: text(raw?.candidateName),
    email: text(raw?.email),
    contactNumber: normalizePhone(raw?.contactNumber),
    linkedInUrl: text(raw?.linkedinUrl ?? raw?.linkedInUrl),
    qualification: text(raw?.highestQualification),
    skills: text(raw?.skillsRaw),
    // Technologies form field = designation/role only (not skills list).
    technologies: text(raw?.technologiesRaw ?? raw?.role ?? raw?.technologies),
    totalExperience: text(raw?.totalExperience),
    relevantExperience: text(raw?.relevantExperience),
    currentCompany: text(raw?.currentEmployer),
    currentLocation: text(raw?.currentLocation ?? raw?.location),
    sourceFile: text(raw?.sourceFile) || filename,
    parser: raw?.parser || 'legacy',
  };
}
