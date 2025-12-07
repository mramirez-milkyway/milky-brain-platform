import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SqsService, JobMessage } from '../../../../src/common/services/sqs.service';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

// Mock AWS SDK
jest.mock('@aws-sdk/client-sqs');

describe('SqsService', () => {
  let service: SqsService;
  let configService: jest.Mocked<ConfigService>;
  let sqsClient: jest.Mocked<SQSClient>;

  const mockQueueUrl = 'https://sqs.eu-south-2.amazonaws.com/123456789/test-queue';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SqsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                AWS_REGION: 'eu-south-2',
                SQS_JOBS_QUEUE_URL: mockQueueUrl,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SqsService>(SqsService);
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;

    // Mock SQSClient instance
    sqsClient = {
      send: jest.fn(),
    } as any;

    // Replace the private sqsClient with our mock
    (service as any).sqsClient = sqsClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with AWS configuration', () => {
      expect(configService.get).toHaveBeenCalledWith('AWS_REGION');
      expect(configService.get).toHaveBeenCalledWith('SQS_JOBS_QUEUE_URL');
    });

    it('should configure LocalStack endpoint when AWS_ENDPOINT_URL is set', async () => {
      configService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          AWS_REGION: 'eu-south-2',
          SQS_JOBS_QUEUE_URL: mockQueueUrl,
          AWS_ENDPOINT_URL: 'http://localhost:4566',
          AWS_ACCESS_KEY_ID: 'test',
          AWS_SECRET_ACCESS_KEY: 'test',
        };
        return config[key];
      });

      const module = await Test.createTestingModule({
        providers: [
          SqsService,
          {
            provide: ConfigService,
            useValue: configService,
          },
        ],
      }).compile();

      const localStackService = module.get<SqsService>(SqsService);

      expect(localStackService).toBeDefined();
    });
  });

  describe('sendJobMessage', () => {
    it('should send message to SQS successfully', async () => {
      const message: JobMessage = {
        taskId: 'test-task-id',
        jobType: 'example',
        payload: { test: true },
        userId: 1,
      };

      sqsClient.send.mockResolvedValue({
        MessageId: 'mock-message-id',
      });

      await service.sendJobMessage(message);

      expect(sqsClient.send).toHaveBeenCalledWith(
        expect.any(SendMessageCommand)
      );

      const call = sqsClient.send.mock.calls[0][0] as SendMessageCommand;
      const input = call.input;

      expect(input.QueueUrl).toBe(mockQueueUrl);
      expect(input.MessageBody).toBe(JSON.stringify(message));
    });

    it('should include message attributes', async () => {
      const message: JobMessage = {
        taskId: 'test-task-id',
        jobType: 'csv-import',
        payload: { filename: 'test.csv' },
      };

      sqsClient.send.mockResolvedValue({
        MessageId: 'mock-message-id',
      });

      await service.sendJobMessage(message);

      const call = sqsClient.send.mock.calls[0][0] as SendMessageCommand;
      const attributes = call.input.MessageAttributes;

      expect(attributes?.jobType).toEqual({
        DataType: 'String',
        StringValue: 'csv-import',
      });

      expect(attributes?.taskId).toEqual({
        DataType: 'String',
        StringValue: 'test-task-id',
      });
    });

    it('should handle message without optional fields', async () => {
      const message: JobMessage = {
        taskId: 'test-task-id',
        jobType: 'simple-job',
      };

      sqsClient.send.mockResolvedValue({
        MessageId: 'mock-message-id',
      });

      await service.sendJobMessage(message);

      const call = sqsClient.send.mock.calls[0][0] as SendMessageCommand;
      const body = JSON.parse(call.input.MessageBody as string);

      expect(body.taskId).toBe('test-task-id');
      expect(body.jobType).toBe('simple-job');
      expect(body.payload).toBeUndefined();
      expect(body.fileUrl).toBeUndefined();
      expect(body.userId).toBeUndefined();
    });

    it('should include fileUrl when provided', async () => {
      const message: JobMessage = {
        taskId: 'test-task-id',
        jobType: 'file-processing',
        fileUrl: 's3://bucket/jobs/test-task-id/file.csv',
        payload: { rows: 100 },
      };

      sqsClient.send.mockResolvedValue({
        MessageId: 'mock-message-id',
      });

      await service.sendJobMessage(message);

      const call = sqsClient.send.mock.calls[0][0] as SendMessageCommand;
      const body = JSON.parse(call.input.MessageBody as string);

      expect(body.fileUrl).toBe('s3://bucket/jobs/test-task-id/file.csv');
    });

    it('should handle complex payload objects', async () => {
      const complexPayload = {
        config: {
          retry: true,
          maxRetries: 3,
        },
        data: [1, 2, 3, 4, 5],
        metadata: {
          source: 'api',
          timestamp: new Date().toISOString(),
        },
      };

      const message: JobMessage = {
        taskId: 'test-task-id',
        jobType: 'complex-job',
        payload: complexPayload,
      };

      sqsClient.send.mockResolvedValue({
        MessageId: 'mock-message-id',
      });

      await service.sendJobMessage(message);

      const call = sqsClient.send.mock.calls[0][0] as SendMessageCommand;
      const body = JSON.parse(call.input.MessageBody as string);

      expect(body.payload).toEqual(complexPayload);
    });

    it('should throw error when send fails', async () => {
      const message: JobMessage = {
        taskId: 'test-task-id',
        jobType: 'example',
      };

      const error = new Error('SQS send failed');
      sqsClient.send.mockRejectedValue(error);

      await expect(service.sendJobMessage(message)).rejects.toThrow(
        'SQS send failed'
      );

      expect(sqsClient.send).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      const message: JobMessage = {
        taskId: 'test-task-id',
        jobType: 'example',
      };

      const networkError = new Error('Network timeout');
      sqsClient.send.mockRejectedValue(networkError);

      await expect(service.sendJobMessage(message)).rejects.toThrow(
        'Network timeout'
      );
    });

    it('should send multiple messages independently', async () => {
      const messages: JobMessage[] = [
        { taskId: 'task-1', jobType: 'type-1' },
        { taskId: 'task-2', jobType: 'type-2' },
        { taskId: 'task-3', jobType: 'type-3' },
      ];

      sqsClient.send.mockResolvedValue({
        MessageId: 'mock-message-id',
      });

      for (const message of messages) {
        await service.sendJobMessage(message);
      }

      expect(sqsClient.send).toHaveBeenCalledTimes(3);

      // Verify each message was sent correctly
      const calls = sqsClient.send.mock.calls;
      for (let i = 0; i < messages.length; i++) {
        const call = calls[i][0] as SendMessageCommand;
        const body = JSON.parse(call.input.MessageBody as string);
        expect(body.taskId).toBe(messages[i].taskId);
        expect(body.jobType).toBe(messages[i].jobType);
      }
    });

    it('should preserve payload types in JSON serialization', async () => {
      const message: JobMessage = {
        taskId: 'test-task-id',
        jobType: 'data-job',
        payload: {
          string: 'text',
          number: 42,
          boolean: true,
          null: null,
          array: [1, 2, 3],
          object: { nested: 'value' },
        },
      };

      sqsClient.send.mockResolvedValue({
        MessageId: 'mock-message-id',
      });

      await service.sendJobMessage(message);

      const call = sqsClient.send.mock.calls[0][0] as SendMessageCommand;
      const body = JSON.parse(call.input.MessageBody as string);

      expect(typeof body.payload.string).toBe('string');
      expect(typeof body.payload.number).toBe('number');
      expect(typeof body.payload.boolean).toBe('boolean');
      expect(body.payload.null).toBeNull();
      expect(Array.isArray(body.payload.array)).toBe(true);
      expect(typeof body.payload.object).toBe('object');
    });

    it('should handle userId for user-specific jobs', async () => {
      const message: JobMessage = {
        taskId: 'user-task-123',
        jobType: 'user-export',
        userId: 42,
        payload: { format: 'csv' },
      };

      sqsClient.send.mockResolvedValue({
        MessageId: 'mock-message-id',
      });

      await service.sendJobMessage(message);

      const call = sqsClient.send.mock.calls[0][0] as SendMessageCommand;
      const body = JSON.parse(call.input.MessageBody as string);

      expect(body.userId).toBe(42);
    });
  });
});
