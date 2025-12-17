import { Controller, Get, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common'
import { CreatorsService } from './creators.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../common/guards/permission.guard'
import { RequirePermission } from '../common/decorators/require-permission.decorator'
import { CreatorQueryDto } from './dto'

@Controller('creators')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) {}

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
}
