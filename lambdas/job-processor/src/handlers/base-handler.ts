import { LogLevel } from '@prisma/client';
import { IJobHandler, JobContext } from '../types';

/**
 * Abstract base class for job handlers
 * Design: Template pattern with helper methods
 *
 * Provides common logging helpers while enforcing execute() implementation
 * Extensible: Subclasses can override or extend functionality
 */
export abstract class BaseJobHandler implements IJobHandler {
  /**
   * Execute the job - must be implemented by subclasses
   * This is where job-specific logic goes
   */
  abstract execute(context: JobContext): Promise<any>;

  /**
   * Log info message
   * Helper method for clean logging in handlers
   */
  protected async logInfo(
    context: JobContext,
    message: string,
    meta?: any,
    rowNumber?: number,
  ): Promise<void> {
    await context.logger(LogLevel.INFO, message, meta, rowNumber);
  }

  /**
   * Log warning message
   * Use for non-critical issues that don't stop processing
   */
  protected async logWarning(
    context: JobContext,
    message: string,
    meta?: any,
    rowNumber?: number,
  ): Promise<void> {
    await context.logger(LogLevel.WARNING, message, meta, rowNumber);
  }

  /**
   * Log error message
   * Use for failures that prevent processing
   */
  protected async logError(
    context: JobContext,
    message: string,
    meta?: any,
    rowNumber?: number,
  ): Promise<void> {
    await context.logger(LogLevel.ERROR, message, meta, rowNumber);
  }

  /**
   * Log debug message
   * Use for detailed troubleshooting information
   */
  protected async logDebug(
    context: JobContext,
    message: string,
    meta?: any,
  ): Promise<void> {
    await context.logger(LogLevel.DEBUG, message, meta);
  }

  /**
   * Validate required payload fields
   * Generic validation helper for handlers
   *
   * @param payload - Job payload to validate
   * @param requiredFields - Array of required field names
   * @throws Error if any required field is missing
   */
  protected validatePayload(payload: any, requiredFields: string[]): void {
    const missing = requiredFields.filter((field) => !(field in payload));

    if (missing.length > 0) {
      throw new Error(`Missing required payload fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Safe JSON parse with error handling
   * Helper for parsing JSON strings in payloads
   */
  protected safeJsonParse<T>(json: string, defaultValue: T): T {
    try {
      return JSON.parse(json);
    } catch {
      return defaultValue;
    }
  }
}
