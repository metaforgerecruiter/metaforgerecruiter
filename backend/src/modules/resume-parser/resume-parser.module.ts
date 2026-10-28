import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ResumeParserController } from './resume-parser.controller';
import { ResumeParserService } from './resume-parser.service';

@Module({
  imports: [AuthModule],
  controllers: [ResumeParserController],
  providers: [ResumeParserService],
  exports: [ResumeParserService],
})
export class ResumeParserModule {}
