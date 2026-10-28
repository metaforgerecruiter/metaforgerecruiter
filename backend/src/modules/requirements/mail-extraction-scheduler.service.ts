import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { RequirementsService } from './requirements.service';

@Injectable()
export class MailExtractionSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailExtractionSchedulerService.name);
  private intervalTimer: NodeJS.Timeout | null = null;
  private startupTimer: NodeJS.Timeout | null = null;
  private isRunningJob = false;
  private initialBackfillCompleted = false;
  private lastRunAt: Date | null = null;
  private nextRunAt: Date | null = null;
  private lastResult: any = null;

  constructor(private readonly requirementsService: RequirementsService) {}

  onModuleInit() {
    const enabled = process.env.MAIL_EXTRACTION_SCHEDULE_ENABLED !== 'false';
    const intervalMinutes = parseInt(process.env.MAIL_EXTRACTION_INTERVAL_MINUTES || '2', 10);
    const timezone = process.env.MAIL_EXTRACTION_TIMEZONE || 'Asia/Kolkata';

    this.logger.log(
      `Auto Mail Extraction Scheduler initialized. Enabled: ${enabled}, Interval: ${intervalMinutes}m, Timezone: ${timezone}`,
    );

    if (!enabled) {
      this.logger.log('Auto Mail Extraction Scheduler is disabled via MAIL_EXTRACTION_SCHEDULE_ENABLED=false');
      return;
    }

    // Schedule initial historical backfill (yesterday & day before yesterday) after 6s grace period
    const runInitialBackfill = process.env.MAIL_EXTRACTION_INITIAL_BACKFILL !== 'false';
    if (runInitialBackfill) {
      this.logger.log('Scheduling initial historical email backfill (yesterday + day before yesterday) in 6 seconds...');
      this.startupTimer = setTimeout(() => {
        this.runInitialHistoricalBackfill().catch((err) => {
          this.logger.error(`Initial historical backfill failed: ${err.message}`, err.stack);
        });
      }, 6000);
    }

    // Start periodic recurring sync
    const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;
    this.nextRunAt = new Date(Date.now() + intervalMs);

    this.intervalTimer = setInterval(() => {
      this.triggerScheduledSync().catch((err) => {
        this.logger.error(`Scheduled mail extraction error: ${err.message}`, err.stack);
      });
    }, intervalMs);
  }

  onModuleDestroy() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    if (this.startupTimer) {
      clearTimeout(this.startupTimer);
      this.startupTimer = null;
    }
    this.logger.log('Auto Mail Extraction Scheduler stopped.');
  }

  /** Run initial historical backfill for yesterday and the day before yesterday */
  async runInitialHistoricalBackfill(opts?: { days?: number; force?: boolean }): Promise<any> {
    if (this.isRunningJob || this.requirementsService.getSyncStatus().status === 'running') {
      this.logger.warn('Skipping historical backfill: a mail extraction process is already running.');
      return { skipped: true, reason: 'Already running' };
    }

    this.isRunningJob = true;
    const days = opts?.days || parseInt(process.env.MAIL_EXTRACTION_HISTORICAL_DAYS || '2', 10);
    this.logger.log(`[Scheduler] Starting historical requirements backfill for past ${days} day(s)...`);

    try {
      const res = await this.requirementsService.backfillHistorical({ days, force: opts?.force });
      this.initialBackfillCompleted = true;
      this.lastRunAt = new Date();
      this.lastResult = res;
      return res;
    } finally {
      this.isRunningJob = false;
    }
  }

  /** Run periodic sync for new incoming requirement emails */
  async triggerScheduledSync(limit = 25): Promise<any> {
    const currentSyncStatus = this.requirementsService.getSyncStatus();
    if (this.isRunningJob || currentSyncStatus.status === 'running') {
      this.logger.warn('Overlapping sync prevented: a mail extraction job is already in progress.');
      return { skipped: true, reason: 'Already in progress' };
    }

    this.isRunningJob = true;
    this.logger.log(`[Scheduler] Executing scheduled mail extraction (limit: ${limit})...`);

    const intervalMinutes = parseInt(process.env.MAIL_EXTRACTION_INTERVAL_MINUTES || '2', 10);
    this.lastRunAt = new Date();
    this.nextRunAt = new Date(Date.now() + intervalMinutes * 60 * 1000);

    try {
      const res = await this.requirementsService.syncEmails(limit);
      this.lastResult = res;
      return res;
    } finally {
      this.isRunningJob = false;
    }
  }

  /** Get current scheduler configuration, timers, and health status */
  getStatus() {
    const enabled = process.env.MAIL_EXTRACTION_SCHEDULE_ENABLED !== 'false';
    const intervalMinutes = parseInt(process.env.MAIL_EXTRACTION_INTERVAL_MINUTES || '2', 10);
    const timezone = process.env.MAIL_EXTRACTION_TIMEZONE || 'Asia/Kolkata';

    return {
      enabled,
      intervalMinutes,
      timezone,
      isJobRunning: this.isRunningJob || this.requirementsService.getSyncStatus().status === 'running',
      initialBackfillCompleted: this.initialBackfillCompleted,
      lastRunAt: this.lastRunAt,
      nextRunAt: this.nextRunAt,
      lastResult: this.lastResult,
      syncState: this.requirementsService.getSyncStatus(),
    };
  }
}
