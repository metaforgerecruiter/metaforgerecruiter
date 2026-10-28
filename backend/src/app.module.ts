import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { OrganizationModule } from './modules/organizations/organization.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RequirementsModule } from './modules/requirements/requirements.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { InterviewsModule } from './modules/interviews/interviews.module';
import { ClientsModule } from './modules/clients/clients.module';
import { OffersModule } from './modules/offers/offers.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuditModule } from './modules/audit/audit.module';
import { TeamsModule } from './modules/teams/teams.module';
import { FilesModule } from './modules/files/files.module';
import { AIModule } from './modules/ai/ai.module';
import { BlacklistModule } from './modules/candidate-blacklist/candidate-blacklist.module';
import { SavedSearchesModule } from './modules/saved-searches/saved-searches.module';
import { EmailTemplatesModule } from './modules/email-templates/email-templates.module';
import { MailModule } from './modules/mail/mail.module';
import { RedisModule } from './modules/redis/redis.module';
import { SeedModule } from './modules/seed/seed.module';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { ResumeParserModule } from './modules/resume-parser/resume-parser.module';
import { RecruiterAttendanceModule } from './modules/recruiter-attendance/recruiter-attendance.module';

// AI
import {
  AIMatchScore,
  AIMatchScoreSchema,
} from './modules/ai/schemas/ai-match-score.schema';

import {
  AIParsingJob,
  AIParsingJobSchema,
} from './modules/ai/schemas/ai-parse-job.schema';

// Analytics
import {
  RecruiterAnalytics,
  RecruiterAnalyticsSchema,
} from './modules/analytics/schemas/recruiter-analytics.schema';

// Audit
import {
  ActivityLog,
  ActivityLogSchema,
} from './modules/audit/schemas/activity-log.schema';

// Candidate Blacklist
import {
  CandidateBlacklist,
  CandidateBlacklistSchema,
} from './modules/candidate-blacklist/schemas/candidate-blacklist.schema';

// Candidates
import {
  Candidate,
  CandidateSchema,
} from './modules/candidates/schemas/candidate.schema';

import {
  CandidateDocumentRecord,
  CandidateDocumentRecordSchema,
} from './modules/candidates/schemas/candidate-document.schema';

// Clients
import {
  Client,
  ClientSchema,
} from './modules/clients/schemas/client.schema';

// Email Templates
import {
  EmailTemplate,
  EmailTemplateSchema,
} from './modules/email-templates/schemas/email-template.schema';

// Files
import {
  FileMetadata,
  FileMetadataSchema,
} from './modules/files/schemas/file-metadata.schema';

// Interviews
import {
  Interview,
  InterviewSchema,
} from './modules/interviews/schemas/interview.schema';

import {
  InterviewFeedback,
  InterviewFeedbackSchema,
} from './modules/interviews/schemas/interview-feedback.schema';

// Notifications
import {
  Notification,
  NotificationSchema,
} from './modules/notifications/schemas/notification.schema';

// Offers
import {
  Offer,
  OfferSchema,
} from './modules/offers/schemas/offer.schema';

// Requirements
import {
  Requirement,
  RequirementSchema,
} from './modules/requirements/schemas/requirement.schema';

import {
  RequirementHistory,
  RequirementHistorySchema,
} from './modules/requirements/schemas/requirement-history.schema';

// Saved Searches
import {
  SavedSearch,
  SavedSearchSchema,
} from './modules/saved-searches/schemas/saved-search.schema';

// Submissions
import {
  Submission,
  SubmissionSchema,
} from './modules/submissions/schemas/submission.schema';

import {
  SubmissionHistory,
  SubmissionHistorySchema,
} from './modules/submissions/schemas/submission-history.schema';

// Teams
import {
  Team,
  TeamSchema,
} from './modules/teams/schemas/team.schema';

// Users
import {
  RolePermission,
  RolePermissionSchema,
} from './modules/users/schemas/role-permission.schema';

import {
  User,
  UserSchema,
} from './modules/users/schemas/user.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/metaforge_recruiter_v2',
        dbName: configService.get<string>('MONGODB_DB_NAME') || 'metaforge_recruiter_v2',
      }),
    }),

    MongooseModule.forFeature([
      {
        name: AIMatchScore.name,
        schema: AIMatchScoreSchema,
      },
      {
        name: AIParsingJob.name,
        schema: AIParsingJobSchema,
      },
      {
        name: RecruiterAnalytics.name,
        schema: RecruiterAnalyticsSchema,
      },
      {
        name: ActivityLog.name,
        schema: ActivityLogSchema,
      },
      {
        name: CandidateBlacklist.name,
        schema: CandidateBlacklistSchema,
      },
      {
        name: Candidate.name,
        schema: CandidateSchema,
      },
      {
        name: CandidateDocumentRecord.name,
        schema: CandidateDocumentRecordSchema,
      },
      {
        name: Client.name,
        schema: ClientSchema,
      },
      {
        name: EmailTemplate.name,
        schema: EmailTemplateSchema,
      },
      {
        name: FileMetadata.name,
        schema: FileMetadataSchema,
      },
      {
        name: Interview.name,
        schema: InterviewSchema,
      },
      {
        name: InterviewFeedback.name,
        schema: InterviewFeedbackSchema,
      },
      {
        name: Notification.name,
        schema: NotificationSchema,
      },
      {
        name: Offer.name,
        schema: OfferSchema,
      },
      {
        name: Requirement.name,
        schema: RequirementSchema,
      },
      {
        name: RequirementHistory.name,
        schema: RequirementHistorySchema,
      },
      {
        name: SavedSearch.name,
        schema: SavedSearchSchema,
      },
      {
        name: Submission.name,
        schema: SubmissionSchema,
      },
      {
        name: SubmissionHistory.name,
        schema: SubmissionHistorySchema,
      },
      {
        name: Team.name,
        schema: TeamSchema,
      },
      {
        name: RolePermission.name,
        schema: RolePermissionSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),

    RedisModule,
    ResumeParserModule,
    OrganizationModule,
    AuthModule,
    UsersModule,
    RequirementsModule,
    SubmissionsModule,
    CandidatesModule,
    InterviewsModule,
    ClientsModule,
    OffersModule,
    NotificationsModule,
    AnalyticsModule,
    AuditModule,
    TeamsModule,
    FilesModule,
    AIModule,
    BlacklistModule,
    SavedSearchesModule,
    EmailTemplatesModule,
    MailModule,
    WorkspaceModule,
    SeedModule,
    RecruiterAttendanceModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],

  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}