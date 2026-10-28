import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { RecruiterAttendanceService } from './recruiter-attendance.service';

@Injectable()
export class RecruiterAttendanceSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RecruiterAttendanceSchedulerService.name);
  private checkIntervalTimer: NodeJS.Timeout | null = null;
  private cleanupIntervalTimer: NodeJS.Timeout | null = null;
  private startupTimer: NodeJS.Timeout | null = null;

  private lastPrecheckDate: string | null = null;
  private lastSentReportDate: string | null = null;

  constructor(private readonly attendanceService: RecruiterAttendanceService) {}

  onModuleInit() {
    const enabled = process.env.ATTENDANCE_SCHEDULE_ENABLED !== 'false';
    const timezone = process.env.ATTENDANCE_TIMEZONE || 'Asia/Kolkata';
    const precheckTime = process.env.ATTENDANCE_PRECHECK_TIME || '11:55';
    const reportTime = process.env.ATTENDANCE_REPORT_TIME || '12:00';
    const recipient = process.env.ATTENDANCE_RECIPIENT_EMAIL || 'offshorejobs@example.com';

    this.logger.log(
      `Recruiter Attendance Scheduler initialized. Enabled: ${enabled}, Pre-check: ${precheckTime} IST, Report: ${reportTime} IST, Recipient DL: ${recipient}, Timezone: ${timezone}`,
    );

    if (!enabled) {
      this.logger.log('Recruiter Attendance Scheduler is disabled via ATTENDANCE_SCHEDULE_ENABLED=false');
      return;
    }

    // 1. Startup grace period check: Catch up missed report if server started after 12:00 PM IST on a working day
    this.startupTimer = setTimeout(() => {
      this.checkAndCatchUpMissedReport().catch((err) => {
        this.logger.error(`Error during startup attendance catchup check: ${err.message}`, err.stack);
      });
    }, 8000);

    // 2. High-precision schedule tick: checks every 30 seconds
    this.checkIntervalTimer = setInterval(() => {
      this.handleScheduleTick().catch((err) => {
        this.logger.error(`Error in attendance scheduler tick: ${err.message}`, err.stack);
      });
    }, 30 * 1000);

    // 3. Periodic session maintenance: expires stale/abandoned sessions every 10 minutes
    this.cleanupIntervalTimer = setInterval(() => {
      this.attendanceService.expireInactiveSessions().catch((err) => {
        this.logger.error(`Error during session expiration cleanup: ${err.message}`, err.stack);
      });
    }, 10 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.checkIntervalTimer) {
      clearInterval(this.checkIntervalTimer);
      this.checkIntervalTimer = null;
    }
    if (this.cleanupIntervalTimer) {
      clearInterval(this.cleanupIntervalTimer);
      this.cleanupIntervalTimer = null;
    }
    if (this.startupTimer) {
      clearTimeout(this.startupTimer);
      this.startupTimer = null;
    }
    this.logger.log('Recruiter Attendance Scheduler stopped.');
  }

  /**
   * Main recurring tick handler (runs every 30s)
   */
  async handleScheduleTick() {
    const now = new Date();
    const tz = process.env.ATTENDANCE_TIMEZONE || 'Asia/Kolkata';

    // Format IST components
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const parts = formatter.formatToParts(now);
    let hour = '00';
    let minute = '00';
    let weekday = '';
    let year = '';
    let month = '';
    let day = '';

    for (const p of parts) {
      if (p.type === 'hour') hour = p.value;
      if (p.type === 'minute') minute = p.value;
      if (p.type === 'weekday') weekday = p.value;
      if (p.type === 'year') year = p.value;
      if (p.type === 'month') month = p.value;
      if (p.type === 'day') day = p.value;
    }

    const currentTimeStr = `${hour}:${minute}`;
    const todayDateStr = `${year}-${month}-${day}`;

    // Weekend guard (do not send notifications on Saturdays or Sundays)
    if (weekday === 'Sat' || weekday === 'Sun') {
      return;
    }

    // Configurable holiday guard
    const excludedDates = this.attendanceService.getExcludedDates();
    if (excludedDates.includes(todayDateStr)) {
      return;
    }

    const precheckTargetTime = process.env.ATTENDANCE_PRECHECK_TIME || '11:55';
    const reportTargetTime = process.env.ATTENDANCE_REPORT_TIME || '12:00';

    // 1. Check at 11:55 AM IST (Pre-check activity)
    if (currentTimeStr === precheckTargetTime && this.lastPrecheckDate !== todayDateStr) {
      this.lastPrecheckDate = todayDateStr;
      this.logger.log(`[Scheduler] 12:00 PM Pre-Check triggered for ${todayDateStr}`);
      try {
        const attendance = await this.attendanceService.getTodayAttendance(todayDateStr, '12:00');
        this.logger.log(
          `[Scheduler] 12:00 PM Pre-Check Summary: Monitored (Recruiters & Leads): ${attendance.totalRecruiters}, Logged In: ${attendance.loggedInCount}, Missing: ${attendance.missingCount}. Final check scheduled at 12:00 PM IST.`,
        );
      } catch (err: any) {
        this.logger.error(`Error during 12:00 PM IST pre-check: ${err.message}`, err.stack);
      }
    }

    // 2. Send email at 12:00 PM IST (Daily Attendance Report for missing logins)
    if (currentTimeStr === reportTargetTime && this.lastSentReportDate !== todayDateStr) {
      this.lastSentReportDate = todayDateStr;
      this.logger.log(`[Scheduler] 12:00 PM IST Report Triggered for ${todayDateStr}`);
      try {
        const result = await this.attendanceService.generateAndSendDailyReport({
          targetDate: todayDateStr,
        });
        if (result?.skipped) {
          this.logger.log(`[Scheduler] Report dispatch skipped: ${result.reason}`);
        } else {
          this.logger.log(`[Scheduler] 12:00 PM IST Report dispatch completed successfully for ${todayDateStr}`);
        }
      } catch (err: any) {
        this.logger.error(`[Scheduler] Error sending 12:00 PM IST attendance report: ${err.message}`, err.stack);
      }
    }
  }

  /**
   * Catch up on startup: If server was restarted between 12:00 PM and 18:00 (6:00 PM) IST on a weekday,
   * verify if today's report was already sent. If missing, process it!
   */
  private async checkAndCatchUpMissedReport() {
    const catchupEnabled = process.env.ATTENDANCE_CATCHUP_ENABLED !== 'false';
    if (!catchupEnabled) return;

    const now = new Date();
    const tz = process.env.ATTENDANCE_TIMEZONE || 'Asia/Kolkata';
    const todayDateStr = this.attendanceService.getISTDateString(now);

    if (!this.attendanceService.isWorkingDayIST(now)) return;
    if (this.attendanceService.getExcludedDates().includes(todayDateStr)) return;

    // Determine current hour in IST
    const istHourStr = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
    }).format(now);
    const istHour = parseInt(istHourStr, 10);

    const istMinuteStr = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      minute: 'numeric',
    }).format(now);
    const istMinute = parseInt(istMinuteStr, 10);

    // If time is past 12:00 PM and before 6:00 PM IST
    const isPastReportTime = istHour > 12 || (istHour === 12 && istMinute >= 0);
    const isBeforeEvening = istHour < 18;

    if (isPastReportTime && isBeforeEvening) {
      this.logger.log(`[Scheduler] Startup check: Current time is past 12:00 PM IST on weekday ${todayDateStr}. Verifying if report was dispatched...`);
      try {
        const res = await this.attendanceService.generateAndSendDailyReport({
          targetDate: todayDateStr,
        });
        if (res?.skipped) {
          this.logger.log(`[Scheduler] Catch-up check: Report for ${todayDateStr} is already handled (${res.reason}). No action needed.`);
        } else if (res?.success) {
          this.logger.log(`[Scheduler] Catch-up SUCCESS: Dispatched report for ${todayDateStr}.`);
          this.lastSentReportDate = todayDateStr;
        }
      } catch (err: any) {
        this.logger.error(`Failed to dispatch catchup report: ${err.message}`, err.stack);
      }
    }
  }
}
