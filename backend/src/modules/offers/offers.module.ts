import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { OfferRepository } from './repositories/offer.repository';
import { Offer, OfferSchema } from './schemas/offer.schema';
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
      { name: Offer.name, schema: OfferSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: Candidate.name, schema: CandidateSchema },
      { name: Requirement.name, schema: RequirementSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [OffersController],
  providers: [OffersService, OfferRepository, NotificationsService],
  exports: [OffersService, OfferRepository],
})
export class OffersModule {}
