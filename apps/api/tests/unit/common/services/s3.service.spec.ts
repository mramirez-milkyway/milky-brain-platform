import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../../../../src/common/services/s3.service';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('S3Service', () => {
  let service: S3Service;
  let configService: jest.Mocked<ConfigService>;
  let s3Client: jest.Mocked<S3Client>;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.csv',
    encoding: '7bit',
    mimetype: 'text/csv',
    buffer: Buffer.from('test,data\n1,2'),
    size: 13,
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                AWS_REGION: 'eu-south-2',
                S3_JOBS_BUCKET_NAME: 'test-bucket',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;

    // Mock S3Client instance
    s3Client = {
      send: jest.fn(),
    } as any;

    // Replace the private s3Client with our mock
    (service as any).s3Client = s3Client;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with AWS configuration', () => {
      expect(configService.get).toHaveBeenCalledWith('AWS_REGION');
      expect(configService.get).toHaveBeenCalledWith('S3_JOBS_BUCKET_NAME');
    });

    it('should configure LocalStack endpoint when AWS_ENDPOINT_URL is set', async () => {
      configService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          AWS_REGION: 'eu-south-2',
          S3_JOBS_BUCKET_NAME: 'test-bucket',
          AWS_ENDPOINT_URL: 'http://localhost:4566',
          AWS_ACCESS_KEY_ID: 'test',
          AWS_SECRET_ACCESS_KEY: 'test',
        };
        return config[key];
      });

      const module = await Test.createTestingModule({
        providers: [
          S3Service,
          {
            provide: ConfigService,
            useValue: configService,
          },
        ],
      }).compile();

      const localStackService = module.get<S3Service>(S3Service);

      expect(localStackService).toBeDefined();
    });
  });

  describe('uploadJobFile', () => {
    it('should upload file to S3 successfully', async () => {
      s3Client.send.mockResolvedValue({});

      const result = await service.uploadJobFile('test-task-id', mockFile);

      expect(s3Client.send).toHaveBeenCalledWith(
        expect.any(PutObjectCommand)
      );

      expect(result.key).toMatch(/^jobs\/test-task-id\/\d+-test\.csv$/);
      expect(result.url).toMatch(/^s3:\/\/test-bucket\/jobs\/test-task-id\/\d+-test\.csv$/);
    });

    it('should include correct metadata in upload', async () => {
      s3Client.send.mockResolvedValue({});

      await service.uploadJobFile('test-task-id', mockFile);

      const call = s3Client.send.mock.calls[0][0] as PutObjectCommand;
      const input = call.input;

      expect(input.Bucket).toBe('test-bucket');
      expect(input.Key).toMatch(/^jobs\/test-task-id\//);
      expect(input.Body).toEqual(mockFile.buffer);
      expect(input.ContentType).toBe('text/csv');
    });

    it('should throw error when upload fails', async () => {
      const error = new Error('S3 upload failed');
      s3Client.send.mockRejectedValue(error);

      await expect(
        service.uploadJobFile('test-task-id', mockFile)
      ).rejects.toThrow('S3 upload failed');

      expect(s3Client.send).toHaveBeenCalled();
    });

    it('should handle different file types', async () => {
      s3Client.send.mockResolvedValue({});

      const jsonFile: Express.Multer.File = {
        ...mockFile,
        originalname: 'data.json',
        mimetype: 'application/json',
        buffer: Buffer.from('{"test": true}'),
      };

      const result = await service.uploadJobFile('task-123', jsonFile);

      const call = s3Client.send.mock.calls[0][0] as PutObjectCommand;
      expect(call.input.ContentType).toBe('application/json');
      expect(result.key).toMatch(/data\.json$/);
    });

    it('should use timestamp in file key to avoid collisions', async () => {
      s3Client.send.mockResolvedValue({});

      const result1 = await service.uploadJobFile('task-1', mockFile);
      const result2 = await service.uploadJobFile('task-1', mockFile);

      expect(result1.key).not.toEqual(result2.key);
    });
  });

  describe('getPresignedDownloadUrl', () => {
    it('should generate presigned URL', async () => {
      const mockUrl = 'https://test-bucket.s3.amazonaws.com/signed-url';
      (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

      const result = await service.getPresignedDownloadUrl('jobs/test/file.csv');

      expect(getSignedUrl).toHaveBeenCalledWith(
        s3Client,
        expect.any(GetObjectCommand),
        { expiresIn: 3600 }
      );

      expect(result).toBe(mockUrl);
    });

    it('should use custom expiration time', async () => {
      const mockUrl = 'https://test-bucket.s3.amazonaws.com/signed-url';
      (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

      await service.getPresignedDownloadUrl('jobs/test/file.csv', 7200);

      expect(getSignedUrl).toHaveBeenCalledWith(
        s3Client,
        expect.any(GetObjectCommand),
        { expiresIn: 7200 }
      );
    });

    it('should include correct bucket and key in command', async () => {
      const mockUrl = 'https://test-bucket.s3.amazonaws.com/signed-url';
      (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

      await service.getPresignedDownloadUrl('jobs/test/file.csv');

      const call = (getSignedUrl as jest.Mock).mock.calls[0];
      const command = call[1] as GetObjectCommand;

      expect(command.input.Bucket).toBe('test-bucket');
      expect(command.input.Key).toBe('jobs/test/file.csv');
    });
  });

  describe('deleteFile', () => {
    it('should delete file from S3', async () => {
      s3Client.send.mockResolvedValue({});

      await service.deleteFile('jobs/test-task-id/file.csv');

      expect(s3Client.send).toHaveBeenCalledWith(
        expect.any(DeleteObjectCommand)
      );

      const call = s3Client.send.mock.calls[0][0] as DeleteObjectCommand;
      expect(call.input.Bucket).toBe('test-bucket');
      expect(call.input.Key).toBe('jobs/test-task-id/file.csv');
    });

    it('should throw error when delete fails', async () => {
      const error = new Error('S3 delete failed');
      s3Client.send.mockRejectedValue(error);

      await expect(
        service.deleteFile('jobs/test/file.csv')
      ).rejects.toThrow('S3 delete failed');
    });
  });

  describe('downloadFile', () => {
    it('should download file as buffer', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from('test');
          yield Buffer.from('data');
        },
      };

      s3Client.send.mockResolvedValue({
        Body: mockStream,
      });

      const result = await service.downloadFile('jobs/test/file.csv');

      expect(s3Client.send).toHaveBeenCalledWith(
        expect.any(GetObjectCommand)
      );

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('testdata');
    });

    it('should handle empty file', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          // Empty stream
        },
      };

      s3Client.send.mockResolvedValue({
        Body: mockStream,
      });

      const result = await service.downloadFile('jobs/test/empty.csv');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(0);
    });

    it('should throw error when download fails', async () => {
      const error = new Error('S3 download failed');
      s3Client.send.mockRejectedValue(error);

      await expect(
        service.downloadFile('jobs/test/file.csv')
      ).rejects.toThrow('S3 download failed');
    });

    it('should include correct bucket and key in command', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from('data');
        },
      };

      s3Client.send.mockResolvedValue({
        Body: mockStream,
      });

      await service.downloadFile('jobs/task-123/file.csv');

      const call = s3Client.send.mock.calls[0][0] as GetObjectCommand;
      expect(call.input.Bucket).toBe('test-bucket');
      expect(call.input.Key).toBe('jobs/task-123/file.csv');
    });

    it('should handle large files with multiple chunks', async () => {
      const chunks = Array(100).fill(Buffer.from('chunk'));
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          for (const chunk of chunks) {
            yield chunk;
          }
        },
      };

      s3Client.send.mockResolvedValue({
        Body: mockStream,
      });

      const result = await service.downloadFile('jobs/test/large-file.csv');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(500); // 100 chunks * 5 bytes each
    });
  });
});
