import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';
import { Requirement, RequirementSchema } from '../requirements/schemas/requirement.schema';
import { Submission, SubmissionSchema } from '../submissions/schemas/submission.schema';
import { Interview, InterviewSchema } from '../interviews/schemas/interview.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Candidate, CandidateSchema } from '../candidates/schemas/candidate.schema';
import { Client, ClientSchema } from '../clients/schemas/client.schema';
import { ActivityLog, ActivityLogSchema } from '../audit/schemas/activity-log.schema';
import { Team, TeamSchema } from '../teams/schemas/team.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Requirement.name, schema: RequirementSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: Interview.name, schema: InterviewSchema },
      { name: User.name, schema: UserSchema },
      { name: Candidate.name, schema: CandidateSchema },
      { name: Client.name, schema: ClientSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
      { name: Team.name, schema: TeamSchema },
    ]),
  ],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
