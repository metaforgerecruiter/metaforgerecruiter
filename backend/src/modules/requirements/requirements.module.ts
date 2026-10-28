import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Requirement, RequirementSchema } from './schemas/requirement.schema';
import { RequirementHistory, RequirementHistorySchema } from './schemas/requirement-history.schema';
import { Client, ClientSchema } from '../clients/schemas/client.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { RequirementRepository } from './repositories/requirement.repository';
import { RequirementsService } from './requirements.service';
import { RequirementsController } from './requirements.controller';
import { RequirementsIngestController } from './requirements-ingest.controller';
import { MailExtractionSchedulerService } from './mail-extraction-scheduler.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Requirement.name, schema: RequirementSchema },
      { name: RequirementHistory.name, schema: RequirementHistorySchema },
      { name: Client.name, schema: ClientSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [RequirementsController, RequirementsIngestController],
  providers: [RequirementsService, RequirementRepository, MailExtractionSchedulerService],
  exports: [RequirementsService, RequirementRepository, MailExtractionSchedulerService],
})
export class RequirementsModule {}

