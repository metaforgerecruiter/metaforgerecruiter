import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  PaginatedLoginHistoryResult,
  RecruiterAttendanceService,
} from './recruiter-attendance.service';
import { QueryLoginHistoryDto } from './dto/query-login-history.dto';
import { TriggerReportDto } from './dto/trigger-report.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('recruiter-attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecruiterAttendanceController {
  constructor(private readonly attendanceService: RecruiterAttendanceService) {}

  /**
   * GET /api/v1/recruiter-attendance/history
   * Retrieve paginated recruiter login/logout history with date and criteria filters
   */
  @Get('history')
  @Roles('superadmin', 'admin', 'lead', 'devteam', 'recruiter')
  async getLoginHistory(@Query() query: QueryLoginHistoryDto): Promise<PaginatedLoginHistoryResult> {
    return this.attendanceService.getLoginHistory(query);
  }

  /**
   * GET /api/v1/recruiter-attendance/today
   * Get current working day attendance snapshot for active recruiters
   */
  @Get('today')
  @Roles('superadmin', 'admin', 'lead', 'devteam', 'recruiter')
  async getTodayAttendance(@Query('date') date?: string) {
    const data = await this.attendanceService.getTodayAttendance(date);
    return {
      success: true,
      data,
    };
  }

  /**
   * POST /api/v1/recruiter-attendance/heartbeat
   * Keep recruiter session active while browser tab is open
   */
  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  async heartbeat(@Req() req: any, @Body('sessionId') sessionId?: string) {
    const userObjectId = req.user?._id || req.user?.id || req.user?.sub;
    const result = await this.attendanceService.recordHeartbeat({
      userObjectId,
      sessionId,
    });
    return {
      success: true,
      ...result,
    };
  }

  /**
   * POST /api/v1/recruiter-attendance/trigger-report
   * Manually trigger or test daily report generation & email dispatch
   */
  @Post('trigger-report')
  @Roles('superadmin', 'admin', 'lead', 'devteam')
  @HttpCode(HttpStatus.OK)
  async triggerReport(@Body() dto: TriggerReportDto) {
    return this.attendanceService.generateAndSendDailyReport(dto);
  }
}
