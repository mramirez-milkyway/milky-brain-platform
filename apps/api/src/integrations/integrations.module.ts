import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { IntegrationsController } from './integrations.controller'
import { IntegrationsService } from './integrations.service'
import { RbacService } from '../common/services/rbac.service'

@Module({
  imports: [ConfigModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, RbacService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
