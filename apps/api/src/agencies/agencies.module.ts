import { Module } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { AgenciesController } from './agencies.controller'
import { AgenciesService } from './agencies.service'
import { AgenciesRepository } from './agencies.repository'
import { RbacService } from '../common/services/rbac.service'

@Module({
  controllers: [AgenciesController],
  providers: [AgenciesService, AgenciesRepository, PrismaClient, RbacService],
  exports: [AgenciesService, AgenciesRepository],
})
export class AgenciesModule {}
