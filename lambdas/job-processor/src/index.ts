import { SQSEvent, SQSRecord, SQSBatchResponse } from 'aws-lambda'
import { JobProcessor } from './job-processor'
import { Logger } from './services/logger.service'
import { getSystemLogService } from './services/system-log.service'
import { JobMessage } from './types'

const logger = new Logger('LambdaHandler')
const processor = new JobProcessor()
const LAMBDA_CONTEXT = 'Lambda:job-processor'

/**
 * Lambda handler for SQS-triggered job processing
 * Design: Generic handler supporting any job type via message content
 *
 * Features:
 * - Batch processing (configurable batch size)
 * - Partial batch response (individual message failures)
 * - Error handling and retry via SQS
 *
 * SQS Configuration:
 * - Batch size: 1 (process one job at a time)
 * - Visibility timeout: Lambda timeout + 30s
 * - Max receive count: 3 (retry limit)
 */
export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  logger.info(`Processing ${event.Records.length} job(s)`)

  const batchItemFailures: SQSBatchResponse['batchItemFailures'] = []

  for (const record of event.Records) {
    try {
      await processRecord(record)
    } catch (error) {
      logger.error(`Failed to process record ${record.messageId}`, error)

      // Log unhandled exception to SystemLog for visibility in admin panel
      await logUnhandledException(error, record)

      // Report failure to SQS for retry
      batchItemFailures.push({
        itemIdentifier: record.messageId,
      })
    }
  }

  return { batchItemFailures }
}

/**
 * Process a single SQS record
 * Generic method - routes message to JobProcessor
 *
 * @param record - SQS record containing job message
 */
async function processRecord(record: SQSRecord): Promise<void> {
  const message: JobMessage = JSON.parse(record.body)

  logger.info(`Processing job: ${message.taskId} (${message.jobType})`)

  await processor.process(message)

  logger.info(`Job completed: ${message.taskId}`)
}

/**
 * Log unhandled exception to SystemLog table
 * Provides visibility into system failures via admin panel
 *
 * @param error - The caught exception
 * @param record - SQS record for context
 */
async function logUnhandledException(error: unknown, record: SQSRecord): Promise<void> {
  try {
    const systemLogService = getSystemLogService()

    // Parse message for context (may fail if message is malformed)
    let jobContext: Record<string, unknown> = {}
    try {
      const message: JobMessage = JSON.parse(record.body)
      jobContext = {
        taskId: message.taskId,
        jobType: message.jobType,
      }
    } catch {
      jobContext = { rawBody: record.body.substring(0, 500) }
    }

    await systemLogService.logException(LAMBDA_CONTEXT, error, {
      messageId: record.messageId,
      ...jobContext,
      eventSource: record.eventSource,
      awsRegion: record.awsRegion,
    })
  } catch (logError) {
    // Logging failure should not prevent SQS retry
    logger.error('Failed to log exception to SystemLog', logError)
  }
}
