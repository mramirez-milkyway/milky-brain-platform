import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v4 as uuidv4 } from 'uuid'
import { JobStatus, Prisma } from '@prisma/client'
import { JobsRepository } from './jobs.repository'
import { S3Service } from '../common/services/s3.service'
import { SqsService } from '../common/services/sqs.service'
import { CreateJobDto, JobResponseDto, JobQueryDto } from './dto'

/**
 * Generic jobs service implementing business logic.
 * Design: Stateless, loosely coupled, extensible for any job type.
 *
 * Key principles:
 * - Generic job creation supporting any jobType
 * - File handling abstracted via S3Service
 * - Message queuing abstracted via SqsService
 * - No job-specific logic (delegated to Lambda handlers)
 */
@Injectable()
export class JobsService {
  constructor(
    private readonly repository: JobsRepository,
    private readonly s3Service: S3Service,
    private readonly sqsService: SqsService,
    private readonly config: ConfigService
  ) {}

  /**
   * Create a new asynchronous job
   * Generic method - works for any job type via jobType parameter
   *
   * @param userId - User creating the job
   * @param dto - Job creation parameters
   * @param file - Optional file upload
   * @returns Job response with taskId for tracking
   */
  async createJob(
    userId: number,
    dto: CreateJobDto,
    file?: Express.Multer.File
  ): Promise<JobResponseDto> {
    const taskId = uuidv4()

    let fileUrl: string | undefined
    let fileKey: string | undefined
    let fileName: string | undefined

    // Upload file to S3 if present
    if (file) {
      const uploadResult = await this.s3Service.uploadJobFile(taskId, file)
      fileUrl = uploadResult.url
      fileKey = uploadResult.key
      fileName = file.originalname
    }

    // Create job record
    const jobData: Prisma.JobUncheckedCreateInput = {
      taskId,
      jobType: dto.jobType,
      status: JobStatus.PENDING,
      queue: dto.queue || 'default',
      payload: dto.payload as Prisma.InputJsonValue,
      meta: dto.meta as Prisma.InputJsonValue,
      userId,
      fileUrl,
      fileKey,
      fileName,
      maxAttempts: dto.maxAttempts || 3,
    }
    const job = await this.repository.create(jobData)

    // Send message to SQS for async processing
    await this.sqsService.sendJobMessage({
      taskId,
      jobType: dto.jobType,
      payload: dto.payload,
      fileUrl,
      userId,
    })

    return this.mapToDto(job)
  }

  /**
   * Get job by ID with optional user ownership check
   * Generic retrieval - works for any job type
   */
  async getJobById(id: number, userId?: number): Promise<JobResponseDto> {
    const job = await this.repository.findById(id)

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`)
    }

    // Check user ownership (unless admin)
    if (userId && job.userId !== userId) {
      throw new NotFoundException(`Job with ID ${id} not found`)
    }

    return this.mapToDto(job)
  }

  /**
   * Get job by taskId (UUID)
   * Alternative lookup method for external references
   */
  async getJobByTaskId(taskId: string, userId?: number): Promise<JobResponseDto> {
    const job = await this.repository.findByTaskId(taskId)

    if (!job) {
      throw new NotFoundException(`Job with taskId ${taskId} not found`)
    }

    if (userId && job.userId !== userId) {
      throw new NotFoundException(`Job with taskId ${taskId} not found`)
    }

    return this.mapToDto(job)
  }

  /**
   * List jobs with filtering and pagination
   * Generic query method - supports filtering by jobType, status, user
   */
  async listJobs(
    query: JobQueryDto,
    userId?: number
  ): Promise<{
    data: JobResponseDto[]
    total: number
    page: number
    pageSize: number
  }> {
    const { jobType, status, page = 1, pageSize = 20 } = query

    const [jobs, total] = await this.repository.findMany({
      jobType,
      status,
      userId,
      page,
      pageSize,
    })

    return {
      data: jobs.map((job) => this.mapToDto(job)),
      total,
      page,
      pageSize,
    }
  }

  /**
   * Get execution logs for a job
   * Generic method - works for any job type
   */
  async getJobLogs(jobId: number, userId?: number): Promise<any[]> {
    const job = await this.repository.findById(jobId)

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`)
    }

    if (userId && job.userId !== userId) {
      throw new NotFoundException(`Job with ID ${jobId} not found`)
    }

    return this.repository.findLogs(jobId)
  }

  /**
   * Map database Job entity to DTO
   * Private helper method for consistent response formatting
   */
  private mapToDto(job: any): JobResponseDto {
    return {
      id: job.id,
      taskId: job.taskId,
      jobType: job.jobType,
      status: job.status,
      queue: job.queue,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      errorReason: job.errorReason,
      fileName: job.fileName,
      payload: job.payload,
      result: job.result,
      meta: job.meta,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    }
  }
}
