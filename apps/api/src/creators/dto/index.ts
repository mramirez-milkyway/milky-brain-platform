import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator'
import { Type } from 'class-transformer'

export class CreatorQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20
}

export interface CreatorSocialResponseDto {
  id: number
  socialMedia: string
  handle: string
  followers: number | null
  tier: string | null
  socialLink: string | null
}

export interface CreatorListItemDto {
  id: number
  fullName: string
  country: string | null
  city: string | null
  categories: string | null
  isActive: boolean
  isBlacklisted: boolean
  creatorSocials: CreatorSocialResponseDto[]
}

export interface CreatorDetailDto {
  id: number
  fullName: string
  gender: string | null
  country: string | null
  city: string | null
  email: string | null
  phoneNumber: string | null
  characteristics: string | null
  pastClients: string | null
  pastCampaigns: string | null
  comments: string | null
  isActive: boolean
  languages: string | null
  categories: string | null
  internalTags: string | null
  isBlacklisted: boolean
  blacklistReason: string | null
  agencyName: string | null
  managerName: string | null
  billingInfo: string | null
  lastBrand: string | null
  campaignsActive: number | null
  lastCampaignCompleted: Date | null
  lastFee: string | null
  lastCpv: number | null
  lastCpm: number | null
  internalRating: number | null
  createdAt: Date
  updatedAt: Date
  creatorSocials: CreatorSocialResponseDto[]
}

export interface CreatorListResponseDto {
  data: CreatorListItemDto[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
