import { Module } from '@nestjs/common';
import { PoliciesController } from './policies.controller';
import { PoliciesService } from './policies.service';
import { RbacService } from '../common/services/rbac.service';

@Module({
  controllers: [PoliciesController],
  providers: [PoliciesService, RbacService],
})
export class PoliciesModule {}
