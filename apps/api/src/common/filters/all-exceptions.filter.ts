import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

interface RequestWithUser extends Request {
  user?: { userId?: number; email?: string }
}

/**
 * Global exception filter that captures unhandled 5xx errors and logs them to SystemLog.
 * 4xx errors are passed through without logging (they are expected behavior).
 */
@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly prisma: PrismaService) {}

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<RequestWithUser>()

    // Determine HTTP status code
    let status: number
    let message: string

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as { message?: string }).message || exception.message
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR
      message = exception.message
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR
      message = 'Unknown error occurred'
    }

    // Only log 5xx errors to SystemLog (server errors, not client errors)
    if (status >= 500) {
      await this.logToSystemLog(exception, request)
    }

    // Return appropriate error response
    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }

  private async logToSystemLog(exception: unknown, request: RequestWithUser): Promise<void> {
    try {
      const errorMessage = exception instanceof Error ? exception.message : String(exception)
      const stackTrace = exception instanceof Error ? exception.stack || '' : ''

      const metadata = {
        method: request.method,
        url: request.url,
        path: request.path,
        userId: request.user?.userId ?? null,
        userEmail: request.user?.email ?? null,
        query: request.query as Record<string, string | string[]>,
        body: this.sanitizeBody(request.body) as Record<string, unknown> | null,
        headers: {
          'user-agent': request.headers['user-agent'] ?? null,
          'content-type': request.headers['content-type'] ?? null,
        },
        ip: request.ip ?? null,
      }

      await this.prisma.systemLog.create({
        data: {
          context: 'API',
          errorMessage,
          stackTrace,
          metadata: metadata as Prisma.InputJsonValue,
        },
      })
    } catch (logError) {
      // If logging fails, we still want the original error to be returned
      // Log to console as fallback
      console.error('Failed to log system error to database:', logError)
      console.error('Original error:', exception)
    }
  }

  /**
   * Sanitize request body to remove sensitive data before logging
   */
  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body
    }

    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization']
    const sanitized = { ...body } as Record<string, unknown>

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    }

    return sanitized
  }
}
