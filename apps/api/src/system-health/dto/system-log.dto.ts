import { IsOptional, IsString, IsDateString, IsInt, Min } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * Query parameters for listing system logs
 */
export class SystemLogQueryDto {
  @IsOptional()
  @IsString()
  context?: string

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20
}

/**
 * Response DTO for system log list item (truncated)
 */
export class SystemLogListItemDto {
  id: number
  context: string
  errorMessage: string
  createdAt: Date

  constructor(partial: Partial<SystemLogListItemDto>) {
    Object.assign(this, partial)
  }
}

/**
 * Response DTO for system log details (full)
 */
export class SystemLogDetailDto {
  id: number
  context: string
  errorMessage: string
  stackTrace: string
  metadata: unknown
  createdAt: Date

  constructor(partial: Partial<SystemLogDetailDto>) {
    Object.assign(this, partial)
  }
}

/**
 * Response DTO for paginated system logs list
 */
export class SystemLogListResponseDto {
  data: SystemLogListItemDto[]
  total: number
  page: number
  pageSize: number
  totalPages: number

  constructor(partial: Partial<SystemLogListResponseDto>) {
    Object.assign(this, partial)
  }
}
