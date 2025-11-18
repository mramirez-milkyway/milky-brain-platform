import { Injectable, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Readable } from 'stream'
import { AuditService } from '../common/services/audit.service'

@Injectable()
export class AuditExportService {
  constructor(
    private readonly auditService: AuditService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Validate export date range against configured maximum
   */
  validateExportRange(startDate?: string, endDate?: string): void {
    if (!startDate || !endDate) {
      return // No validation needed if dates not provided
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    const maxMonths = parseInt(this.configService.get<string>('MAX_AUDIT_EXPORT_MONTHS') || '3')
    const maxDays = maxMonths * 30

    if (daysDiff > maxDays) {
      throw new BadRequestException(`Export range cannot exceed ${maxMonths} months`)
    }

    if (daysDiff < 0) {
      throw new BadRequestException('Start date must be before end date')
    }
  }

  /**
   * Generate CSV filename based on filters
   */
  generateFilename(filters: { userId?: number; startDate?: string; endDate?: string }): string {
    const parts: string[] = ['audit-log']

    if (filters.userId) {
      parts.push(`user-${filters.userId}`)
    }

    if (filters.startDate && filters.endDate) {
      parts.push(`${filters.startDate}-to-${filters.endDate}`)
    } else if (filters.startDate || filters.endDate) {
      const date = filters.startDate || filters.endDate || ''
      if (date) {
        parts.push(date)
      }
    } else {
      // Default: current date
      const today = new Date().toISOString().split('T')[0]
      parts.push(today)
    }

    return `${parts.join('-')}.csv`
  }

  /**
   * Escape CSV field value
   */
  private escapeCsvField(value: any): string {
    if (value === null || value === undefined) {
      return ''
    }

    let stringValue = String(value)

    // If value contains comma, newline, or quote, wrap in quotes and escape quotes
    if (
      stringValue.includes(',') ||
      stringValue.includes('\n') ||
      stringValue.includes('\r') ||
      stringValue.includes('"')
    ) {
      stringValue = `"${stringValue.replace(/"/g, '""')}"`
    }

    return stringValue
  }

  /**
   * Format JSON data for CSV (compact representation)
   */
  private formatJsonForCsv(data: any): string {
    if (data === null || data === undefined) {
      return ''
    }

    try {
      const jsonString = JSON.stringify(data)
      return this.escapeCsvField(jsonString)
    } catch (error) {
      return this.escapeCsvField('[Invalid JSON]')
    }
  }

  /**
   * Create CSV stream for export
   */
  async createCsvStream(filters: {
    userId?: number
    startDate?: string
    endDate?: string
    action?: string
    entityType?: string
    limit?: number
  }): Promise<Readable> {
    // Convert string dates to Date objects
    const startDate = filters.startDate ? new Date(filters.startDate) : undefined
    const endDate = filters.endDate ? new Date(filters.endDate) : undefined

    // Set end date to end of day
    if (endDate) {
      endDate.setHours(23, 59, 59, 999)
    }

    // Fetch audit events
    const events = await this.auditService.searchEvents({
      actorId: filters.userId,
      action: filters.action,
      entityType: filters.entityType,
      startDate,
      endDate,
      limit: filters.limit || 1000, // Default to higher limit for exports
    })

    // Create readable stream
    const stream = new Readable({
      read() {},
    })

    // Write CSV header
    const header = [
      'Timestamp',
      'Actor ID',
      'Actor Name',
      'Actor Email',
      'Action',
      'Entity Type',
      'Entity ID',
      'IP Address',
      'User Agent',
      'Before State',
      'After State',
      'Hash',
    ].join(',')

    stream.push(header + '\n')

    // Write CSV rows
    for (const event of events) {
      const row = [
        this.escapeCsvField(event.createdAt.toISOString()),
        this.escapeCsvField(event.actorId),
        this.escapeCsvField(event.actor?.name || ''),
        this.escapeCsvField(event.actor?.email || ''),
        this.escapeCsvField(event.action),
        this.escapeCsvField(event.entityType),
        this.escapeCsvField(event.entityId || ''),
        this.escapeCsvField(event.ipAddress || ''),
        this.escapeCsvField(event.userAgent || ''),
        this.formatJsonForCsv(event.beforeState),
        this.formatJsonForCsv(event.afterState),
        this.escapeCsvField(event.hash),
      ].join(',')

      stream.push(row + '\n')
    }

    // End stream
    stream.push(null)

    return stream
  }
}
