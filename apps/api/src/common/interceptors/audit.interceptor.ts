import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common'
import { Observable, throwError } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'
import { AuditService } from '../services/audit.service'

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name)

  // Routes to exclude from audit logging
  private readonly excludedRoutes = ['/health', '/metrics', '/api/health', '/api/metrics']

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const response = context.switchToHttp().getResponse()

    // Skip logging if route is excluded
    const path = request.path || request.url
    if (this.isExcludedRoute(path)) {
      this.logger.debug(`Skipping excluded route: ${path}`)
      return next.handle()
    }

    // Skip logging if no user context (unauthenticated requests)
    const user = request.user
    const userId = user?.id || user?.userId
    if (!user || !userId) {
      this.logger.debug(`Skipping unauthenticated request: ${path}`)
      return next.handle()
    }

    this.logger.log(`Intercepting request: ${request.method} ${path} by user ${userId}`)
    const startTime = Date.now()

    return next.handle().pipe(
      tap((responseData) => {
        // Log successful requests asynchronously
        this.logRequest(request, response, user, null, responseData).catch((error) => {
          this.logger.error('Failed to log audit event', error)
        })
      }),
      catchError((error) => {
        // Log failed requests asynchronously
        this.logRequest(request, response, user, error, null).catch((logError) => {
          this.logger.error('Failed to log audit event for error', logError)
        })
        return throwError(() => error)
      })
    )
  }

  private async logRequest(
    request: any,
    response: any,
    user: any,
    error: any | null,
    responseData: any
  ): Promise<void> {
    const userId = user?.id || user?.userId
    const method = request.method
    const path = request.path || request.url
    const action = `${method} ${path}`

    // Extract entity type from path (e.g., /api/users -> user, /users/123 -> user)
    const entityType = this.extractEntityType(path)

    // Extract entity ID from path if present (e.g., /users/123 -> 123)
    const entityId = this.extractEntityId(path)

    // Get IP address (prefer X-Forwarded-For for proxy setups)
    const ipAddress =
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.ip ||
      request.connection?.remoteAddress

    // Get user agent
    const userAgent = request.headers['user-agent'] || null

    // Capture before state (request body) and after state (response)
    let beforeState = null
    let afterState = null

    if (['POST', 'PUT', 'PATCH'].includes(method) && request.body) {
      beforeState = this.sanitizeBody(request.body)
    }

    // For successful operations, capture the response data
    if (!error && responseData && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      afterState = this.sanitizeBody(responseData)
    }

    // If error occurred, capture error details
    if (error) {
      afterState = {
        error: {
          status: error.status || 500,
          message: error.message,
        },
      }
    }

    // Log asynchronously (fire and forget)
    try {
      const auditEvent = await this.auditService.log({
        actorId: userId,
        action,
        entityType,
        entityId: entityId?.toString(),
        beforeState,
        afterState,
        ipAddress,
        userAgent,
      })
      this.logger.log(
        `✅ Audit event created: ${action} by user ${userId} (event ID: ${auditEvent.id})`
      )
    } catch (logError) {
      this.logger.error(`Failed to create audit event: ${logError.message}`, logError.stack)
    }
  }

  private isExcludedRoute(path: string): boolean {
    return this.excludedRoutes.some((route) => path.includes(route))
  }

  private extractEntityType(path: string): string {
    // Remove /api prefix if present
    const cleanPath = path.replace(/^\/api/, '')

    // Split path and get first segment after removing leading slash
    const segments = cleanPath.split('/').filter(Boolean)

    if (segments.length === 0) {
      return 'system'
    }

    // First segment is usually the entity type (e.g., /users -> users)
    const entityType = segments[0]

    // Singularize common plural forms
    return entityType.replace(/s$/, '')
  }

  private extractEntityId(path: string): string | null {
    // Remove /api prefix if present
    const cleanPath = path.replace(/^\/api/, '')

    // Split path and get segments
    const segments = cleanPath.split('/').filter(Boolean)

    // If we have at least 2 segments and the second looks like an ID, return it
    if (segments.length >= 2) {
      const potentialId = segments[1]
      // Check if it's a number or UUID-like string
      if (/^\d+$/.test(potentialId) || /^[0-9a-f-]{36}$/i.test(potentialId)) {
        return potentialId
      }
    }

    return null
  }

  private sanitizeBody(body: any): any {
    if (!body) return null

    // Truncate large bodies to prevent database bloat (max 10KB)
    const bodyString = JSON.stringify(body)
    const maxSize = 10240 // 10KB

    if (bodyString.length > maxSize) {
      return {
        _truncated: true,
        _originalSize: bodyString.length,
        _partial: JSON.parse(bodyString.substring(0, maxSize)),
      }
    }

    // Remove sensitive fields
    const sanitized = { ...body }
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'accessToken']

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    }

    return sanitized
  }
}
