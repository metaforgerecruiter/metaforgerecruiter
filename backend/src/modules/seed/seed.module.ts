import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.service';
import { Organization, OrganizationSchema } from '../organizations/schemas/organization.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Client, ClientSchema } from '../clients/schemas/client.schema';
import { Requirement, RequirementSchema } from '../requirements/schemas/requirement.schema';
import { RolePermission, RolePermissionSchema } from '../users/schemas/role-permission.schema';
import { Candidate, CandidateSchema } from '../candidates/schemas/candidate.schema';
import { Submission, SubmissionSchema } from '../submissions/schemas/submission.schema';
import { Interview, InterviewSchema } from '../interviews/schemas/interview.schema';
import { ActivityLog, ActivityLogSchema } from '../audit/schemas/activity-log.schema';
import { Team, TeamSchema } from '../teams/schemas/team.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: User.name, schema: UserSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Requirement.name, schema: RequirementSchema },
      { name: RolePermission.name, schema: RolePermissionSchema },
      { name: Candidate.name, schema: CandidateSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: Interview.name, schema: InterviewSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
      { name: Team.name, schema: TeamSchema },
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
