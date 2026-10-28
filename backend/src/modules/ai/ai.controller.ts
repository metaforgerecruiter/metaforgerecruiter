import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  /** POST /api/v1/ai/match */
  @Post('match')
  async matchCandidateWithRequirement(
    @Req() req: any,
    @Body() dto: { candidateId: string; requirementId: string },
  ) {
    return this.aiService.matchCandidateWithRequirement(req.user, dto);
  }

  /** POST /api/v1/ai/search */
  @Post('search')
  async searchCandidates(
    @Req() req: any,
    @Body()
    dto: {
      query?: string;
      skills?: string[];
      minExperience?: number;
      maxExperience?: number;
      limit?: number;
    },
  ) {
    return this.aiService.searchCandidates(req.user, dto);
  }

  /** POST /api/v1/ai/parse-resume */
  @Post('parse-resume')
  async parseResume(
    @Req() req: any,
    @Body() dto: { resumeText?: string; fileId?: string },
  ) {
    return this.aiService.parseResume(req.user, dto);
  }

  /** POST /api/v1/ai/enrich */
  @Post('enrich')
  async enrichCandidate(
    @Req() req: any,
    @Body() dto: { candidateId: string; resumeText?: string },
  ) {
    return this.aiService.enrichCandidate(req.user, dto);
  }

  /** GET /api/v1/ai/match-scores */
  @Get('match-scores')
  async getMatchScores(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.aiService.getMatchScores(req.user, page, limit);
  }
}
