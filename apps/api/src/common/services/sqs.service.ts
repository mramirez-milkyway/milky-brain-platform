import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'

/**
 * Generic message interface for SQS
 * Extensible for any job type by adding fields to payload
 */
export interface JobMessage {
  taskId: string
  jobType: string
  payload?: unknown
  fileUrl?: string
  userId?: number
}

/**
 * Generic SQS service for message queue operations.
 * Design: Abstracted and loosely coupled - can be replaced with RabbitMQ, Redis, etc.
 *
 * Interface-like design allows easy mocking and swapping implementations.
 */
@Injectable()
export class SqsService {
  private readonly logger = new Logger(SqsService.name)
  private sqsClient: SQSClient
  private queueUrl: string

  constructor(private config: ConfigService) {
    const sqsConfig: any = {
      region: this.config.get('AWS_REGION') || 'eu-south-2',
    }

    // Support LocalStack endpoint
    const endpointUrl = this.config.get('AWS_ENDPOINT_URL')
    if (endpointUrl) {
      sqsConfig.endpoint = endpointUrl
      sqsConfig.credentials = {
        accessKeyId: this.config.get('AWS_ACCESS_KEY_ID') || 'test',
        secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY') || 'test',
      }
      this.logger.log(`Using LocalStack endpoint: ${endpointUrl}`)
    }

    this.sqsClient = new SQSClient(sqsConfig)
    this.queueUrl = this.config.get('SQS_JOBS_QUEUE_URL') || ''
  }

  /**
   * Send a job message to SQS queue
   * Generic method - works for any job type via JobMessage interface
   */
  async sendJobMessage(message: JobMessage): Promise<void> {
    try {
      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          jobType: {
            DataType: 'String',
            StringValue: message.jobType,
          },
          taskId: {
            DataType: 'String',
            StringValue: message.taskId,
          },
        },
      })

      await this.sqsClient.send(command)

      this.logger.log(`Job message sent to SQS: ${message.taskId} (${message.jobType})`)
    } catch (error) {
      this.logger.error(`Failed to send job message: ${error}`)
      throw error
    }
  }
}
