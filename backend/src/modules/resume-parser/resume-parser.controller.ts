import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  MAX_UPLOAD_BYTES,
  resumeMulterFileFilter,
  validateUploadedResume,
} from '../../common/security/upload-validation.util';
import {
  MAX_BULK_RESUMES,
  ResumeParserService,
  UploadedResume,
} from './resume-parser.service';

const uploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: MAX_BULK_RESUMES },
  fileFilter: resumeMulterFileFilter,
};

/** Resume parsing for the Candidate Search & Entry page (single and bulk). */
@Controller('resume-parser')
@UseGuards(JwtAuthGuard)
export class ResumeParserController {
  constructor(private readonly parser: ResumeParserService) {}

  /** GET /api/v1/resume-parser/health */
  @Get('health')
  health() {
    return this.parser.health();
  }

  /** POST /api/v1/resume-parser/parse  (multipart field "resume") */
  @Post('parse')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('resume', uploadOptions))
  async parse(@UploadedFile() file?: UploadedResume) {
    if (!file?.buffer?.length) throw new BadRequestException('Upload a resume under the form field "resume"');
    validateUploadedResume(file);
    return { success: true, data: await this.parser.parseOne(file) };
  }

  /** POST /api/v1/resume-parser/parse/bulk  (multipart field "resumes", up to 5 per request) */
  @Post('parse/bulk')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('resumes', MAX_BULK_RESUMES, uploadOptions))
  async parseBulk(@UploadedFiles() files?: UploadedResume[]) {
    const valid = (files || []).filter((f) => f?.buffer?.length);
    if (!valid.length) throw new BadRequestException('Upload at least one resume under the form field "resumes"');
    if (valid.length > MAX_BULK_RESUMES) {
      throw new BadRequestException(`Maximum limit of ${MAX_BULK_RESUMES} resumes allowed per bulk import request.`);
    }
    for (const f of valid) {
      validateUploadedResume(f);
    }
    const results = await this.parser.parseMany(valid.slice(0, MAX_BULK_RESUMES));
    return {
      success: true,
      count: results.length,
      parsed: results.filter((r) => r.status === 'done').length,
      failed: results.filter((r) => r.status === 'error').length,
      notice: this.parser.health().aiSuspendedNotice || null,
      results,
    };
  }
}
