import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { InterviewRepository } from './repositories/interview.repository';
import { Interview, InterviewSchema } from './schemas/interview.schema';
import {
  InterviewFeedback,
  InterviewFeedbackSchema,
} from './schemas/interview-feedback.schema';
import {
  Submission,
  SubmissionSchema,
} from '../submissions/schemas/submission.schema';
import {
  Candidate,
  CandidateSchema,
} from '../candidates/schemas/candidate.schema';
import {
  Requirement,
  RequirementSchema,
} from '../requirements/schemas/requirement.schema';
import {
  Notification,
  NotificationSchema,
} from '../notifications/schemas/notification.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Interview.name, schema: InterviewSchema },
      { name: InterviewFeedback.name, schema: InterviewFeedbackSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: Candidate.name, schema: CandidateSchema },
      { name: Requirement.name, schema: RequirementSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [InterviewsController],
  providers: [InterviewsService, InterviewRepository, NotificationsService],
  exports: [InterviewsService, InterviewRepository],
})
export class InterviewsModule {}
