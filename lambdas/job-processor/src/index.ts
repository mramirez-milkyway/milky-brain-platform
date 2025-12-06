import { SQSEvent, SQSRecord, SQSBatchResponse } from 'aws-lambda';
import { JobProcessor } from './job-processor';
import { Logger } from './services/logger.service';
import { JobMessage } from './types';

const logger = new Logger('LambdaHandler');
const processor = new JobProcessor();

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
  logger.info(`Processing ${event.Records.length} job(s)`);

  const batchItemFailures: SQSBatchResponse['batchItemFailures'] = [];

  for (const record of event.Records) {
    try {
      await processRecord(record);
    } catch (error) {
      logger.error(`Failed to process record ${record.messageId}`, error);

      // Report failure to SQS for retry
      batchItemFailures.push({
        itemIdentifier: record.messageId,
      });
    }
  }

  return { batchItemFailures };
};

/**
 * Process a single SQS record
 * Generic method - routes message to JobProcessor
 *
 * @param record - SQS record containing job message
 */
async function processRecord(record: SQSRecord): Promise<void> {
  const message: JobMessage = JSON.parse(record.body);

  logger.info(`Processing job: ${message.taskId} (${message.jobType})`);

  await processor.process(message);

  logger.info(`Job completed: ${message.taskId}`);
}
