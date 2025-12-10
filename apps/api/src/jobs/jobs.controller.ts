import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
  PayloadTooLargeException,
  ForbiddenException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { JobsService } from './jobs.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../common/guards/permission.guard'
import { RequirePermission } from '../common/decorators/require-permission.decorator'
import { CreateJobDto, JobQueryDto } from './dto'
import { RbacService } from '../common/services/rbac.service'

/**
 * Generic jobs controller handling REST endpoints.
 * Design: Minimal HTTP/validation logic only - no business logic.
 *
 * All endpoints are generic and work with any job type via jobType parameter.
 */
@Controller('jobs')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly rbacService: RbacService
  ) {}

  /**
   * Create a new async job
   * Generic endpoint - supports any job type with optional file upload
   *
   * @permission job:Create (generic) or specific permission based on jobType
   * @body CreateJobDto - Job parameters (jobType, payload, meta, queue, maxAttempts)
   * @file Optional file upload (multipart/form-data)
   *
   * Job-specific validations:
   * - influencer_import: Requires influencer:Import permission, file required, .csv/.txt only, 10MB max
   * - client_import: Requires client:Import permission, file required, .csv/.txt only, 10MB max
   */
  @Post()
  @RequirePermission('job:Create')
  @UseInterceptors(FileInterceptor('file'))
  async createJob(
    @Request() req: any,
    @Body() dto: CreateJobDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const userId = req.user.userId

    // Job-type specific validation
    if (dto.jobType === 'influencer_import' || dto.jobType === 'client_import') {
      // Determine required permission based on job type
      const requiredPermission =
        dto.jobType === 'influencer_import' ? 'influencer:Import' : 'client:Import'
      const entityName = dto.jobType === 'influencer_import' ? 'influencers' : 'clients'

      // Check for required permission using RBAC service
      const hasPermission = await this.rbacService.checkPermission(
        userId,
        requiredPermission,
        'res:*'
      )

      if (!hasPermission) {
        throw new ForbiddenException(
          `You do not have permission to import ${entityName}. Required permission: ${requiredPermission}`
        )
      }

      // File is required for import jobs
      if (!file) {
        throw new BadRequestException(`File is required for ${entityName} import jobs`)
      }

      // Validate file type (.csv or .txt only)
      const allowedMimeTypes = ['text/csv', 'text/plain']
      const allowedExtensions = ['.csv', '.txt']
      const fileExtension = file.originalname
        .toLowerCase()
        .substring(file.originalname.lastIndexOf('.'))

      if (!allowedMimeTypes.includes(file.mimetype) && !allowedExtensions.includes(fileExtension)) {
        throw new BadRequestException('Invalid file type. Only .csv and .txt files are allowed')
      }

      // Validate file size (10MB max)
      const maxSizeBytes = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSizeBytes) {
        throw new PayloadTooLargeException(
          `File size exceeds maximum allowed size of 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`
        )
      }
    }

    return this.jobsService.createJob(userId, dto, file)
  }

  /**
   * List jobs with filtering and pagination
   * Generic endpoint - supports filtering by jobType, status
   *
   * @permission job:Read
   * @query jobType - Filter by specific job type
   * @query status - Filter by job status (PENDING, RUNNING, COMPLETED, FAILED, RETRYING)
   * @query page - Page number (default: 1)
   * @query pageSize - Results per page (default: 20)
   */
  @Get()
  @RequirePermission('job:Read')
  async listJobs(@Request() req: any, @Query() query: JobQueryDto) {
    const userId = req.user.userId
    const roleIds = req.user.roleIds || []

    // Admin can see all jobs, others only their own
    const isAdmin = roleIds.includes(1) // Assuming role ID 1 is Admin

    return this.jobsService.listJobs(query, isAdmin ? undefined : userId)
  }

  /**
   * Get job details by ID
   * Generic endpoint - works for any job type
   *
   * @permission job:Read
   * @param id - Job ID
   */
  @Get(':id')
  @RequirePermission('job:Read')
  async getJob(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.userId
    const roleIds = req.user.roleIds || []
    const isAdmin = roleIds.includes(1)

    return this.jobsService.getJobById(id, isAdmin ? undefined : userId)
  }

  /**
   * Get job execution logs
   * Generic endpoint - retrieves logs for any job type
   *
   * @permission job:Read
   * @param id - Job ID
   */
  @Get(':id/logs')
  @RequirePermission('job:Read')
  async getJobLogs(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.userId
    const roleIds = req.user.roleIds || []
    const isAdmin = roleIds.includes(1)

    return this.jobsService.getJobLogs(id, isAdmin ? undefined : userId)
  }
}
