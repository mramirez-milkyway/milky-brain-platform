import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, JobStatus, LogLevel } from '@prisma/client';
import { JobsRepository } from '../../../src/jobs/jobs.repository';

describe('JobsRepository', () => {
  let repository: JobsRepository;
  let prisma: jest.Mocked<PrismaClient>;

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

  const mockLog = {
    id: 1,
    jobId: 1,
    level: LogLevel.INFO,
    message: 'Test log',
    meta: null,
    rowNumber: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsRepository,
        {
          provide: PrismaClient,
          useValue: {
            job: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
            },
            jobLog: {
              findMany: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<JobsRepository>(JobsRepository);
    prisma = module.get(PrismaClient) as jest.Mocked<PrismaClient>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a job record', async () => {
      (prisma.job.create as jest.Mock).mockResolvedValue(mockJob);

      const result = await repository.create({
        taskId: 'test-task-id',
        jobType: 'example',
        status: JobStatus.PENDING,
        queue: 'default',
        payload: { test: true },
        maxAttempts: 3,
        user: { connect: { id: 1 } },
      });

      expect(prisma.job.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          taskId: 'test-task-id',
          jobType: 'example',
          status: JobStatus.PENDING,
        }),
      });

      expect(result).toEqual(mockJob);
    });
  });

  describe('findById', () => {
    it('should find job by ID', async () => {
      (prisma.job.findUnique as jest.Mock).mockResolvedValue(mockJob);

      const result = await repository.findById(1);

      expect(prisma.job.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(result).toEqual(mockJob);
    });

    it('should return null when job not found', async () => {
      (prisma.job.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByTaskId', () => {
    it('should find job by taskId', async () => {
      (prisma.job.findUnique as jest.Mock).mockResolvedValue(mockJob);

      const result = await repository.findByTaskId('test-task-id');

      expect(prisma.job.findUnique).toHaveBeenCalledWith({
        where: { taskId: 'test-task-id' },
      });

      expect(result).toEqual(mockJob);
    });

    it('should return null when job not found', async () => {
      (prisma.job.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByTaskId('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should find jobs with pagination', async () => {
      const jobs = [mockJob, { ...mockJob, id: 2 }];
      (prisma.job.findMany as jest.Mock).mockResolvedValue(jobs);
      (prisma.job.count as jest.Mock).mockResolvedValue(2);

      const [result, total] = await repository.findMany({
        page: 1,
        pageSize: 20,
      });

      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });

      expect(result).toEqual(jobs);
      expect(total).toBe(2);
    });

    it('should filter by jobType', async () => {
      (prisma.job.findMany as jest.Mock).mockResolvedValue([mockJob]);
      (prisma.job.count as jest.Mock).mockResolvedValue(1);

      await repository.findMany({
        jobType: 'example',
        page: 1,
        pageSize: 20,
      });

      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { jobType: 'example' },
        })
      );
    });

    it('should filter by status', async () => {
      (prisma.job.findMany as jest.Mock).mockResolvedValue([mockJob]);
      (prisma.job.count as jest.Mock).mockResolvedValue(1);

      await repository.findMany({
        status: JobStatus.COMPLETED,
        page: 1,
        pageSize: 20,
      });

      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: JobStatus.COMPLETED },
        })
      );
    });

    it('should filter by userId', async () => {
      (prisma.job.findMany as jest.Mock).mockResolvedValue([mockJob]);
      (prisma.job.count as jest.Mock).mockResolvedValue(1);

      await repository.findMany({
        userId: 1,
        page: 1,
        pageSize: 20,
      });

      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1 },
        })
      );
    });

    it('should apply multiple filters', async () => {
      (prisma.job.findMany as jest.Mock).mockResolvedValue([mockJob]);
      (prisma.job.count as jest.Mock).mockResolvedValue(1);

      await repository.findMany({
        jobType: 'example',
        status: JobStatus.PENDING,
        userId: 1,
        page: 2,
        pageSize: 10,
      });

      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: {
          jobType: 'example',
          status: JobStatus.PENDING,
          userId: 1,
        },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      });
    });

    it('should calculate correct skip for pagination', async () => {
      (prisma.job.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.job.count as jest.Mock).mockResolvedValue(0);

      await repository.findMany({
        page: 3,
        pageSize: 15,
      });

      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 30, // (3 - 1) * 15
          take: 15,
        })
      );
    });
  });

  describe('updateStatus', () => {
    it('should update job status only', async () => {
      const updatedJob = { ...mockJob, status: JobStatus.RUNNING };
      (prisma.job.update as jest.Mock).mockResolvedValue(updatedJob);

      const result = await repository.updateStatus(
        'test-task-id',
        JobStatus.RUNNING
      );

      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { taskId: 'test-task-id' },
        data: { status: JobStatus.RUNNING },
      });

      expect(result.status).toBe(JobStatus.RUNNING);
    });

    it('should update status with additional data', async () => {
      const now = new Date();
      const updatedJob = {
        ...mockJob,
        status: JobStatus.RUNNING,
        attempts: 1,
        startedAt: now,
      };
      (prisma.job.update as jest.Mock).mockResolvedValue(updatedJob);

      const result = await repository.updateStatus(
        'test-task-id',
        JobStatus.RUNNING,
        {
          attempts: 1,
          startedAt: now,
        }
      );

      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { taskId: 'test-task-id' },
        data: {
          status: JobStatus.RUNNING,
          attempts: 1,
          startedAt: now,
        },
      });

      expect(result.attempts).toBe(1);
    });

    it('should update to FAILED with error reason', async () => {
      const updatedJob = {
        ...mockJob,
        status: JobStatus.FAILED,
        errorReason: 'File parsing error',
        completedAt: new Date(),
      };
      (prisma.job.update as jest.Mock).mockResolvedValue(updatedJob);

      await repository.updateStatus('test-task-id', JobStatus.FAILED, {
        errorReason: 'File parsing error',
        completedAt: new Date(),
      });

      expect(prisma.job.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: JobStatus.FAILED,
            errorReason: 'File parsing error',
          }),
        })
      );
    });

    it('should update to COMPLETED with result', async () => {
      const result = { processed: 100, failed: 0 };
      const updatedJob = {
        ...mockJob,
        status: JobStatus.COMPLETED,
        result,
        completedAt: new Date(),
      };
      (prisma.job.update as jest.Mock).mockResolvedValue(updatedJob);

      await repository.updateStatus('test-task-id', JobStatus.COMPLETED, {
        result,
        completedAt: new Date(),
      });

      expect(prisma.job.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: JobStatus.COMPLETED,
            result,
          }),
        })
      );
    });
  });

  describe('findLogs', () => {
    it('should find all logs for a job', async () => {
      const logs = [
        mockLog,
        { ...mockLog, id: 2, message: 'Second log' },
      ];
      (prisma.jobLog.findMany as jest.Mock).mockResolvedValue(logs);

      const result = await repository.findLogs(1);

      expect(prisma.jobLog.findMany).toHaveBeenCalledWith({
        where: { jobId: 1 },
        orderBy: { createdAt: 'asc' },
      });

      expect(result).toEqual(logs);
    });

    it('should return empty array when no logs found', async () => {
      (prisma.jobLog.findMany as jest.Mock).mockResolvedValue([]);

      const result = await repository.findLogs(999);

      expect(result).toEqual([]);
    });
  });

  describe('createLog', () => {
    it('should create a log entry', async () => {
      (prisma.jobLog.create as jest.Mock).mockResolvedValue(mockLog);

      const result = await repository.createLog(
        1,
        LogLevel.INFO,
        'Test log message'
      );

      expect(prisma.jobLog.create).toHaveBeenCalledWith({
        data: {
          jobId: 1,
          level: LogLevel.INFO,
          message: 'Test log message',
          meta: undefined,
          rowNumber: undefined,
        },
      });

      expect(result).toEqual(mockLog);
    });

    it('should create log with meta data', async () => {
      const meta = { filename: 'test.csv', rows: 100 };
      const logWithMeta = { ...mockLog, meta };
      (prisma.jobLog.create as jest.Mock).mockResolvedValue(logWithMeta);

      const result = await repository.createLog(
        1,
        LogLevel.INFO,
        'Processing file',
        meta
      );

      expect(prisma.jobLog.create).toHaveBeenCalledWith({
        data: {
          jobId: 1,
          level: LogLevel.INFO,
          message: 'Processing file',
          meta,
          rowNumber: undefined,
        },
      });

      expect(result.meta).toEqual(meta);
    });

    it('should create log with row number', async () => {
      const logWithRow = { ...mockLog, rowNumber: 42 };
      (prisma.jobLog.create as jest.Mock).mockResolvedValue(logWithRow);

      const result = await repository.createLog(
        1,
        LogLevel.WARNING,
        'Invalid data',
        null,
        42
      );

      expect(prisma.jobLog.create).toHaveBeenCalledWith({
        data: {
          jobId: 1,
          level: LogLevel.WARNING,
          message: 'Invalid data',
          meta: null,
          rowNumber: 42,
        },
      });

      expect(result.rowNumber).toBe(42);
    });

    it('should create error log', async () => {
      const errorLog = { ...mockLog, level: LogLevel.ERROR };
      (prisma.jobLog.create as jest.Mock).mockResolvedValue(errorLog);

      await repository.createLog(
        1,
        LogLevel.ERROR,
        'Processing failed',
        { error: 'Database connection timeout' }
      );

      expect(prisma.jobLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            level: LogLevel.ERROR,
            message: 'Processing failed',
          }),
        })
      );
    });
  });

  describe('update', () => {
    it('should update job with arbitrary fields', async () => {
      const updatedJob = { ...mockJob, meta: { custom: 'value' } };
      (prisma.job.update as jest.Mock).mockResolvedValue(updatedJob);

      const result = await repository.update('test-task-id', {
        meta: { custom: 'value' },
      });

      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { taskId: 'test-task-id' },
        data: { meta: { custom: 'value' } },
      });

      expect(result).toEqual(updatedJob);
    });

    it('should update multiple fields', async () => {
      const updatedJob = {
        ...mockJob,
        status: JobStatus.COMPLETED,
        result: { count: 10 },
        completedAt: new Date(),
      };
      (prisma.job.update as jest.Mock).mockResolvedValue(updatedJob);

      await repository.update('test-task-id', {
        status: JobStatus.COMPLETED,
        result: { count: 10 },
        completedAt: new Date(),
      });

      expect(prisma.job.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { taskId: 'test-task-id' },
          data: expect.objectContaining({
            status: JobStatus.COMPLETED,
            result: { count: 10 },
          }),
        })
      );
    });
  });
});
