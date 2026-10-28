import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /** GET /api/v1/analytics/dashboard */
  @Get('dashboard')
  async getDashboardSummary(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('recruiterId') recruiterId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.analyticsService.getDashboardSummary(req.user, {
      startDate,
      endDate,
      recruiterId,
      clientId,
    });
  }

  /** GET /api/v1/analytics/requirements */
  @Get('requirements')
  async getRequirementStats(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.analyticsService.getRequirementStats(req.user, {
      startDate,
      endDate,
      clientId,
      status,
      priority,
    });
  }

  /** GET /api/v1/analytics/candidates */
  @Get('candidates')
  async getCandidateStats(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    return this.analyticsService.getCandidateStats(req.user, {
      startDate,
      endDate,
      status,
    });
  }

  /** GET /api/v1/analytics/submissions */
  @Get('submissions')
  async getSubmissionStats(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('recruiterId') recruiterId?: string,
    @Query('leadId') leadId?: string,
    @Query('clientId') clientId?: string,
    @Query('stage') stage?: string,
  ) {
    return this.analyticsService.getSubmissionStats(req.user, {
      startDate,
      endDate,
      recruiterId,
      leadId,
      clientId,
      stage,
    });
  }

  /** GET /api/v1/analytics/interviews */
  @Get('interviews')
  async getInterviewStats(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('round') round?: string,
    @Query('interviewerEmail') interviewerEmail?: string,
  ) {
    return this.analyticsService.getInterviewStats(req.user, {
      startDate,
      endDate,
      status,
      round,
      interviewerEmail,
    });
  }

  /** GET /api/v1/analytics/offers */
  @Get('offers')
  async getOfferStats(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    return this.analyticsService.getOfferStats(req.user, {
      startDate,
      endDate,
      status,
    });
  }

  /** GET /api/v1/analytics/clients */
  @Get('clients')
  async getClientStats(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tier') tier?: string,
    @Query('status') status?: string,
  ) {
    return this.analyticsService.getClientStats(req.user, {
      startDate,
      endDate,
      tier,
      status,
    });
  }

  /** GET /api/v1/analytics/recruiters */
  @Get('recruiters')
  async getRecruiterStats(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('recruiterId') recruiterId?: string,
  ) {
    return this.analyticsService.getRecruiterStats(req.user, {
      startDate,
      endDate,
      recruiterId,
    });
  }
}
