import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsArray,
  ArrayMaxSize,
  IsNotEmpty,
  IsEmail,
  ValidateNested,
} from 'class-validator'
import { Type, Transform } from 'class-transformer'

// Valid social media platforms
export const PLATFORMS = ['instagram', 'tiktok', 'youtube'] as const
export type Platform = (typeof PLATFORMS)[number]

// Valid gender values
export const GENDERS = ['male', 'female', 'organization'] as const
export type Gender = (typeof GENDERS)[number]

/**
 * Helper to transform comma-separated string to array
 */
function transformToArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (Array.isArray(value)) return value
  if (typeof value === 'string') return value.split(',').map((s) => s.trim())
  return undefined
}

/**
 * Helper to transform string 'true'/'false' to boolean
 */
function transformToBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

export class CreatorQueryDto {
  // === Pagination ===
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

  // === Required Filter ===
  @IsOptional()
  @IsString()
  @IsEnum(PLATFORMS, { message: 'platform must be one of: instagram, tiktok, youtube' })
  platform?: Platform = 'instagram'

  // === Basic Filters ===
  @IsOptional()
  @IsString()
  handle?: string

  // === Demographics - Creator ===
  @IsOptional()
  @Transform(({ value }) => transformToArray(value))
  @IsArray()
  @ArrayMaxSize(5, { message: 'Maximum 5 countries allowed' })
  @IsString({ each: true })
  country?: string[]

  @IsOptional()
  @IsString()
  @IsEnum(GENDERS, { message: 'gender must be one of: male, female, organization' })
  gender?: Gender

  @IsOptional()
  @IsString()
  language?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(13)
  minAge?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(100)
  maxAge?: number

  // === Demographics - Audience ===
  @IsOptional()
  @Transform(({ value }) => transformToArray(value))
  @IsArray()
  @IsString({ each: true })
  audienceCountry?: string[]

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  audienceCountryMinPercent?: number

  @IsOptional()
  @IsString()
  @IsEnum(['male', 'female'], { message: 'audienceGender must be one of: male, female' })
  audienceGender?: 'male' | 'female'

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  audienceGenderMinPercent?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(13)
  audienceMinAge?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(100)
  audienceMaxAge?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  audienceAgeMinPercent?: number

  // === Performance Metrics ===
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minFollowers?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxFollowers?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minEngagementRate?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Max(100)
  maxEngagementRate?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minReelsPlays?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxReelsPlays?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minTiktokViews?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxTiktokViews?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minCredibility?: number

  // === Internal Filters ===
  @IsOptional()
  @Transform(({ value }) => transformToArray(value))
  @IsArray()
  @IsString({ each: true })
  categories?: string[]

  @IsOptional()
  @Transform(({ value }) => {
    // Default to true if not specified
    if (value === undefined || value === null || value === '') return true
    return transformToBoolean(value)
  })
  @IsBoolean()
  excludeBlacklisted?: boolean = true

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minInternalRating?: number

  @IsOptional()
  @Transform(({ value }) => transformToBoolean(value))
  @IsBoolean()
  hasWorkedWithUs?: boolean
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
  agencyId: number | null
  agency: { id: number; name: string } | null
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

// ==================== CREATE/UPDATE DTOs ====================

/**
 * DTO for creating a new social media account for a creator
 */
export class CreateCreatorSocialDto {
  @IsString()
  @IsNotEmpty({ message: 'Handle is required' })
  handle: string

  @IsString()
  @IsEnum(PLATFORMS, { message: 'Platform must be one of: instagram, tiktok, youtube' })
  platform: Platform

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  followers?: number

  @IsOptional()
  @IsString()
  tier?: string

  @IsOptional()
  @IsString()
  socialLink?: string
}

/**
 * DTO for creating a new creator/influencer
 */
export class CreateCreatorDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string

  @ValidateNested({ each: true })
  @Type(() => CreateCreatorSocialDto)
  @IsArray()
  @ArrayMaxSize(10, { message: 'Maximum 10 social accounts allowed' })
  socialAccounts: CreateCreatorSocialDto[]

  @IsOptional()
  @IsString()
  @IsEnum(GENDERS, { message: 'Gender must be one of: male, female, organization' })
  gender?: Gender

  @IsOptional()
  @IsString()
  country?: string

  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string

  @IsOptional()
  @IsString()
  phoneNumber?: string

  @IsOptional()
  @IsString()
  characteristics?: string

  @IsOptional()
  @IsString()
  pastClients?: string

  @IsOptional()
  @IsString()
  pastCampaigns?: string

  @IsOptional()
  @IsString()
  comments?: string

  @IsOptional()
  @IsString()
  languages?: string

  @IsOptional()
  @IsString()
  categories?: string

  @IsOptional()
  @IsString()
  internalTags?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  agencyId?: number

  @IsOptional()
  @IsString()
  managerName?: string

  @IsOptional()
  @IsString()
  billingInfo?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  internalRating?: number
}

/**
 * DTO for updating an existing creator/influencer
 */
export class UpdateCreatorDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Full name cannot be empty' })
  fullName?: string

  @IsOptional()
  @IsString()
  @IsEnum(GENDERS, { message: 'Gender must be one of: male, female, organization' })
  gender?: Gender

  @IsOptional()
  @IsString()
  country?: string

  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string

  @IsOptional()
  @IsString()
  phoneNumber?: string

  @IsOptional()
  @IsString()
  characteristics?: string

  @IsOptional()
  @IsString()
  pastClients?: string

  @IsOptional()
  @IsString()
  pastCampaigns?: string

  @IsOptional()
  @IsString()
  comments?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsString()
  languages?: string

  @IsOptional()
  @IsString()
  categories?: string

  @IsOptional()
  @IsString()
  internalTags?: string

  @IsOptional()
  @IsBoolean()
  isBlacklisted?: boolean

  @IsOptional()
  @IsString()
  blacklistReason?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  agencyId?: number

  @IsOptional()
  @IsString()
  managerName?: string

  @IsOptional()
  @IsString()
  billingInfo?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  internalRating?: number
}

/**
 * Response DTO for create operation - includes restored flag
 */
export interface CreateCreatorResponseDto extends CreatorDetailDto {
  restored: boolean
}
