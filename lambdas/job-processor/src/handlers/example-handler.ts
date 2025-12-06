import { BaseJobHandler } from './base-handler';
import { JobContext } from '../types';

/**
 * Example handler demonstrating the pattern
 * Design: Shows how to implement IJobHandler for a specific job type
 *
 * This handler serves as a template for creating new handlers.
 * Copy this file and modify execute() for your specific job type.
 *
 * Key patterns demonstrated:
 * - Using context.payload for job-specific data
 * - Logging at different levels
 * - Accessing file data via context.fileBuffer
 * - Using Prisma for database operations
 * - Returning structured results
 */
export class ExampleHandler extends BaseJobHandler {
  async execute(context: JobContext): Promise<any> {
    await this.logInfo(context, 'Starting example job');

    const { payload, fileBuffer, fileName } = context;

    // Log payload details
    await this.logInfo(
      context,
      `Processing job with payload: ${JSON.stringify(payload)}`,
    );

    // Process file if present
    if (fileBuffer) {
      await this.logInfo(
        context,
        `File received: ${fileName} (${fileBuffer.length} bytes)`,
      );

      // Example: Parse CSV, JSON, or other file formats here
      // const data = parseFile(fileBuffer);
    }

    // Example: Validate required payload fields
    try {
      this.validatePayload(payload, ['exampleField']);
    } catch (error: unknown) {
      await this.logError(context, `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }

    // Example: Database operations using Prisma
    // const records = await context.prisma.someModel.findMany();
    // await this.logInfo(context, `Found ${records.length} records`);

    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Example: Log warnings for non-critical issues
    if (!payload.optionalField) {
      await this.logWarning(
        context,
        'Optional field not provided, using default',
      );
    }

    await this.logInfo(context, 'Example job completed successfully');

    // Return structured result
    // This gets stored in job.result field
    return {
      success: true,
      processedAt: new Date().toISOString(),
      recordCount: 0,
      summary: 'Example job completed',
    };
  }
}
