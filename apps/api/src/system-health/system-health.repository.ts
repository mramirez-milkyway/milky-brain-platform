import { Injectable } from '@nestjs/common'
import { PrismaClient, SystemLog, Prisma } from '@prisma/client'

/**
 * Repository for system log data access.
 * Follows repository pattern - no business logic, only data access.
 */
@Injectable()
export class SystemHealthRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find system log by ID
   */
  async findById(id: number): Promise<SystemLog | null> {
    return this.prisma.systemLog.findUnique({
      where: { id },
    })
  }

  /**
   * Find many system logs with filtering and pagination
   */
  async findMany(options: {
    context?: string
    startDate?: Date
    endDate?: Date
    page: number
    pageSize: number
  }): Promise<[SystemLog[], number]> {
    const { context, startDate, endDate, page, pageSize } = options

    const where: Prisma.SystemLogWhereInput = {}

    if (context) {
      where.context = context
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = startDate
      }
      if (endDate) {
        where.createdAt.lte = endDate
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.systemLog.count({ where }),
    ])

    return [logs, total]
  }

  /**
   * Get distinct contexts for filtering dropdown
   */
  async getDistinctContexts(): Promise<string[]> {
    const results = await this.prisma.systemLog.findMany({
      select: { context: true },
      distinct: ['context'],
      orderBy: { context: 'asc' },
    })

    return results.map((r) => r.context)
  }

  /**
   * Create a system log entry
   * Used by exception filter and Lambda error wrapper
   */
  async create(data: Prisma.SystemLogCreateInput): Promise<SystemLog> {
    return this.prisma.systemLog.create({
      data,
    })
  }
}
