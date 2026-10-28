import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  ForbiddenException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AuditService, PaginatedUserAuditLogResult } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller(['audit-logs', 'audit'])
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /api/v1/audit/user-logs
   * Retrieve paginated user login/logout daily audit logs with filters
   * Accessible by Admin and Super Admin
   */
  @Get('user-logs')
  @Roles('superadmin', 'admin', 'lead', 'devteam')
  async getUserLogs(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('date') date?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedUserAuditLogResult> {
    return this.auditService.getUserLogs(req.user, {
      startDate,
      endDate,
      date,
      role,
      status,
      search,
      page,
      limit,
    });
  }

  /**
   * GET /api/v1/audit/export-csv
   * Export filtered user audit logs as CSV
   * RESTRICTION: Super Admin ONLY. Admin is strictly forbidden.
   */
  @Get('export-csv')
  @Roles('superadmin', 'devteam')
  async exportCsv(
    @Req() req: any,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('date') date?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const roleCode = String(req.user?.role || '').toLowerCase();
    if (roleCode !== 'superadmin' && roleCode !== 'devteam') {
      throw new ForbiddenException('Only Super Admin is authorized to download audit logs as CSV');
    }

    const csvContent = await this.auditService.exportLogsCsv(req.user, {
      startDate,
      endDate,
      date,
      role,
      status,
      search,
    });

    // Security alert for bulk export is recorded inside exportLogsCsv (no secrets).
    const filename = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(HttpStatus.OK).send(csvContent);
  }

  /** POST /api/v1/audit/logs  (frontend workspaceService) */
  @Post('logs')
  async create(@Req() req: any, @Body() body: Record<string, any>) {
    return this.auditService.createFromClient(req.user, body);
  }

  /** GET /api/v1/audit-logs */
  @Get()
  async findAll(
    @Req() req: any,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('category') category?: string,
    @Query('targetEntity') targetEntity?: string,
    @Query('module') module?: string,
    @Query('entity') entity?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.findAll(req.user, {
      userId,
      action,
      category,
      targetEntity,
      module,
      entity,
      status,
      startDate,
      endDate,
      search,
      page,
      limit,
    });
  }

  /** GET /api/v1/audit-logs/:id */
  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.auditService.findById(req.user, id);
  }
}
