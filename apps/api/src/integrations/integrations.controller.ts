import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { IntegrationsService } from './integrations.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../common/guards/permission.guard'
import { RequirePermission } from '../common/decorators/require-permission.decorator'
import { ImaiProfileQueryDto } from './dto/imai-profile.dto'

@Controller('integrations')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('usage')
  @RequirePermission('integration:Read')
  async getUsage() {
    return this.integrationsService.getAllIntegrationsUsage()
  }

  /**
   * Look up an influencer profile from IMAI API
   *
   * @permission creator:Create (only users who can create influencers need this)
   * @query handle - Social media handle (with or without @)
   * @query platform - Social media platform (instagram, tiktok, youtube)
   * @returns Profile data if found, or { found: false } if not found
   */
  @Get('imai/profile')
  @RequirePermission('creator:Create')
  async lookupImaiProfile(@Query() query: ImaiProfileQueryDto) {
    return this.integrationsService.lookupImaiProfile(query.handle, query.platform)
  }
}
