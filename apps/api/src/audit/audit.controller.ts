import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common'
import { Response } from 'express'
import { AuditService } from '../common/services/audit.service'
import { AuditExportService } from './audit-export.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../common/guards/permission.guard'
import { RequirePermission } from '../common/decorators/require-permission.decorator'
import { AuditQueryDto } from './dto/audit-query.dto'

@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AuditController {
  constructor(
    private auditService: AuditService,
    private auditExportService: AuditExportService
  ) {}

  @Get()
  @RequirePermission('audit:Read')
  async findAll(@Query() query: AuditQueryDto) {
    // Convert date strings to Date objects if provided
    const startDate = query.startDate ? new Date(query.startDate) : undefined
    const endDate = query.endDate ? new Date(query.endDate) : undefined

    // Set end date to end of day if provided
    if (endDate) {
      endDate.setHours(23, 59, 59, 999)
    }

    const events = await this.auditService.searchEvents({
      actorId: query.userId,
      action: query.action,
      entityType: query.entityType,
      startDate,
      endDate,
      limit: query.limit || 100,
    })

    // Add human-readable descriptions to each event
    const eventsWithDescriptions = events.map((event) => ({
      ...event,
      description: this.auditService.generateDescription(event),
    }))

    return { events: eventsWithDescriptions }
  }

  @Get('export')
  @RequirePermission('audit:Export')
  async export(@Query() query: AuditQueryDto, @Res() response: Response) {
    // Validate export range if dates provided
    this.auditExportService.validateExportRange(query.startDate, query.endDate)

    // Generate filename
    const filename = this.auditExportService.generateFilename({
      userId: query.userId,
      startDate: query.startDate,
      endDate: query.endDate,
    })

    // Create CSV stream
    const csvStream = await this.auditExportService.createCsvStream({
      userId: query.userId,
      action: query.action,
      entityType: query.entityType,
      startDate: query.startDate,
      endDate: query.endDate,
      limit: query.limit,
    })

    // Set response headers
    response.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    })

    // Pipe stream to response
    csvStream.pipe(response)
  }
}
