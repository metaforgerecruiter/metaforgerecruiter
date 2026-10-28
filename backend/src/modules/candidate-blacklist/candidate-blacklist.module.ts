import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlacklistController } from './candidate-blacklist.controller';
import { BlacklistService } from './candidate-blacklist.service';
import { BlacklistRepository } from './repositories/blacklist.repository';
import { CandidateBlacklist, CandidateBlacklistSchema } from './schemas/candidate-blacklist.schema';
import { Candidate, CandidateSchema } from '../candidates/schemas/candidate.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CandidateBlacklist.name, schema: CandidateBlacklistSchema },
      { name: Candidate.name, schema: CandidateSchema },
    ]),
  ],
  controllers: [BlacklistController],
  providers: [BlacklistService, BlacklistRepository],
  exports: [BlacklistService, BlacklistRepository],
})
export class BlacklistModule {}
