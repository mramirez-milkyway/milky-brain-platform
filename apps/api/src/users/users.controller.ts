import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { InviteUserDto, UpdateUserDto } from './dto/user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @RequirePermission('user:Read')
  async findAll() {
    return { users: await this.usersService.findAll() };
  }

  @Get(':id')
  @RequirePermission('user:Read')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Post('invite')
  @RequirePermission('user:Create')
  async invite(@Body() inviteDto: InviteUserDto) {
    return this.usersService.invite(inviteDto);
  }

  @Patch(':id')
  @RequirePermission('user:Update')
  async update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.usersService.update(+id, updateDto);
  }

  @Delete(':id')
  @RequirePermission('user:Delete')
  async deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(+id);
  }

  @Get(':id/roles')
  @RequirePermission('user:Read')
  async getUserRoles(@Param('id') id: string) {
    return { roles: await this.usersService.getUserRoles(+id) };
  }

  @Post(':userId/roles/:roleId')
  @RequirePermission('user:AssignRole')
  async assignRole(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    return this.usersService.assignRole(+userId, +roleId);
  }

  @Delete(':userId/roles/:roleId')
  @RequirePermission('user:RemoveRole')
  async removeRole(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    return this.usersService.removeRole(+userId, +roleId);
  }
}
