import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @RequirePermission('role:Read')
  async findAll() {
    return { roles: await this.rolesService.findAll() };
  }

  @Post()
  @RequirePermission('role:Create')
  async create(@Body() createDto: CreateRoleDto) {
    return this.rolesService.create(createDto);
  }

  @Patch(':id')
  @RequirePermission('role:Update')
  async update(@Param('id') id: string, @Body() updateDto: UpdateRoleDto) {
    return this.rolesService.update(+id, updateDto);
  }
}
