import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { RbacService } from '../common/services/rbac.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, RbacService],
})
export class SettingsModule {}
