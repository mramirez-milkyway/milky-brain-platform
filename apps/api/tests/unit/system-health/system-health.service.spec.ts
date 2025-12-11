import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { SystemHealthService } from '../../../src/system-health/system-health.service'
import { SystemHealthRepository } from '../../../src/system-health/system-health.repository'

describe('SystemHealthService', () => {
  let service: SystemHealthService
  let repository: jest.Mocked<SystemHealthRepository>

  const mockSystemLog = {
    id: 1,
    context: 'API',
    errorMessage: 'Test error message',
    stackTrace: 'Error: Test error\n    at TestFunction (/test/file.ts:10:5)',
    metadata: { method: 'POST', url: '/api/test' },
    createdAt: new Date('2024-01-15T10:00:00Z'),
  }

  const mockLongErrorMessage = 'A'.repeat(250)

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemHealthService,
        {
          provide: SystemHealthRepository,
          useValue: {
            findById: jest.fn(),
            findMany: jest.fn(),
            getDistinctContexts: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<SystemHealthService>(SystemHealthService)
    repository = module.get(SystemHealthRepository) as jest.Mocked<SystemHealthRepository>
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('listLogs', () => {
    it('should return paginated logs with default pagination', async () => {
      const mockLogs = [mockSystemLog]
      repository.findMany.mockResolvedValue([mockLogs, 1])

      const result = await service.listLogs({})

      expect(repository.findMany).toHaveBeenCalledWith({
        context: undefined,
        startDate: undefined,
        endDate: undefined,
        page: 1,
        pageSize: 20,
      })

      expect(result).toEqual({
        data: [
          {
            id: 1,
            context: 'API',
            errorMessage: 'Test error message',
            createdAt: mockSystemLog.createdAt,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      })
    })

    it('should apply custom pagination', async () => {
      repository.findMany.mockResolvedValue([[], 0])

      await service.listLogs({ page: 2, pageSize: 10 })

      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          pageSize: 10,
        })
      )
    })

    it('should filter by context', async () => {
      repository.findMany.mockResolvedValue([[], 0])

      await service.listLogs({ context: 'Lambda:job-processor' })

      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          context: 'Lambda:job-processor',
        })
      )
    })

    it('should filter by date range', async () => {
      repository.findMany.mockResolvedValue([[], 0])

      await service.listLogs({
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      })

      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z'),
        })
      )
    })

    it('should truncate long error messages', async () => {
      const logWithLongMessage = {
        ...mockSystemLog,
        errorMessage: mockLongErrorMessage,
      }
      repository.findMany.mockResolvedValue([[logWithLongMessage], 1])

      const result = await service.listLogs({})

      expect(result.data[0].errorMessage.length).toBeLessThanOrEqual(203) // 200 + '...'
      expect(result.data[0].errorMessage.endsWith('...')).toBe(true)
    })

    it('should not truncate short error messages', async () => {
      repository.findMany.mockResolvedValue([[mockSystemLog], 1])

      const result = await service.listLogs({})

      expect(result.data[0].errorMessage).toBe('Test error message')
    })

    it('should calculate total pages correctly', async () => {
      repository.findMany.mockResolvedValue([[], 55])

      const result = await service.listLogs({ pageSize: 20 })

      expect(result.totalPages).toBe(3) // 55 / 20 = 2.75, ceil = 3
    })
  })

  describe('getLogById', () => {
    it('should return full log details by ID', async () => {
      repository.findById.mockResolvedValue(mockSystemLog)

      const result = await service.getLogById(1)

      expect(repository.findById).toHaveBeenCalledWith(1)
      expect(result).toEqual({
        id: 1,
        context: 'API',
        errorMessage: 'Test error message',
        stackTrace: 'Error: Test error\n    at TestFunction (/test/file.ts:10:5)',
        metadata: { method: 'POST', url: '/api/test' },
        createdAt: mockSystemLog.createdAt,
      })
    })

    it('should throw NotFoundException for non-existent log', async () => {
      repository.findById.mockResolvedValue(null)

      await expect(service.getLogById(999)).rejects.toThrow(NotFoundException)
      await expect(service.getLogById(999)).rejects.toThrow('System log with ID 999 not found')
    })

    it('should not truncate error message in detail view', async () => {
      const logWithLongMessage = {
        ...mockSystemLog,
        errorMessage: mockLongErrorMessage,
      }
      repository.findById.mockResolvedValue(logWithLongMessage)

      const result = await service.getLogById(1)

      expect(result.errorMessage).toBe(mockLongErrorMessage)
      expect(result.errorMessage.length).toBe(250)
    })
  })

  describe('getContexts', () => {
    it('should return distinct contexts', async () => {
      const contexts = ['API', 'Lambda:job-processor', 'Lambda:notification-sender']
      repository.getDistinctContexts.mockResolvedValue(contexts)

      const result = await service.getContexts()

      expect(repository.getDistinctContexts).toHaveBeenCalled()
      expect(result).toEqual(contexts)
    })

    it('should return empty array when no logs exist', async () => {
      repository.getDistinctContexts.mockResolvedValue([])

      const result = await service.getContexts()

      expect(result).toEqual([])
    })
  })
})
