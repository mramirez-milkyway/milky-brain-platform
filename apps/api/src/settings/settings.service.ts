import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateOrgSettingsDto } from './dto/settings.dto'
import {
  UpdateDataRefreshSettingsDto,
  DataRefreshSettingsResponse,
  NetworkThresholdDto,
  DEFAULT_THRESHOLDS,
} from './dto/data-refresh-settings.dto'

type SocialNetwork = 'instagram' | 'tiktok' | 'youtube'
const SOCIAL_NETWORKS: SocialNetwork[] = ['instagram', 'tiktok', 'youtube']
const DATA_REFRESH_KEY_PREFIX = 'dataRefresh.'

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getOrgSettings() {
    let workspace = await this.prisma.workspace.findFirst()

    if (!workspace) {
      workspace = await this.prisma.workspace.create({
        data: {
          name: 'My Organization',
          timezone: 'UTC',
          currency: 'USD',
        },
      })
    }

    return workspace
  }

  async updateOrgSettings(updateDto: UpdateOrgSettingsDto) {
    const workspace = await this.prisma.workspace.findFirst()

    if (workspace) {
      return this.prisma.workspace.update({
        where: { id: workspace.id },
        data: updateDto,
      })
    }

    return this.prisma.workspace.create({
      data: {
        name: updateDto.name || 'My Organization',
        timezone: updateDto.timezone || 'UTC',
        currency: updateDto.currency || 'USD',
        logoUrl: updateDto.logoUrl,
      },
    })
  }

  async getDataRefreshSettings(): Promise<DataRefreshSettingsResponse> {
    const settings = await this.prisma.setting.findMany({
      where: {
        key: {
          in: SOCIAL_NETWORKS.map((network) => `${DATA_REFRESH_KEY_PREFIX}${network}`),
        },
      },
    })

    const result: DataRefreshSettingsResponse = {
      instagram: { ...DEFAULT_THRESHOLDS },
      tiktok: { ...DEFAULT_THRESHOLDS },
      youtube: { ...DEFAULT_THRESHOLDS },
    }

    for (const setting of settings) {
      const network = setting.key.replace(DATA_REFRESH_KEY_PREFIX, '') as SocialNetwork
      if (SOCIAL_NETWORKS.includes(network)) {
        const value = setting.value as unknown as NetworkThresholdDto
        result[network] = {
          basicDataDays: value.basicDataDays ?? DEFAULT_THRESHOLDS.basicDataDays,
          audienceDataDays: value.audienceDataDays ?? DEFAULT_THRESHOLDS.audienceDataDays,
        }
      }
    }

    return result
  }

  async updateDataRefreshSettings(
    updateDto: UpdateDataRefreshSettingsDto,
    userId?: number
  ): Promise<DataRefreshSettingsResponse> {
    const networksToUpdate = Object.entries(updateDto).filter(
      ([key, value]) => SOCIAL_NETWORKS.includes(key as SocialNetwork) && value !== undefined
    ) as [SocialNetwork, NetworkThresholdDto][]

    for (const [network, thresholds] of networksToUpdate) {
      const key = `${DATA_REFRESH_KEY_PREFIX}${network}`
      const jsonValue = {
        basicDataDays: thresholds.basicDataDays,
        audienceDataDays: thresholds.audienceDataDays,
      }

      await this.prisma.setting.upsert({
        where: { key },
        create: {
          key,
          value: jsonValue,
          version: 1,
          updatedBy: userId,
          description: `Data refresh thresholds for ${network}`,
        },
        update: {
          value: jsonValue,
          version: { increment: 1 },
          updatedBy: userId,
        },
      })
    }

    return this.getDataRefreshSettings()
  }
}
