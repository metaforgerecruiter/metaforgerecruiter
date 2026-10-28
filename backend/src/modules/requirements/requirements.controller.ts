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

import { RequirementsService } from './requirements.service';
import { MailExtractionSchedulerService } from './mail-extraction-scheduler.service';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { AssignRequirementDto } from './dto/assign-requirement.dto';
import { RevokeRequirementDto } from './dto/revoke-requirement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@Controller('requirements')
@UseGuards(JwtAuthGuard)
export class RequirementsController {
  constructor(
    private readonly requirementsService: RequirementsService,
    private readonly schedulerService: MailExtractionSchedulerService,
  ) {}

  /** GET /api/v1/requirements */
  @Get()
  async findAll(
    @Query() query: { status?: string; priority?: string; clientId?: string; search?: string },
    @Req() req: any,
  ) {
    return this.requirementsService.findAll(req.user, query);
  }

  /** PUT /api/v1/requirements/bulk (MUST precede :id route) */
  @Put('bulk')
  @Roles('superadmin', 'admin', 'lead', 'devteam')
  @RequirePermission('req_edit')
  async bulkUpdate(@Body() body: any[], @Req() req: any) {
    return this.requirementsService.bulkUpdate(body, req.user);
  }

  /** POST /api/v1/requirements/sync-emails */
  @Post('sync-emails')
  @Roles('superadmin', 'admin', 'lead', 'devteam', 'recruiter')
  @HttpCode(HttpStatus.OK)
  async syncEmails(@Body() body: { limit?: number }, @Req() req: any) {
    return this.requirementsService.syncEmails(body?.limit || 25);
  }

  /** POST /api/v1/requirements/backfill-historical */
  @Post('backfill-historical')
  @Roles('superadmin', 'admin', 'lead', 'devteam')
  @HttpCode(HttpStatus.OK)
  async backfillHistorical(@Body() body: { days?: number; force?: boolean; limit?: number }) {
    return this.requirementsService.backfillHistorical(body);
  }

  /** GET /api/v1/requirements/sync-status */
  @Get('sync-status')
  async getSyncStatus() {
    return this.requirementsService.getSyncStatus();
  }

  /** GET /api/v1/requirements/scheduler-status */
  @Get('scheduler-status')
  async getSchedulerStatus() {
    return this.schedulerService.getStatus();
  }

  /** GET /api/v1/requirements/:id/original-email */
  @Get(':id/original-email')
  async getOriginalEmail(@Param('id') id: string, @Req() req: any) {
    return this.requirementsService.getOriginalEmail(id, req.user);
  }

  /** GET /api/v1/requirements/:id */
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.requirementsService.findById(id, req.user);
  }

  /** POST /api/v1/requirements */
  @Post()
  @Roles('superadmin', 'admin', 'lead', 'devteam')
  @RequirePermission('req_create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateRequirementDto, @Req() req: any) {
    return this.requirementsService.create(dto, req.user);
  }

  /** PUT /api/v1/requirements/:id */
  @Put(':id')
  @Roles('superadmin', 'admin', 'lead', 'devteam', 'recruiter')
  @RequirePermission('req_edit')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRequirementDto,
    @Req() req: any,
  ) {
    return this.requirementsService.update(id, dto, req.user);
  }

  /** POST /api/v1/requirements/:id/assign */
  @Post(':id/assign')
  @Roles('superadmin', 'admin', 'lead', 'devteam', 'recruiter')
  @RequirePermission('req_assign')
  @HttpCode(HttpStatus.OK)
  async assign(
    @Param('id') id: string,
    @Body() dto: AssignRequirementDto,
    @Req() req: any,
  ) {
    return this.requirementsService.assign(id, dto, req.user);
  }

  /** POST /api/v1/requirements/:id/revoke */
  @Post(':id/revoke')
  @Roles('superadmin', 'admin', 'lead', 'devteam', 'recruiter')
  @RequirePermission('req_assign')
  @HttpCode(HttpStatus.OK)
  async revoke(
    @Param('id') id: string,
    @Body() dto: RevokeRequirementDto,
    @Req() req: any,
  ) {
    return this.requirementsService.revoke(id, dto, req.user);
  }

  /** DELETE /api/v1/requirements/:id */
  @Delete(':id')
  @Roles('superadmin', 'admin', 'devteam')
  @RequirePermission('req_delete')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.requirementsService.softDelete(id, req.user);
  }
}
