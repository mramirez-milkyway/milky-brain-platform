import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CreatePolicyDto } from './dto/policy.dto';

@Controller('policies')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PoliciesController {
  constructor(private policiesService: PoliciesService) {}

  @Get()
  @RequirePermission('policy:Read')
  async findAll() {
    return { policies: await this.policiesService.findAll() };
  }

  @Post()
  @RequirePermission('policy:Create')
  async create(@Body() createDto: CreatePolicyDto) {
    return this.policiesService.create(createDto);
  }
}
