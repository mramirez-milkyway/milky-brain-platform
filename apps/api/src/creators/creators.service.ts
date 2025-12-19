import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common'
import { CreatorsRepository, CreatorWithSocials, CreatorFilters } from './creators.repository'
import {
  CreatorListResponseDto,
  CreatorListItemDto,
  CreatorDetailDto,
  CreatorSocialResponseDto,
  CreatorQueryDto,
  CreateCreatorDto,
  UpdateCreatorDto,
  CreateCreatorResponseDto,
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

  /**
   * Create a new creator/influencer with restore-on-create logic
   * If a soft-deleted record with the same handle+platform exists, it will be restored
   */
  async create(dto: CreateCreatorDto): Promise<CreateCreatorResponseDto> {
    // Check for each social account if there's a conflict or soft-deleted record
    for (const socialAccount of dto.socialAccounts) {
      // Check for active duplicate
      const existingActive = await this.creatorsRepository.findActiveByHandleAndPlatform(
        socialAccount.handle,
        socialAccount.platform
      )

      if (existingActive) {
        throw new ConflictException(
          `An influencer with handle "${socialAccount.handle}" already exists on ${socialAccount.platform}.`
        )
      }
    }

    // Check if any social account matches a soft-deleted record (for restore)
    for (const socialAccount of dto.socialAccounts) {
      const softDeleted = await this.creatorsRepository.findSoftDeletedByHandleAndPlatform(
        socialAccount.handle,
        socialAccount.platform
      )

      if (softDeleted) {
        this.logger.log(
          `Restoring soft-deleted creator ID ${softDeleted.id} for handle ${socialAccount.handle}`
        )

        // Restore the record with new data
        const restored = await this.creatorsRepository.restore(softDeleted.id, {
          fullName: dto.fullName,
          gender: dto.gender,
          country: dto.country,
          city: dto.city,
          email: dto.email,
          phoneNumber: dto.phoneNumber,
          characteristics: dto.characteristics,
          pastClients: dto.pastClients,
          pastCampaigns: dto.pastCampaigns,
          comments: dto.comments,
          languages: dto.languages,
          categories: dto.categories,
          internalTags: dto.internalTags,
          agencyName: dto.agencyName,
          managerName: dto.managerName,
          billingInfo: dto.billingInfo,
          internalRating: dto.internalRating,
          socialAccounts: dto.socialAccounts.map((sa) => ({
            handle: sa.handle,
            platform: sa.platform,
            followers: sa.followers,
            tier: sa.tier,
            socialLink: sa.socialLink,
          })),
        })

        return {
          ...this.mapToDetail(restored),
          restored: true,
        }
      }
    }

    // No conflicts or soft-deleted records, create new
    this.logger.log(`Creating new creator: ${dto.fullName}`)

    const creator = await this.creatorsRepository.create({
      fullName: dto.fullName,
      gender: dto.gender,
      country: dto.country,
      city: dto.city,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      characteristics: dto.characteristics,
      pastClients: dto.pastClients,
      pastCampaigns: dto.pastCampaigns,
      comments: dto.comments,
      languages: dto.languages,
      categories: dto.categories,
      internalTags: dto.internalTags,
      agencyName: dto.agencyName,
      managerName: dto.managerName,
      billingInfo: dto.billingInfo,
      internalRating: dto.internalRating,
      socialAccounts: dto.socialAccounts.map((sa) => ({
        handle: sa.handle,
        platform: sa.platform,
        followers: sa.followers,
        tier: sa.tier,
        socialLink: sa.socialLink,
      })),
    })

    return {
      ...this.mapToDetail(creator),
      restored: false,
    }
  }

  /**
   * Update an existing creator/influencer
   */
  async update(id: number, dto: UpdateCreatorDto): Promise<CreatorDetailDto> {
    // Verify creator exists and is not soft-deleted
    const existing = await this.creatorsRepository.findById(id)
    if (!existing) {
      throw new NotFoundException(`Influencer with ID ${id} not found`)
    }

    this.logger.log(`Updating creator ID ${id}`)

    const updated = await this.creatorsRepository.update(id, {
      fullName: dto.fullName,
      gender: dto.gender,
      country: dto.country,
      city: dto.city,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      characteristics: dto.characteristics,
      pastClients: dto.pastClients,
      pastCampaigns: dto.pastCampaigns,
      comments: dto.comments,
      isActive: dto.isActive,
      languages: dto.languages,
      categories: dto.categories,
      internalTags: dto.internalTags,
      isBlacklisted: dto.isBlacklisted,
      blacklistReason: dto.blacklistReason,
      agencyName: dto.agencyName,
      managerName: dto.managerName,
      billingInfo: dto.billingInfo,
      internalRating: dto.internalRating,
    })

    return this.mapToDetail(updated)
  }

  /**
   * Soft delete a creator/influencer
   */
  async delete(id: number): Promise<{ message: string }> {
    // Verify creator exists and is not already soft-deleted
    const existing = await this.creatorsRepository.findById(id)
    if (!existing) {
      throw new NotFoundException(`Influencer with ID ${id} not found`)
    }

    this.logger.log(`Soft deleting creator ID ${id}`)

    await this.creatorsRepository.softDelete(id)

    return { message: 'Influencer deleted successfully' }
  }

  /**
   * Get filter options (countries, cities, languages, categories)
   * Used to populate dropdowns in the UI
   */
  async getFilterOptions(): Promise<{
    countries: string[]
    citiesByCountry: Record<string, string[]>
    languages: string[]
    categories: string[]
  }> {
    return this.creatorsRepository.getFilterOptions()
  }
}
