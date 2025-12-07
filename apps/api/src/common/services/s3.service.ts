import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * Generic S3 service for file operations.
 * Design: Abstracted and loosely coupled - can be replaced with any storage provider.
 *
 * Interface-like design allows easy mocking in tests and swapping implementations.
 */
export interface FileUploadResult {
  key: string
  url: string
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name)
  private s3Client: S3Client
  private bucketName: string

  constructor(private config: ConfigService) {
    // Support LocalStack endpoint
    const endpointUrl = this.config.get('AWS_ENDPOINT_URL')
    const region = this.config.get('AWS_REGION') || 'us-east-1'

    const s3Config: any = {
      region: endpointUrl ? 'us-east-1' : region, // LocalStack works best with us-east-1
    }

    if (endpointUrl) {
      s3Config.endpoint = endpointUrl
      s3Config.forcePathStyle = true // Required for LocalStack
      s3Config.credentials = {
        accessKeyId: this.config.get('AWS_ACCESS_KEY_ID') || 'test',
        secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY') || 'test',
      }
      this.logger.log(`Using LocalStack endpoint: ${endpointUrl} with region us-east-1`)
    }

    this.s3Client = new S3Client(s3Config)
    this.bucketName = this.config.get('S3_JOBS_BUCKET_NAME') || ''
  }

  /**
   * Upload a job file to S3
   * Generic method - works for any file type
   */
  async uploadJobFile(taskId: string, file: Express.Multer.File): Promise<FileUploadResult> {
    const key = `jobs/${taskId}/${Date.now()}-${file.originalname}`

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      )

      const url = `s3://${this.bucketName}/${key}`
      this.logger.log(`File uploaded successfully: ${key}`)

      return { key, url }
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error}`)
      throw error
    }
  }

  /**
   * Generate presigned URL for secure file download
   * Useful for frontend downloads without exposing credentials
   */
  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })

    return getSignedUrl(this.s3Client, command, { expiresIn })
  }

  /**
   * Delete a file from S3
   * Used for cleanup operations
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      )

      this.logger.log(`File deleted successfully: ${key}`)
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error}`)
      throw error
    }
  }

  /**
   * Download file as buffer
   * Generic method - used by Lambda to retrieve files
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      )

      const stream = response.Body as any
      const chunks: Buffer[] = []

      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      return Buffer.concat(chunks)
    } catch (error) {
      this.logger.error(`Failed to download file: ${error}`)
      throw error
    }
  }
}
