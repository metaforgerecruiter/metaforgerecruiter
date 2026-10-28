import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { RescheduleInterviewDto } from './dto/reschedule-interview.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { CancelInterviewDto } from './dto/cancel-interview.dto';

@Controller('interviews')
@UseGuards(JwtAuthGuard)
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  /** GET /api/v1/interviews */
  @Get()
  async findAll(
    @Req() req: any,
    @Query('candidateId') candidateId?: string,
    @Query('submissionId') submissionId?: string,
    @Query('requirementId') requirementId?: string,
    @Query('status') status?: string,
    @Query('round') round?: string,
    @Query('search') search?: string,
  ) {
    return this.interviewsService.findAll(req.user, {
      candidateId,
      submissionId,
      requirementId,
      status,
      round,
      search,
    });
  }

  /** GET /api/v1/interviews/:id */
  @Get(':id')
  async findById(@Param('id') id: string, @Req() req: any) {
    return this.interviewsService.findById(id, req.user);
  }

  /** POST /api/v1/interviews */
  @Post()
  @Roles('superadmin', 'admin', 'lead', 'recruiter', 'devteam')
  @RequirePermission('int_schedule')
  async create(@Body() dto: CreateInterviewDto, @Req() req: any) {
    return this.interviewsService.create(dto, req.user);
  }

  /** PUT /api/v1/interviews/:id/reschedule */
  @Put(':id/reschedule')
  @HttpCode(HttpStatus.OK)
  async reschedule(
    @Param('id') id: string,
    @Body() dto: RescheduleInterviewDto,
    @Req() req: any,
  ) {
    return this.interviewsService.reschedule(id, dto, req.user);
  }

  /** PUT /api/v1/interviews/:id/feedback */
  @Put(':id/feedback')
  @Roles('superadmin', 'admin', 'lead', 'recruiter', 'devteam', 'client')
  @RequirePermission('int_feedback')
  @HttpCode(HttpStatus.OK)
  async submitFeedback(
    @Param('id') id: string,
    @Body() dto: SubmitFeedbackDto,
    @Req() req: any,
  ) {
    return this.interviewsService.submitFeedback(id, dto, req.user);
  }

  /** POST /api/v1/interviews/:id/feedback (Alternative path called by frontend workspaceService) */
  @Post(':id/feedback')
  @HttpCode(HttpStatus.OK)
  async submitFeedbackPost(
    @Param('id') id: string,
    @Body() dto: SubmitFeedbackDto,
    @Req() req: any,
  ) {
    return this.interviewsService.submitFeedback(id, dto, req.user);
  }

  /** POST /api/v1/interviews/:id/cancel */
  @Post(':id/cancel')
  @Roles('superadmin', 'admin', 'lead', 'devteam')
  @RequirePermission('int_cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelInterviewDto,
    @Req() req: any,
  ) {
    return this.interviewsService.cancel(id, dto, req.user);
  }

  /** DELETE /api/v1/interviews/:id */
  @Delete(':id')
  async softDelete(@Param('id') id: string, @Req() req: any) {
    return this.interviewsService.softDelete(id, req.user);
  }
}
