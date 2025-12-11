import { SystemLogService } from '../../../src/services/system-log.service'

const mockCreate = jest.fn()

// Mock the database client
jest.mock('../../../src/database/client', () => ({
  getDatabase: jest.fn(() => ({
    systemLog: {
      create: mockCreate,
    },
  })),
}))

describe('SystemLogService', () => {
  let service: SystemLogService

  beforeEach(() => {
    mockCreate.mockReset()
    mockCreate.mockResolvedValue({ id: 1 })
    service = new SystemLogService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('logException', () => {
    it('should log Error with stack trace', async () => {
      const error = new Error('Test error message')

      await service.logException('Lambda:job-processor', error, { taskId: 'test-123' })

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          context: 'Lambda:job-processor',
          errorMessage: 'Test error message',
          stackTrace: expect.stringContaining('Error: Test error message'),
          metadata: { taskId: 'test-123' },
        },
      })
    })

    it('should log string errors', async () => {
      await service.logException('Lambda:job-processor', 'String error', { taskId: 'test-123' })

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          context: 'Lambda:job-processor',
          errorMessage: 'String error',
          stackTrace: '',
          metadata: { taskId: 'test-123' },
        },
      })
    })

    it('should handle undefined metadata', async () => {
      const error = new Error('Test error')

      await service.logException('API', error)

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          context: 'API',
          errorMessage: 'Test error',
          stackTrace: expect.any(String),
        }),
      })
    })

    it('should handle database errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockCreate.mockRejectedValue(new Error('Database connection failed'))

      const error = new Error('Original error')

      // Should not throw
      await expect(
        service.logException('Lambda:job-processor', error, { taskId: 'test' })
      ).resolves.not.toThrow()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to log system error to database:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })

    it('should handle non-Error objects', async () => {
      const errorObject = { code: 500, reason: 'Unknown' }

      await service.logException('Lambda:job-processor', errorObject, {})

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          context: 'Lambda:job-processor',
          errorMessage: '[object Object]',
          stackTrace: '',
        }),
      })
    })

    it('should preserve Error stack trace', async () => {
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n    at TestFunction (/test/file.ts:10:5)'

      await service.logException('API', error, {})

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          stackTrace: 'Error: Test error\n    at TestFunction (/test/file.ts:10:5)',
        }),
      })
    })

    it('should handle Error without stack', async () => {
      const error = new Error('Test error')
      error.stack = undefined

      await service.logException('API', error, {})

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          stackTrace: '',
        }),
      })
    })
  })
})
