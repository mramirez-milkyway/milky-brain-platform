import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  IntegrationUsageDto,
  IntegrationsUsageResponseDto,
} from './dto/integration-usage-response.dto'

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name)

  constructor(private readonly configService: ConfigService) {}

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
}
