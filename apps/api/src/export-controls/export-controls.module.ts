import { Module } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { ExportControlsController } from './export-controls.controller'
import { ExportControlsService } from './export-controls.service'
import { ExportControlsRepository } from './export-controls.repository'
import { RbacService } from '../common/services/rbac.service'

@Module({
  controllers: [ExportControlsController],
  providers: [ExportControlsService, ExportControlsRepository, RbacService, PrismaClient],
  exports: [ExportControlsService],
})
export class ExportControlsModule {}
