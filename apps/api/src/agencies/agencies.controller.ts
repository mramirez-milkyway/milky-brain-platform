import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common'
import { AgenciesService } from './agencies.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../common/guards/permission.guard'
import { RequirePermission } from '../common/decorators/require-permission.decorator'

@Controller('agencies')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  /**
   * List all agencies or search by query
   *
   * @permission creator:Read (agencies are related to creators)
   * @query q - Optional search query for agency name
   */
  @Get()
  @RequirePermission('creator:Read')
  async findAll(@Query('q') query?: string) {
    if (query) {
      return this.agenciesService.search(query)
    }
    return this.agenciesService.findAll()
  }

  /**
   * Create a new agency
   *
   * @permission creator:Create (creating agencies is part of creator management)
   * @body name - Agency name
   */
  @Post()
  @RequirePermission('creator:Create')
  async create(@Body('name') name: string) {
    return this.agenciesService.create(name)
  }
}
