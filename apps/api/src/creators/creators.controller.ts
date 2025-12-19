import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { CreatorsService } from './creators.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../common/guards/permission.guard'
import { RequirePermission } from '../common/decorators/require-permission.decorator'
import { CreatorQueryDto, CreateCreatorDto, UpdateCreatorDto } from './dto'

@Controller('creators')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) {}

  /**
   * Get filter options for dropdowns (countries, cities, languages, categories)
   *
   * @permission creator:Read
   * @returns { countries, citiesByCountry, languages, categories }
   */
  @Get('filter-options')
  @RequirePermission('creator:Read')
  async getFilterOptions() {
    return this.creatorsService.getFilterOptions()
  }

  /**
   * List creators with pagination and filters
   *
   * @permission creator:Read
   * @query page - Page number (default: 1)
   * @query pageSize - Results per page (default: 20, max: 100)
   * @query platform - Social media platform filter (instagram, tiktok, youtube)
   * @query handle - Search by social media handle (partial match)
   * @query country - Filter by creator countries (comma-separated, max 5)
   * @query gender - Filter by creator gender (male, female, organization)
   * @query language - Filter by creator language
   * @query minFollowers - Minimum follower count
   * @query maxFollowers - Maximum follower count
   * @query minEngagementRate - Minimum engagement rate percentage
   * @query categories - Filter by categories (comma-separated)
   * @query excludeBlacklisted - Exclude blacklisted creators (default: true)
   * @query minInternalRating - Minimum internal rating (0-100)
   * @query hasWorkedWithUs - Filter by campaign participation
   */
  @Get()
  @RequirePermission('creator:Read')
  async findAll(@Query() query: CreatorQueryDto) {
    return this.creatorsService.findAll(query)
  }

  /**
   * Get creator details by ID
   *
   * @permission creator:Read
   * @param id - Creator ID
   */
  @Get(':id')
  @RequirePermission('creator:Read')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.creatorsService.findById(id)
  }

  /**
   * Create a new creator/influencer
   *
   * If a soft-deleted record with the same handle+platform exists,
   * it will be restored and updated with the new data.
   *
   * @permission creator:Create
   * @body fullName - Full name of the influencer (required)
   * @body socialAccounts - Array of social media accounts (required)
   * @body gender, country, city, email, etc. - Optional fields
   * @returns Created or restored creator with { restored: boolean }
   */
  @Post()
  @RequirePermission('creator:Create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCreatorDto) {
    return this.creatorsService.create(dto)
  }

  /**
   * Update an existing creator/influencer
   *
   * @permission creator:Update
   * @param id - Creator ID
   * @body Partial update fields
   */
  @Patch(':id')
  @RequirePermission('creator:Update')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCreatorDto) {
    return this.creatorsService.update(id, dto)
  }

  /**
   * Soft delete a creator/influencer
   *
   * The record is marked with deleted_at and hidden from lists,
   * but retained in the database for potential restoration.
   *
   * @permission creator:Delete
   * @param id - Creator ID
   */
  @Delete(':id')
  @RequirePermission('creator:Delete')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.creatorsService.delete(id)
  }
}
