import { Module } from '@nestjs/common'
import { CreatorsController } from './creators.controller'
import { CreatorsService } from './creators.service'
import { CreatorsRepository } from './creators.repository'
import { PrismaClient } from '@prisma/client'
import { RbacService } from '../common/services/rbac.service'

@Module({
  controllers: [CreatorsController],
  providers: [CreatorsService, CreatorsRepository, PrismaClient, RbacService],
  exports: [CreatorsService],
})
export class CreatorsModule {}
