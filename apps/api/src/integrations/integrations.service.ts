import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  IntegrationUsageDto,
  IntegrationsUsageResponseDto,
} from './dto/integration-usage-response.dto'
import { ImaiProfileResponseDto, ImaiProfileData, SupportedPlatform } from './dto/imai-profile.dto'
import { RedisService } from '../common/services/redis.service'

// Platform to IMAI endpoint mapping
const PLATFORM_ENDPOINTS: Record<SupportedPlatform, string> = {
  instagram: '/raw/ig/user/info/',
  tiktok: '/raw/tt/user/info/',
  youtube: '/raw/yt/channel/info/',
}

// IMAI API response types for /raw/ig/user/info/
interface ImaiIgUserInfoResponse {
  status?: string // "ok"
  user?: {
    pk?: number
    username?: string
    full_name?: string
    biography?: string
    profile_pic_url?: string
    profile_pic_url_hd?: string
    follower_count?: number
    following_count?: number
    media_count?: number
    is_verified?: boolean
    is_private?: boolean
    is_business?: boolean
    category?: string
    external_url?: string
  }
  success?: boolean
  error?: string
}

// IMAI API response types for /raw/tt/user/info/
interface ImaiTtUserInfoResponse {
  success?: boolean
  user_info?: {
    userInfo?: {
      user?: {
        id?: string
        uniqueId?: string
        nickname?: string
        signature?: string
        avatarThumb?: string
        avatarMedium?: string
        avatarLarger?: string
        verified?: boolean
        secUid?: string
      }
      stats?: {
        followerCount?: number
        followingCount?: number
        heartCount?: number
        videoCount?: number
      }
    }
  }
  error?: string
}

// IMAI API response types for /raw/yt/channel/info/
interface ImaiYtChannelInfoResponse {
  success?: boolean
  channel_info?: {
    channel_id?: string
    custom_url?: string
    username?: string
    fullname?: string
    picture?: string
    description?: string
    country?: string
    followers?: number
    total_views?: number
    is_verified?: boolean
    joined_at?: string
    links?: string[]
  }
  error?: string
}

