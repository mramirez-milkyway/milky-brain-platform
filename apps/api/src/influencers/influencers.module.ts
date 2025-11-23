import { Module } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { InfluencersController } from './influencers.controller'
import { InfluencersService } from './influencers.service'
import { InfluencersRepository } from './influencers.repository'
import { ExportControlsModule } from '../export-controls/export-controls.module'
import { PdfModule } from '../pdf/pdf.module'
import { RbacService } from '../common/services/rbac.service'

@Module({
  imports: [ExportControlsModule, PdfModule],
  controllers: [InfluencersController],
  providers: [InfluencersService, InfluencersRepository, RbacService, PrismaClient],
  exports: [InfluencersService],
})
export class InfluencersModule {}
