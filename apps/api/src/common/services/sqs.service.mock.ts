import { Injectable } from '@nestjs/common';

/**
 * Mock SQS Service for Local Testing
 * Logs messages to console instead of sending to AWS SQS
 */
@Injectable()
export class MockSqsService {
  private messages: Array<{ taskId: string; jobType: string; payload?: unknown }> = [];

  async sendJobMessage(message: {
    taskId: string;
    jobType: string;
    payload?: unknown;
    fileUrl?: string;
    userId?: number;
  }): Promise<void> {
    console.log('[MockSQS] Message sent:', JSON.stringify(message, null, 2));

    // Store message for inspection
    this.messages.push(message);
  }

  // Helper for testing
  getMessages() {
    return this.messages;
  }

  clearMessages() {
    this.messages = [];
  }
}
