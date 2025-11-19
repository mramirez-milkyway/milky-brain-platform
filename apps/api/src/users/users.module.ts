import { Module } from '@nestjs/common'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { RbacService } from '../common/services/rbac.service'
import { EmailModule } from '../notifications/email/email.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [EmailModule, AuthModule],
  controllers: [UsersController],
  providers: [UsersService, RbacService],
})
export class UsersModule {}
