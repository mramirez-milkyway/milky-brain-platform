import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { CreatorsRepository, CreatorWithSocials, CreatorFilters } from './creators.repository'
import {
  CreatorListResponseDto,
  CreatorListItemDto,
  CreatorDetailDto,
  CreatorSocialResponseDto,
  CreatorQueryDto,
} from './dto'

@Injectable()
export class CreatorsService {
  private readonly logger = new Logger(CreatorsService.name)

  constructor(private readonly creatorsRepository: CreatorsRepository) {}

  async findAll(query: CreatorQueryDto): Promise<CreatorListResponseDto> {
    const { page = 1, pageSize = 20 } = query
    const offset = (page - 1) * pageSize

    // Extract filters from query
    const filters: CreatorFilters = {
      platform: query.platform,
      handle: query.handle,
      country: query.country,
      gender: query.gender,
      language: query.language,
      minFollowers: query.minFollowers,
      maxFollowers: query.maxFollowers,
      minEngagementRate: query.minEngagementRate,
      maxEngagementRate: query.maxEngagementRate,
      minCredibility: query.minCredibility,
      minReelsPlays: query.minReelsPlays,
      maxReelsPlays: query.maxReelsPlays,
      minTiktokViews: query.minTiktokViews,
      maxTiktokViews: query.maxTiktokViews,
      audienceCountry: query.audienceCountry,
      audienceCountryMinPercent: query.audienceCountryMinPercent,
      audienceGender: query.audienceGender,
      audienceGenderMinPercent: query.audienceGenderMinPercent,
      audienceMinAge: query.audienceMinAge,
      audienceMaxAge: query.audienceMaxAge,
      audienceAgeMinPercent: query.audienceAgeMinPercent,
      categories: query.categories,
      excludeBlacklisted: query.excludeBlacklisted,
      minInternalRating: query.minInternalRating,
      hasWorkedWithUs: query.hasWorkedWithUs,
    }

    // Log filter usage for analytics
    const activeFilters = Object.entries(filters)
      .filter(([, v]) => v !== undefined)
      .map(([k]) => k)
    if (activeFilters.length > 0) {
      this.logger.log(`Filter request: ${activeFilters.join(', ')}`)
    }

    const [creators, total] = await Promise.all([
      this.creatorsRepository.findAllWithFilters(filters, pageSize, offset),
      this.creatorsRepository.countWithFilters(filters),
    ])

    const totalPages = Math.ceil(total / pageSize)

    return {
      data: creators.map((creator) => this.mapToListItem(creator)),
      total,
      page,
      pageSize,
      totalPages,
    }
  }

  async findById(id: number): Promise<CreatorDetailDto> {
    const creator = await this.creatorsRepository.findById(id)

    if (!creator) {
      throw new NotFoundException(`Creator with ID ${id} not found`)
    }

    return this.mapToDetail(creator)
  }

  private mapToListItem(creator: CreatorWithSocials): CreatorListItemDto {
    return {
      id: creator.id,
      fullName: creator.fullName,
      country: creator.country,
      city: creator.city,
      categories: creator.categories,
      isActive: creator.isActive,
      isBlacklisted: creator.isBlacklisted,
      creatorSocials: creator.creatorSocials.map((social) => this.mapSocial(social)),
    }
  }

  private mapToDetail(creator: CreatorWithSocials): CreatorDetailDto {
    return {
      id: creator.id,
      fullName: creator.fullName,
      gender: creator.gender,
      country: creator.country,
      city: creator.city,
      email: creator.email,
      phoneNumber: creator.phoneNumber,
      characteristics: creator.characteristics,
      pastClients: creator.pastClients,
      pastCampaigns: creator.pastCampaigns,
      comments: creator.comments,
      isActive: creator.isActive,
      languages: creator.languages,
      categories: creator.categories,
      internalTags: creator.internalTags,
      isBlacklisted: creator.isBlacklisted,
      blacklistReason: creator.blacklistReason,
      agencyName: creator.agencyName,
      managerName: creator.managerName,
      billingInfo: creator.billingInfo,
      lastBrand: creator.lastBrand,
      campaignsActive: creator.campaignsActive,
      lastCampaignCompleted: creator.lastCampaignCompleted,
      lastFee: creator.lastFee?.toString() ?? null,
      lastCpv: creator.lastCpv,
      lastCpm: creator.lastCpm,
      internalRating: creator.internalRating,
      createdAt: creator.createdAt,
      updatedAt: creator.updatedAt,
      creatorSocials: creator.creatorSocials.map((social) => this.mapSocial(social)),
    }
  }

  private mapSocial(social: CreatorWithSocials['creatorSocials'][0]): CreatorSocialResponseDto {
    return {
      id: social.id,
      socialMedia: social.socialMedia,
      handle: social.handle,
      followers: social.followers,
      tier: social.tier,
      socialLink: social.socialLink,
    }
  }
}
