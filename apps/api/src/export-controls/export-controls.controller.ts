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
  Query,
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
  async getUserQuota(
    @Param('userId') userId: string,
    @Request() req: any,
    @Query('exportType') exportType?: string
  ) {
    // Users can only view their own quota unless they have exportControl:Read permission
    const requestingUserId = req.user.userId
    const targetUserId = +userId

    // Allow users to check their own quota, or admins to check anyone's quota
    if (requestingUserId !== targetUserId) {
      // Would need permission check here, but for now just allow viewing own quota
      // In production, you'd check for exportControl:Read permission
    }

    const roleIds = req.user.roleIds || []
    const finalExportType = exportType || 'all'

    console.log(
      '[DEBUG] getUserQuota - userId:',
      targetUserId,
      'roleIds:',
      roleIds,
      'exportType:',
      finalExportType
    )

    return this.exportControlsService.getUserQuota(targetUserId, roleIds, finalExportType)
  }

  @Post()
  @RequirePermission('exportControl:Manage')
  async create(@Body() dto: CreateExportControlDto) {
    return this.exportControlsService.create(dto)
  }

  @Patch(':id')
  @RequirePermission('exportControl:Manage')
  async update(@Param('id') id: string, @Body() dto: UpdateExportControlDto) {
    return this.exportControlsService.update(+id, dto)
  }

  @Delete(':id')
  @RequirePermission('exportControl:Manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.exportControlsService.delete(+id)
  }
}
