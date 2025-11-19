import { Injectable, NestMiddleware, Logger } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { PrismaService } from '../../prisma/prisma.service'

interface RequestWithUser extends Request {
  user?: {
    userId: number
    email: string
  }
}

@Injectable()
export class ActivityTrackingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ActivityTrackingMiddleware.name)
  private readonly THROTTLE_MINUTES = 5

  constructor(private prisma: PrismaService) {}

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    // Only track authenticated requests
    if (!req.user?.userId) {
      return next()
    }

    // Check if this is a meaningful action
    if (this.isMeaningfulAction(req)) {
      // Fire-and-forget async update
      this.updateLastSeenAt(req.user.userId).catch((error) => {
        this.logger.error(`Failed to update lastSeenAt for user ${req.user!.userId}:`, error)
      })
    }

    next()
  }

  private isMeaningfulAction(req: Request): boolean {
    const method = req.method
    const path = req.path

    // Skip health checks and metrics
    if (path.includes('/health') || path.includes('/metrics')) {
      return false
    }

    // Track all mutations (POST, PUT, PATCH, DELETE)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return true
    }

    // Track export endpoints (meaningful GET requests)
    if (method === 'GET' && path.includes('/export')) {
      return true
    }

    return false
  }

  private async updateLastSeenAt(userId: number): Promise<void> {
    try {
      // Get current user to check throttle
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { lastSeenAt: true },
      })

      // Throttle: only update if lastSeenAt is null or older than THROTTLE_MINUTES
      if (user?.lastSeenAt) {
        const minutesSinceLastUpdate =
          (Date.now() - user.lastSeenAt.getTime()) / (1000 * 60)

        if (minutesSinceLastUpdate < this.THROTTLE_MINUTES) {
          // Skip update, too recent
          return
        }
      }

      // Update lastSeenAt
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastSeenAt: new Date() },
      })
    } catch (error) {
      // Re-throw to be caught by the caller
      throw error
    }
  }
}
