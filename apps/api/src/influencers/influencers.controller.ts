import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Res,
  StreamableFile,
} from '@nestjs/common'
import { Response } from 'express'
import { InfluencersService } from './influencers.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../common/guards/permission.guard'
import { RequirePermission } from '../common/decorators/require-permission.decorator'

@Controller('influencers')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class InfluencersController {
  constructor(private readonly influencersService: InfluencersService) {}

  @Get()
  @RequirePermission('influencer:Read')
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20

    return this.influencersService.findAll(pageNum, pageSizeNum)
  }

  @Get('export/pdf')
  @RequirePermission('influencer:Export')
  async exportPdf(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = req.user.userId
    const roleIds = req.user.roleIds || []

    const { stream, filename, rowCount, watermarked } = await this.influencersService.exportToPdf(
      userId,
      roleIds,
    )

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Row-Count': rowCount.toString(),
      'X-Watermarked': watermarked.toString(),
    })

    return new StreamableFile(stream)
  }
}
