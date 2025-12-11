import { Injectable, NotFoundException } from '@nestjs/common'
import { SystemHealthRepository } from './system-health.repository'
import {
  SystemLogQueryDto,
  SystemLogListItemDto,
  SystemLogDetailDto,
  SystemLogListResponseDto,
} from './dto'

/**
 * Service for system health log operations.
 * Implements business logic for viewing system error logs.
 */
@Injectable()
export class SystemHealthService {
  private readonly MAX_ERROR_MESSAGE_LENGTH = 200

  constructor(private readonly repository: SystemHealthRepository) {}

  /**
   * List system logs with pagination and filtering
   */
  async listLogs(query: SystemLogQueryDto): Promise<SystemLogListResponseDto> {
    const page = query.page || 1
    const pageSize = query.pageSize || 20

    const [logs, total] = await this.repository.findMany({
      context: query.context,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      page,
      pageSize,
    })

    const data = logs.map(
      (log) =>
        new SystemLogListItemDto({
          id: log.id,
          context: log.context,
          errorMessage: this.truncateMessage(log.errorMessage),
          createdAt: log.createdAt,
        })
    )

    return new SystemLogListResponseDto({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  }

  /**
   * Get a single system log by ID with full details
   */
  async getLogById(id: number): Promise<SystemLogDetailDto> {
    const log = await this.repository.findById(id)

    if (!log) {
      throw new NotFoundException(`System log with ID ${id} not found`)
    }

    return new SystemLogDetailDto({
      id: log.id,
      context: log.context,
      errorMessage: log.errorMessage,
      stackTrace: log.stackTrace,
      metadata: log.metadata,
      createdAt: log.createdAt,
    })
  }

  /**
   * Get available contexts for filtering
   */
  async getContexts(): Promise<string[]> {
    return this.repository.getDistinctContexts()
  }

  /**
   * Truncate error message for list view
   */
  private truncateMessage(message: string): string {
    if (message.length <= this.MAX_ERROR_MESSAGE_LENGTH) {
      return message
    }
    return message.substring(0, this.MAX_ERROR_MESSAGE_LENGTH) + '...'
  }
}
