import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditRepository } from './repositories/audit.repository';
import { ActivityLog, ActivityLogSchema } from './schemas/activity-log.schema';
import { UserAuditLog, UserAuditLogSchema } from './schemas/user-audit-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ActivityLog.name, schema: ActivityLogSchema },
      { name: UserAuditLog.name, schema: UserAuditLogSchema },
    ]),
  ],
  controllers: [AuditController],
  providers: [AuditService, AuditRepository],
  exports: [AuditService, AuditRepository],
})
export class AuditModule {}
