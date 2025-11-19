import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../common/guards/permission.guard'
import { RequirePermission } from '../common/decorators/require-permission.decorator'
import { InviteUserDto, UpdateUserDto } from './dto/user.dto'

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @RequirePermission('user:Read')
  async findAll() {
    return { users: await this.usersService.findAll() }
  }

  @Get(':id')
  @RequirePermission('user:Read')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id)
  }

  @Post('invite')
  @RequirePermission('user:Create')
  async invite(@Body() inviteDto: InviteUserDto, @Request() req: any) {
    const currentUser = req.user
    // Fetch user details for name
    const userDetails = await this.usersService.findOne(currentUser.userId)
    return this.usersService.invite(
      inviteDto,
      currentUser.userId,
      currentUser.email,
      userDetails?.name || currentUser.email
    )
  }

  @Post(':id/resend-invitation')
  @RequirePermission('user:Create')
  async resendInvitation(@Param('id') id: string, @Request() req: any) {
    const currentUser = req.user
    const userDetails = await this.usersService.findOne(currentUser.userId)
    return this.usersService.resendInvitation(
      +id,
      currentUser.userId,
      userDetails?.name || currentUser.email
    )
  }

  @Delete(':id/cancel-invitation')
  @RequirePermission('user:Delete')
  async cancelInvitation(@Param('id') id: string, @Request() req: any) {
    const currentUser = req.user
    return this.usersService.cancelInvitation(+id, currentUser.userId)
  }

  @Patch(':id')
  @RequirePermission('user:Update')
  async update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.usersService.update(+id, updateDto)
  }

  @Delete(':id')
  @RequirePermission('user:Delete')
  async deactivate(@Param('id') id: string, @Request() req: any) {
    const currentUser = req.user
    return this.usersService.deactivate(+id, currentUser.userId)
  }

  @Get(':id/roles')
  @RequirePermission('user:Read')
  async getUserRoles(@Param('id') id: string) {
    return { roles: await this.usersService.getUserRoles(+id) }
  }

  @Post(':userId/roles/:roleId')
  @RequirePermission('user:AssignRole')
  async assignRole(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    return this.usersService.assignRole(+userId, +roleId)
  }

  @Delete(':userId/roles/:roleId')
  @RequirePermission('user:RemoveRole')
  async removeRole(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    return this.usersService.removeRole(+userId, +roleId)
  }
}
