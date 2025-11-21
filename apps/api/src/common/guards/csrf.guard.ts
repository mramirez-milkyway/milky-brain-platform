import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { SessionService } from '../../auth/services/session.service'
import { timingSafeEqual } from 'crypto'

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name)

  constructor(
    private sessionService: SessionService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const method = request.method.toUpperCase()

    // Skip CSRF validation for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true
    }

    // Check if route has @SkipCsrf() decorator
    const skipCsrf = this.reflector.get<boolean>('skipCsrf', context.getHandler())
    if (skipCsrf) {
      return true
    }

    // Skip CSRF validation for unauthenticated requests
    const user = (request as any).user
    if (!user || !user.userId || !user.jti) {
      // This is handled by JwtAuthGuard, allow through
      return true
    }

    // Extract CSRF token from header
    const tokenFromHeader = request.headers['x-csrf-token'] as string

    if (!tokenFromHeader) {
      this.logger.warn(`CSRF token missing for user ${user.userId}`)
      throw new ForbiddenException('CSRF token is required for this operation')
    }

    // Retrieve stored token from Redis
    const storedToken = await this.sessionService.getCsrfToken(user.userId, user.jti)

    if (!storedToken) {
      this.logger.warn(`CSRF token not found in Redis for user ${user.userId}, jti ${user.jti}`)
      throw new ForbiddenException('Invalid or expired CSRF token')
    }

    // Constant-time comparison to prevent timing attacks
    try {
      const tokenBuffer = Buffer.from(tokenFromHeader, 'utf-8')
      const storedBuffer = Buffer.from(storedToken, 'utf-8')

      if (tokenBuffer.length !== storedBuffer.length) {
        throw new ForbiddenException('Invalid CSRF token')
      }

      if (!timingSafeEqual(tokenBuffer, storedBuffer)) {
        throw new ForbiddenException('Invalid CSRF token')
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error(`CSRF validation error: ${error.message}`)
      throw new ForbiddenException('CSRF token validation failed')
    }

    return true
  }
}
