import { Injectable, NotFoundException } from '@nestjs/common'
import { CreatorsRepository, CreatorWithSocials } from './creators.repository'
import {
  CreatorListResponseDto,
  CreatorListItemDto,
  CreatorDetailDto,
  CreatorSocialResponseDto,
} from './dto'

@Injectable()
export class CreatorsService {
  constructor(private readonly creatorsRepository: CreatorsRepository) {}

  async findAll(page: number, pageSize: number): Promise<CreatorListResponseDto> {
    const offset = (page - 1) * pageSize

    const [creators, total] = await Promise.all([
      this.creatorsRepository.findAll(pageSize, offset),
      this.creatorsRepository.count(),
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