type ImaiUserInfoResponse =
  | ImaiIgUserInfoResponse
  | ImaiTtUserInfoResponse
  | ImaiYtChannelInfoResponse

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name)
  private readonly CACHE_TTL_SECONDS = 300 // 5 minutes

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService
  ) {}

  async getAllIntegrationsUsage(): Promise<IntegrationsUsageResponseDto> {
    const integrations: IntegrationUsageDto[] = []

    // Fetch IMAI usage
    const imaiUsage = await this.getImaiUsage()
    integrations.push(imaiUsage)

    return { integrations }
  }

  private async getImaiUsage(): Promise<IntegrationUsageDto> {
    const apiKey = this.configService.get<string>('IMAI_API_KEY')
    const apiBaseUrl = this.configService.get<string>('IMAI_API_BASE_URL')

    // Check if IMAI is configured
    if (!apiKey || !apiBaseUrl) {
      this.logger.warn('IMAI integration not configured')
      return {
        provider: 'IMAI',
        totalQuota: 0,
        remainingQuota: 0,
        usedQuota: 0,
        usagePercentage: 0,
        status: 'inactive',
        errorMessage:
          'IMAI not configured. Please add IMAI_API_KEY and IMAI_API_BASE_URL to environment variables.',
      }
    }

    try {
      // Call IMAI API
      const response = await fetch(`${apiBaseUrl}/account/info/`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          authkey: apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`IMAI API error: ${response.status} ${response.statusText}`)
      }

      const data = (await response.json()) as { success: boolean; credits: number }

      if (!data.success) {
        throw new Error('IMAI API returned success: false')
      }

      // IMAI returns remaining credits
      const remainingQuota = data.credits

      // For now, we'll use the remaining credits as both total and remaining
      // since IMAI doesn't provide total quota in the response
      // In a real scenario, you might need to fetch this from another endpoint
      // or store it in your database
      const totalQuota = remainingQuota // This should be configured elsewhere
      const usedQuota = 0 // Cannot calculate without knowing the original total
      const usagePercentage = 0 // Cannot calculate without knowing the original total

      return {
        provider: 'IMAI',
        totalQuota,
        remainingQuota,
        usedQuota,
        usagePercentage,
        status: 'active',
        reloadInfo: 'Tokens reload every month on the 27th at 3am UTC',
      }
    } catch (error) {
      this.logger.error(`Failed to fetch IMAI usage: ${error.message}`, error.stack)

      return {
        provider: 'IMAI',
        totalQuota: 0,
        remainingQuota: 0,
        usedQuota: 0,
        usagePercentage: 0,
        status: 'error',
        errorMessage: 'Unable to fetch quota information. Please try again later.',
      }
    }
  }

  /**
   * Look up an influencer profile from IMAI API
   * Results are cached in Redis for 5 minutes to save API credits
   */
  async lookupImaiProfile(
    handle: string,
    platform: SupportedPlatform
  ): Promise<ImaiProfileResponseDto> {
    const normalizedHandle = this.normalizeHandle(handle)
    const cacheKey = `imai:profile:${platform}:${normalizedHandle.toLowerCase()}`

    // Check cache first
    const cachedData = await this.redisService.get(cacheKey)
    if (cachedData) {
      this.logger.log(`Cache hit for IMAI profile: ${platform}/${normalizedHandle}`)
      try {
        const profile = JSON.parse(cachedData) as ImaiProfileData | null
        return {
          found: profile !== null,
          profile,
          cached: true,
        }
      } catch {
        // Invalid cache data, continue to fetch
        this.logger.warn(`Invalid cache data for ${cacheKey}, fetching fresh`)
      }
    }

    // Fetch from IMAI API
    const apiKey = this.configService.get<string>('IMAI_API_KEY')
    const apiBaseUrl = this.configService.get<string>('IMAI_API_BASE_URL')

    if (!apiKey || !apiBaseUrl) {
      this.logger.error('IMAI integration not configured')
      throw new ServiceUnavailableException(
        'IMAI service is not configured. Please contact your administrator.'
      )
    }

    try {
      // Get the correct endpoint for the platform
      const endpoint = PLATFORM_ENDPOINTS[platform]
      // IMAI API expects a 'url' parameter with the profile URL or username
      const searchUrl = `${apiBaseUrl}${endpoint}?url=${encodeURIComponent(normalizedHandle)}`
      this.logger.log(`Fetching IMAI profile: ${searchUrl}`)

      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          authkey: apiKey,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        this.logger.error(
          `IMAI API error: ${response.status} ${response.statusText} - ${errorText}`
        )
        throw new Error(`IMAI API error: ${response.status} ${response.statusText}`)
      }

      const data = (await response.json()) as ImaiUserInfoResponse

      // Parse response based on platform
      const profile = this.parseImaiResponse(data, platform, normalizedHandle)

      if (!profile) {
        // Cache the "not found" result to avoid repeated API calls
        await this.redisService.set(cacheKey, JSON.stringify(null), this.CACHE_TTL_SECONDS)

        return {
          found: false,
          profile: null,
          cached: false,
        }
      }

      // Cache the result
      await this.redisService.set(cacheKey, JSON.stringify(profile), this.CACHE_TTL_SECONDS)

      return {
        found: true,
        profile,
        cached: false,
      }
    } catch (error) {
      this.logger.error(`Failed to fetch IMAI profile: ${error.message}`, error.stack)

      throw new ServiceUnavailableException(
        'IMAI service is temporarily unavailable. Please try again later.'
      )
    }
  }

  /**
   * Parse IMAI API response based on platform
   */
  private parseImaiResponse(
    data: ImaiUserInfoResponse,
    platform: SupportedPlatform,
    fallbackHandle: string
  ): ImaiProfileData | null {
    switch (platform) {
      case 'instagram': {
        const igData = data as ImaiIgUserInfoResponse
        // Instagram returns status: "ok" on success
        if (igData.status !== 'ok' || !igData.user) {
          this.logger.warn(`IMAI Instagram returned error or no user data`)
          return null
        }
        return {
          handle: igData.user.username || fallbackHandle,
          platform,
          fullName: igData.user.full_name || igData.user.username || fallbackHandle,
          bio: igData.user.biography || null,
          profilePicUrl: igData.user.profile_pic_url_hd || igData.user.profile_pic_url || null,
          followers: igData.user.follower_count || 0,
          engagementRate: null, // Would need additional API call to calculate
        }
      }

      case 'tiktok': {
        const ttData = data as ImaiTtUserInfoResponse
        // TikTok has nested structure: user_info.userInfo.user and user_info.userInfo.stats
        if (!ttData.success || !ttData.user_info?.userInfo?.user) {
          this.logger.warn(`IMAI TikTok returned error or no user data`)
          return null
        }
        const user = ttData.user_info.userInfo.user
        const stats = ttData.user_info.userInfo.stats
        return {
          handle: user.uniqueId || fallbackHandle,
          platform,
          fullName: user.nickname || user.uniqueId || fallbackHandle,
          bio: user.signature || null,
          profilePicUrl: user.avatarLarger || user.avatarMedium || user.avatarThumb || null,
          followers: stats?.followerCount || 0,
          engagementRate: null, // Would need additional API call to calculate
        }
      }

      case 'youtube': {
        const ytData = data as ImaiYtChannelInfoResponse
        // YouTube returns channel_info object
        if (!ytData.success || !ytData.channel_info) {
          this.logger.warn(`IMAI YouTube returned error or no channel data`)
          return null
        }
        const channel = ytData.channel_info
        return {
          handle: channel.custom_url?.replace('@', '') || channel.username || fallbackHandle,
          platform,
          fullName: channel.fullname || fallbackHandle,
          bio: channel.description || null,
          profilePicUrl: channel.picture || null,
          followers: channel.followers || 0,
          engagementRate: null, // Would need additional API call to calculate
        }
      }

      default:
        return null
    }
  }

  /**
   * Normalize handle by removing @ prefix if present
   */
  private normalizeHandle(handle: string): string {
    return handle.startsWith('@') ? handle.slice(1) : handle
  }
}
