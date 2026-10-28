import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { CandidateRepository } from './repositories/candidate.repository';
import { Candidate, CandidateSchema } from './schemas/candidate.schema';
import {
  CandidateDocumentRecord,
  CandidateDocumentRecordSchema,
} from './schemas/candidate-document.schema';

import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Candidate.name, schema: CandidateSchema },
      { name: CandidateDocumentRecord.name, schema: CandidateDocumentRecordSchema },
    ]),
    NotificationsModule,
    AuditModule,
    FilesModule,
  ],
  controllers: [CandidatesController],
  providers: [CandidatesService, CandidateRepository],
  exports: [CandidatesService, CandidateRepository],
})
export class CandidatesModule {}
