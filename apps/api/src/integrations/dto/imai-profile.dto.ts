import { IsString, IsEnum, IsNotEmpty } from 'class-validator'

export const SUPPORTED_PLATFORMS = ['instagram', 'tiktok', 'youtube'] as const
export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number]

export class ImaiProfileQueryDto {
  @IsString()
  @IsNotEmpty({ message: 'Handle is required' })
  handle: string

  @IsString()
  @IsEnum(SUPPORTED_PLATFORMS, {
    message: 'Platform must be one of: instagram, tiktok, youtube',
  })
  platform: SupportedPlatform
}

export interface ImaiProfileData {
  handle: string
  platform: string
  fullName: string
  bio: string | null
  profilePicUrl: string | null
  followers: number
  engagementRate: number | null
}

export interface ImaiProfileResponseDto {
  found: boolean
  profile: ImaiProfileData | null
  cached: boolean
}
