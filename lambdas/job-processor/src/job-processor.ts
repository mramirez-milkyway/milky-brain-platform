import { PrismaClient, JobStatus, LogLevel } from '@prisma/client';
import { getDatabase } from './database/client';
import { HandlerRegistry } from './handlers/handler-registry';
import { Logger } from './services/logger.service';
import { S3Service } from './services/s3.service';
import { JobMessage } from './types';

/**
 * Core job processor
 * Design: Generic, extensible, follows single responsibility principle
 *
 * Responsibilities:
 * - Fetch job from database
 * - Update job status
 * - Download files from S3
 * - Route to appropriate handler
 * - Handle errors and retries
 * - Log execution details
 *
 * Does NOT contain job-specific logic - delegates to handlers
 */
export class JobProcessor {
  private prisma: PrismaClient;
  private registry: HandlerRegistry;
  private logger: Logger;
  private s3Service: S3Service;

  constructor() {
    this.prisma = getDatabase();
    this.registry = new HandlerRegistry();
    this.logger = new Logger('JobProcessor');
    this.s3Service = new S3Service();
  }

  /**
   * Process a job message from SQS
   * Generic method - works with any job type
   *
   * @param message - SQS message containing job details
   */
  async process(message: JobMessage): Promise<void> {
    const { taskId, jobType } = message;

    // Find job in database
    const job = await this.prisma.job.findUnique({
      where: { taskId },
    });

    if (!job) {
      throw new Error(`Job not found: ${taskId}`);
    }

    // Update status to RUNNING
    await this.prisma.job.update({
      where: { taskId },
      data: {
        status: JobStatus.RUNNING,
        startedAt: new Date(),
        attempts: job.attempts + 1,
      },
    });

    await this.createLog(
      job.id,
      LogLevel.INFO,
      `Job started (attempt ${job.attempts + 1}/${job.maxAttempts})`,
    );

    try {
      // Get handler for job type
      const handler = this.registry.getHandler(jobType);

      if (!handler) {
        throw new Error(`No handler registered for job type: ${jobType}`);
      }

      // Download file from S3 if present
      let fileBuffer: Buffer | undefined;
      if (job.fileUrl && job.fileKey) {
        await this.createLog(job.id, LogLevel.INFO, 'Downloading file from S3');
        fileBuffer = await this.s3Service.downloadFile(job.fileKey);
      }

      // Execute handler with context
      await this.createLog(job.id, LogLevel.INFO, 'Executing job handler');

      const result = await handler.execute({
        taskId,
        jobType,
        payload: job.payload as any,
        fileBuffer,
        fileName: job.fileName || undefined,
        prisma: this.prisma,
        logger: (level: LogLevel, message: string, meta?: any, rowNumber?: number) =>
          this.createLog(job.id, level, message, meta, rowNumber),
      });

      // Mark as completed
      await this.prisma.job.update({
        where: { taskId },
        data: {
          status: JobStatus.COMPLETED,
          result: result || null,
          completedAt: new Date(),
        },
      });

      await this.createLog(job.id, LogLevel.INFO, 'Job completed successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.createLog(
        job.id,
        LogLevel.ERROR,
        `Job failed: ${errorMessage}`,
      );

      // Determine if should retry
      const shouldRetry = job.attempts < job.maxAttempts;

      await this.prisma.job.update({
        where: { taskId },
        data: {
          status: shouldRetry ? JobStatus.RETRYING : JobStatus.FAILED,
          errorReason: errorMessage,
          completedAt: shouldRetry ? null : new Date(),
        },
      });

      // Re-throw to trigger SQS retry mechanism
      if (shouldRetry) {
        this.logger.warn(
          `Job ${taskId} will be retried (attempt ${job.attempts}/${job.maxAttempts})`,
        );
        throw error;
      } else {
        this.logger.error(
          `Job ${taskId} failed after ${job.maxAttempts} attempts`,
        );
      }
    }
  }

  /**
   * Create a log entry in the database
   * Generic logging method used by handlers via context.logger
   */
  private async createLog(
    jobId: number,
    level: LogLevel,
    message: string,
    meta?: any,
    rowNumber?: number,
  ): Promise<void> {
    try {
      await this.prisma.jobLog.create({
        data: {
          jobId,
          level,
          message,
          meta: meta || null,
          rowNumber,
        },
      });

      this.logger.log(level.toLowerCase(), message, meta);
    } catch (error) {
      this.logger.error('Failed to create job log', error);
    }
  }
}
