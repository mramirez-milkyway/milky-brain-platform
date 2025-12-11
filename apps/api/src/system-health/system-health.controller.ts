import { Controller, Get, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common'
import { SystemHealthService } from './system-health.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../common/guards/permission.guard'
import { RequirePermission } from '../common/decorators/require-permission.decorator'
import { SystemLogQueryDto } from './dto'

/**
 * Controller for system health log endpoints.
 * Provides visibility into unhandled exceptions for technical admins.
 *
 * All endpoints require systemHealth:Read permission (Admin only).
 */
@Controller('system-health')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class SystemHealthController {
  constructor(private readonly systemHealthService: SystemHealthService) {}

  /**
   * List system logs with pagination and filtering
   *
   * @permission systemHealth:Read
   * @query context - Filter by error context (e.g., "API", "Lambda:job-processor")
   * @query startDate - Filter by start date (ISO 8601)
   * @query endDate - Filter by end date (ISO 8601)
   * @query page - Page number (default: 1)
   * @query pageSize - Results per page (default: 20)
   */
  @Get('logs')
  @RequirePermission('systemHealth:Read')
  async listLogs(@Query() query: SystemLogQueryDto) {
    return this.systemHealthService.listLogs(query)
  }

  /**
   * Get available contexts for filtering dropdown
   *
   * @permission systemHealth:Read
   */
  @Get('contexts')
  @RequirePermission('systemHealth:Read')
  async getContexts() {
    return this.systemHealthService.getContexts()
  }

  /**
   * Get system log details by ID
   *
   * @permission systemHealth:Read
   * @param id - System log ID
   */
  @Get('logs/:id')
  @RequirePermission('systemHealth:Read')
  async getLog(@Param('id', ParseIntPipe) id: number) {
    return this.systemHealthService.getLogById(id)
  }

  /**
   * Test endpoint to trigger an unhandled exception.
   * Use this to verify the global exception filter is working.
   *
   * @permission systemHealth:Read
   * @dev Remove in production
   */
  @Get('test-error')
  @RequirePermission('systemHealth:Read')
  testError(): never {
    throw new Error('Test unhandled exception - triggered manually for debugging')
  }
}
