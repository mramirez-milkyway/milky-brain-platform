import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { RbacService } from '../common/services/rbac.service';

@Module({
  controllers: [RolesController],
  providers: [RolesService, RbacService],
})
export class RolesModule {}
