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
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ExportControlsService } from './export-controls.service'
import { CreateExportControlDto } from './dto/create-export-control.dto'
import { UpdateExportControlDto } from './dto/update-export-control.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../common/guards/permission.guard'
import { RequirePermission } from '../common/decorators/require-permission.decorator'

@Controller('export-controls')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ExportControlsController {
  constructor(private readonly exportControlsService: ExportControlsService) {}

  @Get()
  @RequirePermission('exportControl:Read')
  async findAll() {
    const settings = await this.exportControlsService.findAll()
    return { settings }
  }

  @Get(':id')
  @RequirePermission('exportControl:Read')
  async findOne(@Param('id') id: string) {
    return this.exportControlsService.findById(+id)
  }

  @Get('quota/:userId')
  @RequirePermission('exportControl:Read')
  async getUserQuota(
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    // TODO: Get user's roleIds from the user service
    // For now, assuming req.user has roleIds
    const roleIds = req.user.roleIds || []
    const exportType = req.query.exportType || 'all'

    return this.exportControlsService.getUserQuota(+userId, roleIds, exportType as string)
  }

  @Post()
  @RequirePermission('exportControl:Manage')
  async create(@Body() dto: CreateExportControlDto) {
    return this.exportControlsService.create(dto)
  }

  @Patch(':id')
  @RequirePermission('exportControl:Manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExportControlDto,
  ) {
    return this.exportControlsService.update(+id, dto)
  }

  @Delete(':id')
  @RequirePermission('exportControl:Manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.exportControlsService.delete(+id)
  }
}
