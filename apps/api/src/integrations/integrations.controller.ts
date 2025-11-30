import { Controller, Get, UseGuards } from '@nestjs/common'
import { IntegrationsService } from './integrations.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../common/guards/permission.guard'
import { RequirePermission } from '../common/decorators/require-permission.decorator'

@Controller('integrations')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('usage')
  @RequirePermission('integration:Read')
  async getUsage() {
    return this.integrationsService.getAllIntegrationsUsage()
  }
}
