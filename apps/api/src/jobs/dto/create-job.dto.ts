import { IsString, IsOptional, IsObject, IsInt, Min, Max } from 'class-validator'
import { Transform } from 'class-transformer'

/**
 * DTO for creating async jobs
 *
 * Job Type Schemas:
 *
 * 1. influencer_import
 *    - Description: Import influencers from CSV file
 *    - File: Required (.csv or .txt, max 10MB)
 *    - Permission: influencer:Import
 *    - Payload:
 *      {
 *        columnMapping: Record<string, string>  // Maps CSV columns to DB fields
 *                                                // e.g., { "Name": "name", "Platform": "platform" }
 *        duplicateHandling: "skip" | "update"   // How to handle duplicates (default: "skip")
 *      }
 *    - Result Schema:
 *      {
 *        totalRecords: number,
 *        successCount: number,
 *        errorCount: number,
 *        skippedCount: number,
 *        updatedCount: number,
 *        errors: Array<{ row: number, error: string }>
 *      }
 *
 * 2. example
 *    - Description: Example job for testing
 *    - File: Optional
 *    - Permission: job:Create
 *    - Payload: { test: boolean }
 */
export class CreateJobDto {
  @IsString()
  jobType: string

  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    // Handle JSON string from FormData
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    }
    return value
  })
  payload?: Record<string, unknown>

  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    // Handle JSON string from FormData
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    }
    return value
  })
  meta?: Record<string, unknown>

  @IsOptional()
  @IsString()
  queue?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxAttempts?: number
}
