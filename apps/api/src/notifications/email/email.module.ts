import { Module } from '@nestjs/common'
import { EmailService } from './email.service'
import { AuditService } from '../../common/services/audit.service'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  providers: [EmailService, AuditService],
  exports: [EmailService],
})
export class EmailModule {}
