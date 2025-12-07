import { Injectable } from '@nestjs/common'
import { PrismaClient, Job, JobStatus, JobLog, LogLevel, Prisma } from '@prisma/client'

/**
 * Generic repository for job data access.
 * Follows repository pattern - no business logic, only data access.
 *
 * Design: Generic and extensible for any job type.
 */
@Injectable()
export class JobsRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new job record
   */
  async create(data: Prisma.JobUncheckedCreateInput): Promise<Job> {
    return this.prisma.job.create({
      data,
    })
  }

  /**
   * Find job by primary key (ID)
   */
  async findById(id: number): Promise<Job | null> {
    return this.prisma.job.findUnique({
      where: { id },
    })
  }

  /**
   * Find job by unique taskId (UUID)
   */
  async findByTaskId(taskId: string): Promise<Job | null> {
    return this.prisma.job.findUnique({
      where: { taskId },
    })
  }

  /**
   * Find many jobs with filtering and pagination
   * Generic query builder for flexible filtering
   */
  async findMany(options: {
    jobType?: string
    status?: JobStatus
    userId?: number
    page: number
    pageSize: number
  }): Promise<[Job[], number]> {
    const { jobType, status, userId, page, pageSize } = options

    const where: Prisma.JobWhereInput = {}

    if (jobType) where.jobType = jobType
    if (status) where.status = status
    if (userId) where.userId = userId

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.job.count({ where }),
    ])

    return [jobs, total]
  }

  /**
   * Update job status with optional metadata
   * Generic update method for status transitions
   */
  async updateStatus(
    taskId: string,
    status: JobStatus,
    data?: {
      attempts?: number
      errorReason?: string
      result?: unknown
      startedAt?: Date
      completedAt?: Date
    }
  ): Promise<Job> {
    const updateData: Prisma.JobUpdateInput = {
      status,
      ...(data?.attempts !== undefined && { attempts: data.attempts }),
      ...(data?.errorReason !== undefined && { errorReason: data.errorReason }),
      ...(data?.result !== undefined && { result: data.result as Prisma.InputJsonValue }),
      ...(data?.startedAt !== undefined && { startedAt: data.startedAt }),
      ...(data?.completedAt !== undefined && { completedAt: data.completedAt }),
    }

    return this.prisma.job.update({
      where: { taskId },
      data: updateData,
    })
  }

  /**
   * Find all logs for a specific job
   */
  async findLogs(jobId: number): Promise<JobLog[]> {
    return this.prisma.jobLog.findMany({
      where: { jobId },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * Create a log entry for a job
   * Generic logging method - extensible with meta field
   */
  async createLog(
    jobId: number,
    level: LogLevel,
    message: string,
    meta?: unknown,
    rowNumber?: number
  ): Promise<JobLog> {
    return this.prisma.jobLog.create({
      data: {
        jobId,
        level,
        message,
        meta: meta as Prisma.InputJsonValue,
        rowNumber,
      },
    })
  }

  /**
   * Generic update method for any job fields
   * Allows flexible updates without predefined methods
   */
  async update(taskId: string, data: Prisma.JobUpdateInput): Promise<Job> {
    return this.prisma.job.update({
      where: { taskId },
      data,
    })
  }
}
