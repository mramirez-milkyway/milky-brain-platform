import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RbacService } from '../common/services/rbac.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, RbacService],
})
export class UsersModule {}
