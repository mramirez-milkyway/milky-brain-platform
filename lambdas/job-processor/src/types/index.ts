import { PrismaClient, LogLevel } from '@prisma/client';

/**
 * Generic job context interface
 * Design: Provides everything a handler needs without coupling to implementation
 *
 * Extensible: Handlers can access database, log, file data, and custom payload
 */
export interface JobContext {
  /** Unique job identifier (UUID) */
  taskId: string;

  /** Type of job being processed (e.g., 'csv_import', 'bulk_email') */
  jobType: string;

  /** Job-specific payload data (generic - any structure) */
  payload: any;

  /** File buffer if job has file attachment */
  fileBuffer?: Buffer;

  /** Original filename if job has file attachment */
  fileName?: string;

  /** Prisma client for database operations */
  prisma: PrismaClient;

  /** Logger function for creating job logs */
  logger: (level: LogLevel, message: string, meta?: any, rowNumber?: number) => Promise<void>;
}

/**
 * Generic job handler interface
 * Design: Strategy pattern - each job type implements this interface
 *
 * Key principle: Single responsibility - one handler per job type
 * Extensibility: New job types = new handler implementation
 */
export interface IJobHandler {
  /**
   * Execute the job with given context
   *
   * @param context - Complete job context with database access, logging, files
   * @returns Result object (structure defined by handler)
   * @throws Error on failure (captured and logged by processor)
   */
  execute(context: JobContext): Promise<any>;
}

/**
 * SQS message format
 */
export interface JobMessage {
  taskId: string;
  jobType: string;
  payload?: any;
  fileUrl?: string;
  userId?: number;
}
