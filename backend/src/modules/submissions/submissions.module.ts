import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { SubmissionRepository } from './repositories/submission.repository';
import { Submission, SubmissionSchema } from './schemas/submission.schema';
import {
  SubmissionHistory,
  SubmissionHistorySchema,
} from './schemas/submission-history.schema';
import {
  Requirement,
  RequirementSchema,
} from '../requirements/schemas/requirement.schema';
import {
  Candidate,
  CandidateSchema,
} from '../candidates/schemas/candidate.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Team, TeamSchema } from '../teams/schemas/team.schema';
import {
  Notification,
  NotificationSchema,
} from '../notifications/schemas/notification.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Submission.name, schema: SubmissionSchema },
      { name: SubmissionHistory.name, schema: SubmissionHistorySchema },
      { name: Requirement.name, schema: RequirementSchema },
      { name: Candidate.name, schema: CandidateSchema },
      { name: User.name, schema: UserSchema },
      { name: Team.name, schema: TeamSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService, SubmissionRepository, NotificationsService],
  exports: [SubmissionsService, SubmissionRepository],
})
export class SubmissionsModule {}
