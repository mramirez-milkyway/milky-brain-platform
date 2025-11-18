import { Module } from '@nestjs/common'
import { AuditController } from './audit.controller'
import { AuditService } from '../common/services/audit.service'
import { AuditExportService } from './audit-export.service'
import { RbacService } from '../common/services/rbac.service'

@Module({
  controllers: [AuditController],
  providers: [AuditService, AuditExportService, RbacService],
})
export class AuditModule {}
