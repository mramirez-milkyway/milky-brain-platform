import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private client: Redis | null = null
  private isConnected = false

  constructor(private configService: ConfigService) {
    this.initializeClient()
  }

  private initializeClient() {
    const redisUrl = this.configService.get<string>('REDIS_URL')

    if (!redisUrl) {
      this.logger.warn('REDIS_URL not configured. Session management features will be disabled.')
      return
    }

    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) {
            this.logger.error('Redis connection failed after 3 retries')
            return null
          }
          const delay = Math.min(times * 100, 2000)
          return delay
        },
        reconnectOnError: (err: Error) => {
          const targetError = 'READONLY'
          if (err.message.includes(targetError)) {
            return true
          }
          return false
        },
      })

      this.client.on('connect', () => {
        this.isConnected = true
        this.logger.log('Redis connected successfully')
      })

      this.client.on('error', (err: Error) => {
        this.isConnected = false
        this.logger.error('Redis connection error:', err.message)
      })

      this.client.on('close', () => {
        this.isConnected = false
        this.logger.warn('Redis connection closed')
      })
    } catch (error) {
      this.logger.error('Failed to initialize Redis client:', error)
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit()
      this.logger.log('Redis connection closed')
    }
  }

  getClient(): Redis | null {
    return this.client
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null
  }

  async set(key: string, value: string, expirySeconds?: number): Promise<boolean> {
    if (!this.isReady()) {
      this.logger.warn(`Redis not available. Skipping SET for key: ${key}`)
      return false
    }

    try {
      if (expirySeconds) {
        await this.client!.setex(key, expirySeconds, value)
      } else {
        await this.client!.set(key, value)
      }
      return true
    } catch (error) {
      this.logger.error(`Redis SET failed for key ${key}:`, error)
      return false
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isReady()) {
      this.logger.warn(`Redis not available. Skipping GET for key: ${key}`)
      return null
    }

    try {
      return await this.client!.get(key)
    } catch (error) {
      this.logger.error(`Redis GET failed for key ${key}:`, error)
      return null
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isReady()) {
      this.logger.warn(`Redis not available. Skipping DEL for key: ${key}`)
      return false
    }

    try {
      await this.client!.del(key)
      return true
    } catch (error) {
      this.logger.error(`Redis DEL failed for key ${key}:`, error)
      return false
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.isReady()) {
      this.logger.warn(`Redis not available. Skipping KEYS for pattern: ${pattern}`)
      return []
    }

    try {
      return await this.client!.keys(pattern)
    } catch (error) {
      this.logger.error(`Redis KEYS failed for pattern ${pattern}:`, error)
      return []
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isReady()) {
      this.logger.warn(`Redis not available. Skipping EXISTS for key: ${key}`)
      return false
    }

    try {
      const result = await this.client!.exists(key)
      return result === 1
    } catch (error) {
      this.logger.error(`Redis EXISTS failed for key ${key}:`, error)
      return false
    }
  }
}
