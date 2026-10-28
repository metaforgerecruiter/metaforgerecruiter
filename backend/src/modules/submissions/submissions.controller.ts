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
import { SubmissionsService } from './submissions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { LeadApprovalDto } from './dto/lead-approval.dto';
import { ForwardClientDto } from './dto/forward-client.dto';

@Controller('submissions')
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  /** GET /api/v1/submissions */
  @Get()
  async findAll(
    @Req() req: any,
    @Query('stage') stage?: string,
    @Query('recruiterId') recruiterId?: string,
    @Query('leadId') leadId?: string,
    @Query('clientId') clientId?: string,
    @Query('requirementId') requirementId?: string,
    @Query('candidateId') candidateId?: string,
    @Query('search') search?: string,
  ) {
    return this.submissionsService.findAll(req.user, {
      stage,
      recruiterId,
      leadId,
      clientId,
      requirementId,
      candidateId,
      search,
    });
  }

  /** GET /api/v1/submissions/:id */
  @Get(':id')
  async findById(@Param('id') id: string, @Req() req: any) {
    return this.submissionsService.findById(id, req.user);
  }

  /** POST /api/v1/submissions */
  @Post()
  @Roles('superadmin', 'admin', 'lead', 'recruiter', 'devteam')
  @RequirePermission('sub_create')
  async create(@Body() dto: CreateSubmissionDto, @Req() req: any) {
    return this.submissionsService.create(dto, req.user);
  }

  /** PUT /api/v1/submissions/:id/stage */
  @Put(':id/stage')
  @Roles('superadmin', 'admin', 'lead', 'recruiter', 'devteam')
  @RequirePermission('sub_move_stage')
  async updateStage(
    @Param('id') id: string,
    @Body() dto: UpdateStageDto,
    @Req() req: any,
  ) {
    return this.submissionsService.updateStage(id, dto, req.user);
  }

  /** POST /api/v1/submissions/:id/lead-approval */
  @Post(':id/lead-approval')
  @Roles('superadmin', 'admin', 'lead', 'devteam')
  @RequirePermission('sub_view_all')
  @HttpCode(HttpStatus.OK)
  async leadApproval(
    @Param('id') id: string,
    @Body() dto: LeadApprovalDto,
    @Req() req: any,
  ) {
    return this.submissionsService.leadApproval(id, dto, req.user);
  }

  /** POST /api/v1/submissions/:id/forward-client */
  @Post(':id/forward-client')
  @HttpCode(HttpStatus.OK)
  async forwardClient(
    @Param('id') id: string,
    @Body() dto: ForwardClientDto,
    @Req() req: any,
  ) {
    return this.submissionsService.forwardClient(id, dto, req.user);
  }

  /** DELETE /api/v1/submissions/:id */
  @Delete(':id')
  @Roles('superadmin', 'admin', 'lead', 'devteam')
  @RequirePermission('sub_reassign')
  async softDelete(@Param('id') id: string, @Req() req: any) {
    return this.submissionsService.softDelete(id, req.user);
  }
}
