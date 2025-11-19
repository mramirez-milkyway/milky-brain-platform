import { Injectable, Logger } from '@nestjs/common'
import { RedisService } from '../../common/services/redis.service'

interface SessionMetadata {
  ipAddress?: string
  userAgent?: string
  issuedAt: number
}

interface BlacklistEntry {
  userId: number
  reason: string
  revokedAt: string
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name)

  constructor(private redisService: RedisService) {}

  /**
   * Blacklist a JWT token by its jti (JWT ID)
   */
  async blacklistToken(jti: string, userId: number, reason: string, ttlSeconds: number): Promise<boolean> {
    const key = `blacklist:jwt:${jti}`
    const value: BlacklistEntry = {
      userId,
      reason,
      revokedAt: new Date().toISOString(),
    }

    const success = await this.redisService.set(key, JSON.stringify(value), ttlSeconds)

    if (success) {
      this.logger.log(`Token blacklisted: jti=${jti}, userId=${userId}, reason=${reason}`)
    }

    return success
  }

  /**
   * Check if a token is blacklisted
   */
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const key = `blacklist:jwt:${jti}`
    return await this.redisService.exists(key)
  }

  /**
   * Record a new session in Redis
   */
  async recordSession(userId: number, jti: string, metadata: SessionMetadata): Promise<boolean> {
    const key = `session:${userId}:${jti}`
    const value = JSON.stringify(metadata)

    // Session expires with the JWT token (typically 24 hours or JWT exp - now)
    const ttlSeconds = 24 * 60 * 60 // 24 hours default

    return await this.redisService.set(key, value, ttlSeconds)
  }

  /**
   * Revoke all sessions for a specific user
   */
  async revokeAllUserSessions(userId: number, reason: string): Promise<number> {
    const pattern = `session:${userId}:*`
    const sessionKeys = await this.redisService.keys(pattern)

    if (sessionKeys.length === 0) {
      this.logger.log(`No active sessions found for user ${userId}`)
      return 0
    }

    let revokedCount = 0

    for (const sessionKey of sessionKeys) {
      // Extract jti from session key: session:{userId}:{jti}
      const parts = sessionKey.split(':')
      const jti = parts[2]

      if (!jti) {
        this.logger.warn(`Invalid session key format: ${sessionKey}`)
        continue
      }

      // Get session metadata to determine TTL
      const sessionData = await this.redisService.get(sessionKey)
      let ttl = 24 * 60 * 60 // Default 24 hours

      if (sessionData) {
        try {
          const metadata: SessionMetadata = JSON.parse(sessionData)
          const now = Math.floor(Date.now() / 1000)
          // Assume tokens expire in 24 hours if not specified
          const tokenExpiry = metadata.issuedAt + (24 * 60 * 60)
          ttl = Math.max(tokenExpiry - now, 60) // At least 60 seconds
        } catch (error) {
          this.logger.warn(`Failed to parse session metadata for ${sessionKey}`)
        }
      }

      // Blacklist the token
      const blacklisted = await this.blacklistToken(jti, userId, reason, ttl)

      if (blacklisted) {
        // Remove session record
        await this.redisService.del(sessionKey)
        revokedCount++
      }
    }

    this.logger.log(`Revoked ${revokedCount} sessions for user ${userId}`)
    return revokedCount
  }

  /**
   * Clean up session record (called on explicit logout)
   */
  async removeSession(userId: number, jti: string): Promise<boolean> {
    const key = `session:${userId}:${jti}`
    return await this.redisService.del(key)
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: number): Promise<SessionMetadata[]> {
    const pattern = `session:${userId}:*`
    const sessionKeys = await this.redisService.keys(pattern)

    const sessions: SessionMetadata[] = []

    for (const key of sessionKeys) {
      const data = await this.redisService.get(key)
      if (data) {
        try {
          const metadata: SessionMetadata = JSON.parse(data)
          sessions.push(metadata)
        } catch (error) {
          this.logger.warn(`Failed to parse session data for ${key}`)
        }
      }
    }

    return sessions
  }
}
