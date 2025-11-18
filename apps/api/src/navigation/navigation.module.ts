import { Module } from '@nestjs/common';
import { NavigationController } from './navigation.controller';
import { NavigationService } from './navigation.service';
import { RbacService } from '../common/services/rbac.service';

@Module({
  controllers: [NavigationController],
  providers: [NavigationService, RbacService],
})
export class NavigationModule {}
