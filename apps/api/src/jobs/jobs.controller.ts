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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CreateJobDto, JobQueryDto } from './dto';

/**
 * Generic jobs controller handling REST endpoints.
 * Design: Minimal HTTP/validation logic only - no business logic.
 *
 * All endpoints are generic and work with any job type via jobType parameter.
 */
@Controller('jobs')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  /**
   * Create a new async job
   * Generic endpoint - supports any job type with optional file upload
   *
   * @permission job:Create
   * @body CreateJobDto - Job parameters (jobType, payload, meta, queue, maxAttempts)
   * @file Optional file upload (multipart/form-data)
   */
  @Post()
  @RequirePermission('job:Create')
  @UseInterceptors(FileInterceptor('file'))
  async createJob(
    @Request() req: any,
    @Body() dto: CreateJobDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const userId = req.user.userId;
    return this.jobsService.createJob(userId, dto, file);
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
    const userId = req.user.userId;
    const roleIds = req.user.roleIds || [];

    // Admin can see all jobs, others only their own
    const isAdmin = roleIds.includes(1); // Assuming role ID 1 is Admin

    return this.jobsService.listJobs(query, isAdmin ? undefined : userId);
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
    const userId = req.user.userId;
    const roleIds = req.user.roleIds || [];
    const isAdmin = roleIds.includes(1);

    return this.jobsService.getJobById(id, isAdmin ? undefined : userId);
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
    const userId = req.user.userId;
    const roleIds = req.user.roleIds || [];
    const isAdmin = roleIds.includes(1);

    return this.jobsService.getJobLogs(id, isAdmin ? undefined : userId);
  }
}
