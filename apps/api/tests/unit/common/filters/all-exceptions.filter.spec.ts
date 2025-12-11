import { Test, TestingModule } from '@nestjs/testing'
import { HttpException, HttpStatus } from '@nestjs/common'
import { AllExceptionsFilter } from '../../../../src/common/filters/all-exceptions.filter'
import { PrismaService } from '../../../../src/prisma/prisma.service'

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter
  let prismaService: jest.Mocked<PrismaService>

  const mockRequest = {
    method: 'POST',
    url: '/api/test',
    path: '/api/test',
    query: { page: '1' },
    body: { username: 'testuser' },
    headers: {
      'user-agent': 'jest-test',
      'content-type': 'application/json',
    },
    ip: '127.0.0.1',
    user: { userId: 1, email: 'test@example.com' },
  }

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  }

  const mockArgumentsHost = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue(mockResponse),
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllExceptionsFilter,
        {
          provide: PrismaService,
          useValue: {
            systemLog: {
              create: jest.fn().mockResolvedValue({ id: 1 }),
            },
          },
        },
      ],
    }).compile()

    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter)
    prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('5xx errors (should log to SystemLog)', () => {
    it('should log InternalServerError (500) to SystemLog', async () => {
      const error = new HttpException('Internal error', HttpStatus.INTERNAL_SERVER_ERROR)

      await filter.catch(error, mockArgumentsHost as never)

      expect(prismaService.systemLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          context: 'API',
          errorMessage: 'Internal error',
          stackTrace: expect.any(String),
          metadata: expect.objectContaining({
            method: 'POST',
            url: '/api/test',
            userId: 1,
          }),
        }),
      })

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Internal error',
        })
      )
    })

    it('should log generic Error as 500 to SystemLog', async () => {
      const error = new Error('Something went wrong')

      await filter.catch(error, mockArgumentsHost as never)

      expect(prismaService.systemLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          context: 'API',
          errorMessage: 'Something went wrong',
          stackTrace: expect.stringContaining('Error: Something went wrong'),
        }),
      })

      expect(mockResponse.status).toHaveBeenCalledWith(500)
    })

    it('should log ServiceUnavailable (503) to SystemLog', async () => {
      const error = new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE)

      await filter.catch(error, mockArgumentsHost as never)

      expect(prismaService.systemLog.create).toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(503)
    })

    it('should log BadGateway (502) to SystemLog', async () => {
      const error = new HttpException('Bad gateway', HttpStatus.BAD_GATEWAY)

      await filter.catch(error, mockArgumentsHost as never)

      expect(prismaService.systemLog.create).toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(502)
    })
  })

  describe('4xx errors (should NOT log to SystemLog)', () => {
    it('should NOT log BadRequest (400) to SystemLog', async () => {
      const error = new HttpException('Bad request', HttpStatus.BAD_REQUEST)

      await filter.catch(error, mockArgumentsHost as never)

      expect(prismaService.systemLog.create).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Bad request',
        })
      )
    })

    it('should NOT log Unauthorized (401) to SystemLog', async () => {
      const error = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)

      await filter.catch(error, mockArgumentsHost as never)

      expect(prismaService.systemLog.create).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(401)
    })

    it('should NOT log Forbidden (403) to SystemLog', async () => {
      const error = new HttpException('Forbidden', HttpStatus.FORBIDDEN)

      await filter.catch(error, mockArgumentsHost as never)

      expect(prismaService.systemLog.create).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(403)
    })

    it('should NOT log NotFound (404) to SystemLog', async () => {
      const error = new HttpException('Not found', HttpStatus.NOT_FOUND)

      await filter.catch(error, mockArgumentsHost as never)

      expect(prismaService.systemLog.create).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(404)
    })

    it('should NOT log Conflict (409) to SystemLog', async () => {
      const error = new HttpException('Conflict', HttpStatus.CONFLICT)

      await filter.catch(error, mockArgumentsHost as never)

      expect(prismaService.systemLog.create).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(409)
    })

    it('should NOT log UnprocessableEntity (422) to SystemLog', async () => {
      const error = new HttpException('Unprocessable', HttpStatus.UNPROCESSABLE_ENTITY)

      await filter.catch(error, mockArgumentsHost as never)

      expect(prismaService.systemLog.create).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(422)
    })
  })

  describe('metadata capture', () => {
    it('should capture user info when available', async () => {
      const error = new Error('Server error')

      await filter.catch(error, mockArgumentsHost as never)

      expect(prismaService.systemLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            userId: 1,
            userEmail: 'test@example.com',
          }),
        }),
      })
    })

    it('should handle missing user info gracefully', async () => {
      const requestWithoutUser = { ...mockRequest, user: undefined }
      const hostWithoutUser = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(requestWithoutUser),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      }

      const error = new Error('Server error')

      await filter.catch(error, hostWithoutUser as never)

      expect(prismaService.systemLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            userId: null,
            userEmail: null,
          }),
        }),
      })
    })

    it('should capture request details', async () => {
      const error = new Error('Server error')

      await filter.catch(error, mockArgumentsHost as never)

      expect(prismaService.systemLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            method: 'POST',
            url: '/api/test',
            path: '/api/test',
            query: { page: '1' },
            ip: '127.0.0.1',
          }),
        }),
      })
    })

    it('should sanitize sensitive fields in body', async () => {
      const requestWithSensitiveData = {
        ...mockRequest,
        body: {
          username: 'testuser',
          password: 'secret123',
          token: 'jwt-token',
        },
      }
      const hostWithSensitive = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(requestWithSensitiveData),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      }

      const error = new Error('Server error')

      await filter.catch(error, hostWithSensitive as never)

      expect(prismaService.systemLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            body: {
              username: 'testuser',
              password: '[REDACTED]',
              token: '[REDACTED]',
            },
          }),
        }),
      })
    })
  })

  describe('error handling resilience', () => {
    it('should still return error response if logging fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(prismaService.systemLog.create as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const error = new Error('Original error')

      await filter.catch(error, mockArgumentsHost as never)

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Original error',
        })
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to log system error to database:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })

    it('should handle non-Error exceptions', async () => {
      const stringError = 'String error message'

      await filter.catch(stringError, mockArgumentsHost as never)

      expect(prismaService.systemLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          errorMessage: 'String error message',
          stackTrace: '',
        }),
      })

      expect(mockResponse.status).toHaveBeenCalledWith(500)
    })
  })

  describe('response format', () => {
    it('should include timestamp in response', async () => {
      const error = new HttpException('Not found', HttpStatus.NOT_FOUND)

      await filter.catch(error, mockArgumentsHost as never)

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String),
        })
      )
    })

    it('should include path in response', async () => {
      const error = new HttpException('Error', HttpStatus.BAD_REQUEST)

      await filter.catch(error, mockArgumentsHost as never)

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/test',
        })
      )
    })

    it('should extract message from HttpException response object', async () => {
      const error = new HttpException(
        { message: 'Validation failed', errors: ['field required'] },
        HttpStatus.BAD_REQUEST
      )

      await filter.catch(error, mockArgumentsHost as never)

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
        })
      )
    })
  })
})
