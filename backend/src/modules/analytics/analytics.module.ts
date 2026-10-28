import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './repositories/analytics.repository';

import { Requirement, RequirementSchema } from '../requirements/schemas/requirement.schema';
import { Candidate, CandidateSchema } from '../candidates/schemas/candidate.schema';
import { Submission, SubmissionSchema } from '../submissions/schemas/submission.schema';
import { Interview, InterviewSchema } from '../interviews/schemas/interview.schema';
import { Offer, OfferSchema } from '../offers/schemas/offer.schema';
import { Client, ClientSchema } from '../clients/schemas/client.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { RecruiterAnalytics, RecruiterAnalyticsSchema } from './schemas/recruiter-analytics.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Requirement.name, schema: RequirementSchema },
      { name: Candidate.name, schema: CandidateSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: Interview.name, schema: InterviewSchema },
      { name: Offer.name, schema: OfferSchema },
      { name: Client.name, schema: ClientSchema },
      { name: User.name, schema: UserSchema },
      { name: RecruiterAnalytics.name, schema: RecruiterAnalyticsSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsRepository],
  exports: [AnalyticsService, AnalyticsRepository],
})
export class AnalyticsModule {}
