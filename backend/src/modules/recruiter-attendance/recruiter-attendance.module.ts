import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  RecruiterLoginHistory,
  RecruiterLoginHistorySchema,
} from './schemas/recruiter-login-history.schema';
import {
  DailyAttendanceReport,
  DailyAttendanceReportSchema,
} from './schemas/daily-attendance-report.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RecruiterAttendanceService } from './recruiter-attendance.service';
import { RecruiterAttendanceSchedulerService } from './recruiter-attendance-scheduler.service';
import { RecruiterAttendanceController } from './recruiter-attendance.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RecruiterLoginHistory.name, schema: RecruiterLoginHistorySchema },
      { name: DailyAttendanceReport.name, schema: DailyAttendanceReportSchema },
      { name: User.name, schema: UserSchema },
    ]),
    MailModule,
    NotificationsModule,
  ],
  controllers: [RecruiterAttendanceController],
  providers: [RecruiterAttendanceService, RecruiterAttendanceSchedulerService],
  exports: [RecruiterAttendanceService],
})
export class RecruiterAttendanceModule {}
