// Global test setup
// This file runs before all tests

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.AWS_REGION = 'eu-south-2'
process.env.S3_JOBS_BUCKET_NAME = 'test-bucket'
process.env.SQS_JOBS_QUEUE_URL = 'https://sqs.eu-south-2.amazonaws.com/123456789/test-queue'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Suppress console logs during tests (optional - uncomment if needed)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Set test timeout (optional)
jest.setTimeout(10000)
