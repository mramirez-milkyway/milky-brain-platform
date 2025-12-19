'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface ImaiProfile {
  handle: string
  platform: string
  fullName: string
  bio: string | null
  profilePicUrl: string | null
  followers: number
  engagementRate: number | null
}

export interface ImaiProfileResponse {
  found: boolean
  profile: ImaiProfile | null
  cached: boolean
}

/**
 * Hook to look up an influencer profile from IMAI API
 *
 * @param handle - Social media handle (with or without @)
 * @param platform - Platform to search on (instagram, tiktok, youtube)
 * @param enabled - Whether to run the query (default: false, must be explicitly enabled)
 */
export function useImaiProfileLookup(
  handle: string,
  platform: 'instagram' | 'tiktok' | 'youtube',
  enabled: boolean = false
) {
  return useQuery<ImaiProfileResponse>({
    queryKey: ['imai-profile', platform, handle],
    queryFn: async () => {
      const response = await apiClient.get('/integrations/imai/profile', {
        params: { handle, platform },
      })
      return response.data
    },
    enabled: enabled && !!handle && !!platform,
    staleTime: 5 * 60 * 1000, // 5 minutes (matches backend cache)
    retry: false, // Don't retry on failure (might be rate limited)
  })
}
