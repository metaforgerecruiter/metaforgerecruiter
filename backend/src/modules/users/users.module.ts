import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from './schemas/user.schema';
import { RolePermission, RolePermissionSchema } from './schemas/role-permission.schema';
import { RecruiterAnalytics, RecruiterAnalyticsSchema } from '../analytics/schemas/recruiter-analytics.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RolesController } from './roles.controller';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RolePermission.name, schema: RolePermissionSchema },
      { name: RecruiterAnalytics.name, schema: RecruiterAnalyticsSchema },
    ]),
    AuthModule,
    AuditModule,
  ],
  controllers: [UsersController, RolesController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
