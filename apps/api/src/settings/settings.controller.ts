import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { UpdateOrgSettingsDto } from './dto/settings.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('org')
  @RequirePermission('settings:Read')
  async getOrgSettings() {
    return this.settingsService.getOrgSettings();
  }

  @Patch('org')
  @RequirePermission('settings:Update')
  async updateOrgSettings(@Body() updateDto: UpdateOrgSettingsDto) {
    return this.settingsService.updateOrgSettings(updateDto);
  }
}
