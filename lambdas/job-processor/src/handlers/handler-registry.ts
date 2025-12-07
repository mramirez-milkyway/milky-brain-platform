import { IJobHandler } from '../types'
import { ExampleHandler } from './example-handler'
import { CreatorImportHandler } from './creator-import-handler'

/**
 * Handler registry implementing Strategy pattern
 * Design: Central registry maps job types to handler implementations
 *
 * Extensibility: Add new job types by registering new handlers
 * No modification needed to core processor logic
 *
 * Example usage:
 * ```typescript
 * // In handler-registry.ts constructor:
 * this.register('csv_import', new CsvImportHandler());
 * this.register('bulk_email', new BulkEmailHandler());
 * this.register('data_migration', new DataMigrationHandler());
 * ```
 */
export class HandlerRegistry {
  private handlers: Map<string, IJobHandler> = new Map()

  constructor() {
    // Register default handlers here
    // Future handlers are added by importing and registering them
    this.register('example', new ExampleHandler())
    this.register('influencer_import', new CreatorImportHandler())

    // ============================================
    // ADD NEW HANDLERS HERE:
    // ============================================
    // this.register('creator_export', new CreatorExportHandler());
    // this.register('campaign_analysis', new CampaignAnalysisHandler());
    // ============================================
  }

  /**
   * Register a new job handler
   *
   * @param jobType - Unique job type identifier (e.g., 'csv_import')
   * @param handler - Handler instance implementing IJobHandler
   */
  register(jobType: string, handler: IJobHandler): void {
    if (this.handlers.has(jobType)) {
      console.warn(`Handler for job type '${jobType}' is being overwritten`)
    }

    this.handlers.set(jobType, handler)
    console.log(`Registered handler for job type: ${jobType}`)
  }

  /**
   * Get handler for a specific job type
   *
   * @param jobType - Job type identifier
   * @returns Handler instance or undefined if not registered
   */
  getHandler(jobType: string): IJobHandler | undefined {
    return this.handlers.get(jobType)
  }

  /**
   * Check if handler exists for job type
   *
   * @param jobType - Job type identifier
   * @returns true if handler is registered
   */
  hasHandler(jobType: string): boolean {
    return this.handlers.has(jobType)
  }

  /**
   * Get all registered job types
   * Useful for debugging and validation
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys())
  }

  /**
   * Unregister a handler (useful for testing)
   *
   * @param jobType - Job type identifier
   */
  unregister(jobType: string): boolean {
    return this.handlers.delete(jobType)
  }
}
