import { Prisma, PrismaClient } from '@prisma/client'
import { getDatabase } from '../database/client'

/**
 * Service for logging unhandled exceptions to SystemLog table.
 * Used by Lambda error wrapper to capture system-level errors.
 */
export class SystemLogService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = getDatabase()
  }

  /**
   * Log an unhandled exception to SystemLog
   *
   * @param context - Source context (e.g., "Lambda:job-processor")
   * @param error - The caught exception
   * @param metadata - Additional context for debugging
   */
  async logException(
    context: string,
    error: unknown,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const stackTrace = error instanceof Error ? error.stack || '' : ''

      await this.prisma.systemLog.create({
        data: {
          context,
          errorMessage,
          stackTrace,
          metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
      })
    } catch (logError) {
      // If logging fails, output to console as fallback
      console.error('Failed to log system error to database:', logError)
      console.error('Original error:', error)
    }
  }
}

// Singleton instance for reuse across Lambda invocations
let systemLogService: SystemLogService | undefined

export function getSystemLogService(): SystemLogService {
  if (!systemLogService) {
    systemLogService = new SystemLogService()
  }
  return systemLogService
}
