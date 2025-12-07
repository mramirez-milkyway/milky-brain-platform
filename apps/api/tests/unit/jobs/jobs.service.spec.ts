import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobStatus } from '@prisma/client';
import { JobsService } from '../../../src/jobs/jobs.service';
import { JobsRepository } from '../../../src/jobs/jobs.repository';
import { S3Service } from '../../../src/common/services/s3.service';
import { SqsService } from '../../../src/common/services/sqs.service';
import { CreateJobDto } from '../../../src/jobs/dto';

describe('JobsService', () => {
  let service: JobsService;
  let repository: jest.Mocked<JobsRepository>;
  let s3Service: jest.Mocked<S3Service>;
  let sqsService: jest.Mocked<SqsService>;
  let configService: jest.Mocked<ConfigService>;

  const mockJob = {
    id: 1,
    taskId: 'test-task-id',
    jobType: 'example',
    status: JobStatus.PENDING,
    queue: 'default',
    attempts: 0,
    maxAttempts: 3,
    errorReason: null,
    fileName: 'test.csv',
    fileUrl: 's3://bucket/jobs/test-task-id/test.csv',
    fileKey: 'jobs/test-task-id/test.csv',
    payload: { test: true },
    result: null,
    meta: null,
    userId: 1,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: JobsRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByTaskId: jest.fn(),
            findMany: jest.fn(),
            findLogs: jest.fn(),
            updateStatus: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: S3Service,
          useValue: {
            uploadJobFile: jest.fn(),
            downloadFile: jest.fn(),
            deleteFile: jest.fn(),
            getPresignedDownloadUrl: jest.fn(),
          },
        },
        {
          provide: SqsService,
          useValue: {
            sendJobMessage: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    repository = module.get(JobsRepository) as jest.Mocked<JobsRepository>;
    s3Service = module.get(S3Service) as jest.Mocked<S3Service>;
    sqsService = module.get(SqsService) as jest.Mocked<SqsService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createJob', () => {
    it('should create a job without file upload', async () => {
      const dto: CreateJobDto = {
        jobType: 'example',
        payload: { test: true },
      };

      const jobWithoutFile = { ...mockJob, fileName: null, fileUrl: undefined, fileKey: undefined };
      repository.create.mockResolvedValue(jobWithoutFile);
      sqsService.sendJobMessage.mockResolvedValue();

      const result = await service.createJob(1, dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          jobType: 'example',
          status: JobStatus.PENDING,
          userId: 1,
          payload: { test: true },
          maxAttempts: 3,
        })
      );

      expect(sqsService.sendJobMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          jobType: 'example',
          payload: { test: true },
          userId: 1,
        })
      );

      expect(result.jobType).toBe('example');
      expect(result.status).toBe(JobStatus.PENDING);
    });

    it('should create a job with file upload', async () => {
      const dto: CreateJobDto = {
        jobType: 'csv-import',
        payload: { test: true },
      };

      const mockFile = {
        originalname: 'test.csv',
        buffer: Buffer.from('test data'),
        mimetype: 'text/csv',
      } as Express.Multer.File;

      s3Service.uploadJobFile.mockResolvedValue({
        key: 'jobs/test-task-id/test.csv',
        url: 's3://bucket/jobs/test-task-id/test.csv',
      });

      repository.create.mockResolvedValue(mockJob);
      sqsService.sendJobMessage.mockResolvedValue();

      const result = await service.createJob(1, dto, mockFile);

      expect(s3Service.uploadJobFile).toHaveBeenCalledWith(
        expect.any(String),
        mockFile
      );

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'test.csv',
          fileUrl: 's3://bucket/jobs/test-task-id/test.csv',
          fileKey: 'jobs/test-task-id/test.csv',
        })
      );

      expect(result.fileName).toBe('test.csv');
    });

    it('should use custom maxAttempts if provided', async () => {
      const dto: CreateJobDto = {
        jobType: 'example',
        payload: { test: true },
        maxAttempts: 5,
      };

      repository.create.mockResolvedValue({ ...mockJob, maxAttempts: 5 });
      sqsService.sendJobMessage.mockResolvedValue();

      await service.createJob(1, dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          maxAttempts: 5,
        })
      );
    });

    it('should use custom queue if provided', async () => {
      const dto: CreateJobDto = {
        jobType: 'example',
        payload: { test: true },
        queue: 'priority',
      };

      repository.create.mockResolvedValue({ ...mockJob, queue: 'priority' });
      sqsService.sendJobMessage.mockResolvedValue();

      await service.createJob(1, dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          queue: 'priority',
        })
      );
    });

    it('should propagate S3 upload errors', async () => {
      const dto: CreateJobDto = {
        jobType: 'csv-import',
        payload: { test: true },
      };

      const mockFile = {
        originalname: 'test.csv',
        buffer: Buffer.from('test data'),
        mimetype: 'text/csv',
      } as Express.Multer.File;

      s3Service.uploadJobFile.mockRejectedValue(new Error('S3 upload failed'));

      await expect(service.createJob(1, dto, mockFile)).rejects.toThrow(
        'S3 upload failed'
      );

      expect(repository.create).not.toHaveBeenCalled();
      expect(sqsService.sendJobMessage).not.toHaveBeenCalled();
    });
  });

  describe('getJobById', () => {
    it('should return job by ID', async () => {
      repository.findById.mockResolvedValue(mockJob);

      const result = await service.getJobById(1);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
      expect(result.taskId).toBe('test-task-id');
    });

    it('should throw NotFoundException when job not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getJobById(999)).rejects.toThrow(NotFoundException);
      await expect(service.getJobById(999)).rejects.toThrow(
        'Job with ID 999 not found'
      );
    });

    it('should check user ownership when userId provided', async () => {
      repository.findById.mockResolvedValue(mockJob);

      const result = await service.getJobById(1, 1);

      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException when user does not own job', async () => {
      repository.findById.mockResolvedValue(mockJob);

      await expect(service.getJobById(1, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getJobByTaskId', () => {
    it('should return job by taskId', async () => {
      repository.findByTaskId.mockResolvedValue(mockJob);

      const result = await service.getJobByTaskId('test-task-id');

      expect(repository.findByTaskId).toHaveBeenCalledWith('test-task-id');
      expect(result.taskId).toBe('test-task-id');
    });

    it('should throw NotFoundException when job not found', async () => {
      repository.findByTaskId.mockResolvedValue(null);

      await expect(service.getJobByTaskId('invalid-id')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should check user ownership when userId provided', async () => {
      repository.findByTaskId.mockResolvedValue(mockJob);

      await expect(
        service.getJobByTaskId('test-task-id', 999)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listJobs', () => {
    it('should list jobs with pagination', async () => {
      const jobs = [mockJob, { ...mockJob, id: 2, taskId: 'test-task-id-2' }];
      repository.findMany.mockResolvedValue([jobs, 2]);

      const result = await service.listJobs({ page: 1, pageSize: 20 });

      expect(repository.findMany).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        jobType: undefined,
        status: undefined,
        userId: undefined,
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should filter jobs by jobType', async () => {
      repository.findMany.mockResolvedValue([[mockJob], 1]);

      await service.listJobs({ jobType: 'example', page: 1, pageSize: 20 });

      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          jobType: 'example',
        })
      );
    });

    it('should filter jobs by status', async () => {
      repository.findMany.mockResolvedValue([[mockJob], 1]);

      await service.listJobs({
        status: JobStatus.COMPLETED,
        page: 1,
        pageSize: 20,
      });

      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          status: JobStatus.COMPLETED,
        })
      );
    });

    it('should filter jobs by userId', async () => {
      repository.findMany.mockResolvedValue([[mockJob], 1]);

      await service.listJobs({ page: 1, pageSize: 20 }, 1);

      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
        })
      );
    });

    it('should use default pagination values', async () => {
      repository.findMany.mockResolvedValue([[], 0]);

      await service.listJobs({});

      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          pageSize: 20,
        })
      );
    });
  });

  describe('getJobLogs', () => {
    const mockLogs = [
      {
        id: 1,
        jobId: 1,
        level: 'INFO' as any,
        message: 'Processing started',
        meta: null,
        rowNumber: null,
        createdAt: new Date(),
      },
      {
        id: 2,
        jobId: 1,
        level: 'INFO' as any,
        message: 'Processing completed',
        meta: null,
        rowNumber: null,
        createdAt: new Date(),
      },
    ];

    it('should return job logs', async () => {
      repository.findById.mockResolvedValue(mockJob);
      repository.findLogs.mockResolvedValue(mockLogs);

      const result = await service.getJobLogs(1);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(repository.findLogs).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when job not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getJobLogs(999)).rejects.toThrow(NotFoundException);
    });

    it('should check user ownership when userId provided', async () => {
      repository.findById.mockResolvedValue(mockJob);
      repository.findLogs.mockResolvedValue(mockLogs);

      const result = await service.getJobLogs(1, 1);

      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when user does not own job', async () => {
      repository.findById.mockResolvedValue(mockJob);

      await expect(service.getJobLogs(1, 999)).rejects.toThrow(
        NotFoundException
      );

      expect(repository.findLogs).not.toHaveBeenCalled();
    });
  });
});
