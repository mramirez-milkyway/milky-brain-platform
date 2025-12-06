import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Mock S3 Service for Local Testing
 * Stores files in local filesystem instead of AWS S3
 */
@Injectable()
export class MockS3Service {
  private localStoragePath = join(process.cwd(), 'tmp', 'mock-s3');

  constructor() {
    // Ensure directory exists
    fs.mkdir(this.localStoragePath, { recursive: true }).catch(console.error);
  }

  async uploadJobFile(
    taskId: string,
    file: Express.Multer.File,
  ): Promise<{ key: string; url: string }> {
    const key = `jobs/${taskId}/${Date.now()}-${file.originalname}`;
    const filePath = join(this.localStoragePath, key);

    // Create directory
    await fs.mkdir(join(this.localStoragePath, `jobs/${taskId}`), { recursive: true });

    // Write file
    await fs.writeFile(filePath, file.buffer);

    const url = `file://${filePath}`;

    console.log(`[MockS3] File uploaded: ${key}`);

    return { key, url };
  }

  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const filePath = join(this.localStoragePath, key);
    return `file://${filePath}`;
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = join(this.localStoragePath, key);
    await fs.unlink(filePath).catch(() => {});
    console.log(`[MockS3] File deleted: ${key}`);
  }

  async downloadFile(key: string): Promise<Buffer> {
    const filePath = join(this.localStoragePath, key);
    return await fs.readFile(filePath);
  }
}
