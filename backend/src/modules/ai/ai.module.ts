import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { AIRepository } from './repositories/ai.repository';
import { AIMatchScore, AIMatchScoreSchema } from './schemas/ai-match-score.schema';
import { AIParsingJob, AIParsingJobSchema } from './schemas/ai-parse-job.schema';
import { Candidate, CandidateSchema } from '../candidates/schemas/candidate.schema';
import { Requirement, RequirementSchema } from '../requirements/schemas/requirement.schema';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    ConfigModule,
    FilesModule,
    MongooseModule.forFeature([
      { name: AIMatchScore.name, schema: AIMatchScoreSchema },
      { name: AIParsingJob.name, schema: AIParsingJobSchema },
      { name: Candidate.name, schema: CandidateSchema },
      { name: Requirement.name, schema: RequirementSchema },
    ]),
  ],
  controllers: [AIController],
  providers: [AIService, AIRepository],
  exports: [AIService, AIRepository],
})
export class AIModule {}

