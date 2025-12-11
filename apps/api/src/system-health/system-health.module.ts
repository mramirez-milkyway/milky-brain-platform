import { Module } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { SystemHealthController } from './system-health.controller'
import { SystemHealthService } from './system-health.service'
import { SystemHealthRepository } from './system-health.repository'
import { RbacService } from '../common/services/rbac.service'

/**
 * Module for system health monitoring and error log viewing.
 * Provides visibility into unhandled exceptions for technical admins.
 */
@Module({
  controllers: [SystemHealthController],
  providers: [SystemHealthService, SystemHealthRepository, RbacService, PrismaClient],
  exports: [SystemHealthService, SystemHealthRepository],
})
export class SystemHealthModule {}
