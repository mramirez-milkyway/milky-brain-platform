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
   * List creators with pagination
   *
   * @permission creator:Read
   * @query page - Page number (default: 1)
   * @query pageSize - Results per page (default: 20, max: 100)
   */
  @Get()
  @RequirePermission('creator:Read')
  async findAll(@Query() query: CreatorQueryDto) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20

    return this.creatorsService.findAll(page, pageSize)
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
