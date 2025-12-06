import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

/**
 * S3 service for Lambda file operations
 * Design: Minimal, focused on downloading job files
 *
 * Generic: Works with any file type - handlers determine how to parse
 */
export class S3Service {
  private client: S3Client;
  private bucketName: string;

  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION || 'eu-south-2',
    });
    this.bucketName = process.env.S3_BUCKET_NAME || '';
  }

  /**
   * Download file from S3 as Buffer
   * Generic method - returns raw bytes for handler to process
   *
   * @param key - S3 object key (path)
   * @returns File contents as Buffer
   */
  async downloadFile(key: string): Promise<Buffer> {
    console.log(`Downloading file from S3: ${key}`);

    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );

    const stream = response.Body as any;
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    console.log(`Downloaded ${buffer.length} bytes from S3`);

    return buffer;
  }
}
