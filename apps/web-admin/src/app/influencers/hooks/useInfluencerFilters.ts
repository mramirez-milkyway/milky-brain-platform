'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'

// Filter types matching backend DTOs
export type Platform = 'instagram' | 'tiktok' | 'youtube'
export type Gender = 'male' | 'female' | 'organization'
export type AudienceGender = 'male' | 'female'

export interface InfluencerFilters {
  // Pagination
  page: number
  pageSize: number
  // Required
  platform: Platform
  // Basic
  handle?: string
  // Demographics - Creator
  country?: string[]
  gender?: Gender
  language?: string
  minAge?: number
  maxAge?: number
  // Performance
  minFollowers?: number
  maxFollowers?: number
  minEngagements?: number
  maxEngagements?: number
  minEngagementRate?: number
  maxEngagementRate?: number
  minCredibility?: number
  // Platform-specific - Instagram
  minReelsPlays?: number
  maxReelsPlays?: number
  minFollowersCredibility?: number
  maxFollowersCredibility?: number
  // Platform-specific - TikTok
  minTiktokViews?: number
  maxTiktokViews?: number
  minTiktokSaves?: number
  maxTiktokSaves?: number
  minTiktokShares?: number
  maxTiktokShares?: number
  // Platform-specific - YouTube
  minYoutubeViews?: number
  maxYoutubeViews?: number
  // Audience demographics
  audienceCountry?: string[]
  audienceCountryMinPercent?: number
  audienceGender?: AudienceGender
  audienceGenderMinPercent?: number
  audienceLanguage?: string
  audienceLanguageMinPercent?: number
  audienceMinAge?: number
  audienceMaxAge?: number
  audienceAgeMinPercent?: number
  // Account
  onlyVerified?: boolean
  onlyCredible?: boolean
  excludePrivate?: boolean
  // Internal
  categories?: string[]
  excludeBlacklisted: boolean
  minInternalRating?: number
  hasWorkedWithUs?: boolean
}

// Default filter values
const DEFAULT_FILTERS: InfluencerFilters = {
  page: 1,
  pageSize: 20,
  platform: 'instagram',
  excludeBlacklisted: true,
}

/**
 * Parse a comma-separated string to array
 */
function parseArrayParam(value: string | null): string[] | undefined {
  if (!value) return undefined
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Parse a numeric parameter
 */
function parseNumberParam(value: string | null): number | undefined {
  if (!value) return undefined
  const num = Number(value)
  return isNaN(num) ? undefined : num
}

/**
 * Parse a boolean parameter
 */
function parseBooleanParam(value: string | null, defaultValue: boolean): boolean {
  if (value === null) return defaultValue
  return value !== 'false'
}

/**
 * Hook to manage influencer filter state synchronized with URL query parameters
 */
export function useInfluencerFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Parse current filters from URL
  const filters: InfluencerFilters = useMemo(() => {
    return {
      // Pagination
      page: parseNumberParam(searchParams.get('page')) ?? DEFAULT_FILTERS.page,
      pageSize: parseNumberParam(searchParams.get('pageSize')) ?? DEFAULT_FILTERS.pageSize,
      // Required
      platform: (searchParams.get('platform') as Platform) ?? DEFAULT_FILTERS.platform,
      // Basic
      handle: searchParams.get('handle') ?? undefined,
      // Demographics - Creator
      country: parseArrayParam(searchParams.get('country')),
      gender: (searchParams.get('gender') as Gender) ?? undefined,
      language: searchParams.get('language') ?? undefined,
      minAge: parseNumberParam(searchParams.get('minAge')),
      maxAge: parseNumberParam(searchParams.get('maxAge')),
      // Performance
      minFollowers: parseNumberParam(searchParams.get('minFollowers')),
      maxFollowers: parseNumberParam(searchParams.get('maxFollowers')),
      minEngagements: parseNumberParam(searchParams.get('minEngagements')),
      maxEngagements: parseNumberParam(searchParams.get('maxEngagements')),
      minEngagementRate: parseNumberParam(searchParams.get('minEngagementRate')),
      maxEngagementRate: parseNumberParam(searchParams.get('maxEngagementRate')),
      minCredibility: parseNumberParam(searchParams.get('minCredibility')),
      // Platform-specific - Instagram
      minReelsPlays: parseNumberParam(searchParams.get('minReelsPlays')),
      maxReelsPlays: parseNumberParam(searchParams.get('maxReelsPlays')),
      minFollowersCredibility: parseNumberParam(searchParams.get('minFollowersCredibility')),
      maxFollowersCredibility: parseNumberParam(searchParams.get('maxFollowersCredibility')),
      // Platform-specific - TikTok
      minTiktokViews: parseNumberParam(searchParams.get('minTiktokViews')),
      maxTiktokViews: parseNumberParam(searchParams.get('maxTiktokViews')),
      minTiktokSaves: parseNumberParam(searchParams.get('minTiktokSaves')),
      maxTiktokSaves: parseNumberParam(searchParams.get('maxTiktokSaves')),
      minTiktokShares: parseNumberParam(searchParams.get('minTiktokShares')),
      maxTiktokShares: parseNumberParam(searchParams.get('maxTiktokShares')),
      // Platform-specific - YouTube
      minYoutubeViews: parseNumberParam(searchParams.get('minYoutubeViews')),
      maxYoutubeViews: parseNumberParam(searchParams.get('maxYoutubeViews')),
      // Audience demographics
      audienceCountry: parseArrayParam(searchParams.get('audienceCountry')),
      audienceCountryMinPercent: parseNumberParam(searchParams.get('audienceCountryMinPercent')),
      audienceGender: (searchParams.get('audienceGender') as AudienceGender) ?? undefined,
      audienceGenderMinPercent: parseNumberParam(searchParams.get('audienceGenderMinPercent')),
      audienceLanguage: searchParams.get('audienceLanguage') ?? undefined,
      audienceLanguageMinPercent: parseNumberParam(searchParams.get('audienceLanguageMinPercent')),
      audienceMinAge: parseNumberParam(searchParams.get('audienceMinAge')),
      audienceMaxAge: parseNumberParam(searchParams.get('audienceMaxAge')),
      audienceAgeMinPercent: parseNumberParam(searchParams.get('audienceAgeMinPercent')),
      // Account
      onlyVerified: searchParams.get('onlyVerified') === 'true' ? true : undefined,
      onlyCredible: searchParams.get('onlyCredible') === 'true' ? true : undefined,
      excludePrivate: searchParams.get('excludePrivate') === 'true' ? true : undefined,
      // Internal
      categories: parseArrayParam(searchParams.get('categories')),
      excludeBlacklisted: parseBooleanParam(
        searchParams.get('excludeBlacklisted'),
        DEFAULT_FILTERS.excludeBlacklisted
      ),
      minInternalRating: parseNumberParam(searchParams.get('minInternalRating')),
      hasWorkedWithUs:
        searchParams.get('hasWorkedWithUs') === 'true'
          ? true
          : searchParams.get('hasWorkedWithUs') === 'false'
            ? false
            : undefined,
    }
  }, [searchParams])

  /**
   * Update filters and sync to URL
   */
  const setFilters = useCallback(
    (newFilters: Partial<InfluencerFilters>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString())

      // Merge new filters
      const mergedFilters = { ...filters, ...newFilters }

      // Reset page to 1 when filters change (unless explicitly setting page)
      if (resetPage && !('page' in newFilters)) {
        mergedFilters.page = 1
      }

      // Update URL params
      Object.entries(mergedFilters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          params.delete(key)
        } else if (Array.isArray(value)) {
          if (value.length > 0) {
            params.set(key, value.join(','))
          } else {
            params.delete(key)
          }
        } else if (typeof value === 'boolean') {
          // Only set boolean params if they differ from default
          if (key === 'excludeBlacklisted') {
            if (value !== DEFAULT_FILTERS.excludeBlacklisted) {
              params.set(key, String(value))
            } else {
              params.delete(key)
            }
          } else {
            params.set(key, String(value))
          }
        } else if (typeof value === 'number') {
          // Only set pagination if not default
          if (key === 'page' && value === DEFAULT_FILTERS.page) {
            params.delete(key)
          } else if (key === 'pageSize' && value === DEFAULT_FILTERS.pageSize) {
            params.delete(key)
          } else {
            params.set(key, String(value))
          }
        } else {
          // Only set platform if not default
          if (key === 'platform' && value === DEFAULT_FILTERS.platform) {
            params.delete(key)
          } else {
            params.set(key, String(value))
          }
        }
      })

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname, filters]
  )

  /**
   * Set a single filter value
   */
  const setFilter = useCallback(
    <K extends keyof InfluencerFilters>(key: K, value: InfluencerFilters[K]) => {
      setFilters({ [key]: value })
    },
    [setFilters]
  )

  /**
   * Clear all filters and reset to defaults, preserving current platform
   */
  const clearFilters = useCallback(() => {
    // Keep the current platform selection when clearing (platform is required, not a filter)
    const params = new URLSearchParams()
    if (filters.platform !== DEFAULT_FILTERS.platform) {
      params.set('platform', filters.platform)
    }
    const queryString = params.toString()
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }, [router, pathname, filters.platform])

  /**
   * Set page number
   */
  const setPage = useCallback(
    (page: number) => {
      setFilters({ page }, false)
    },
    [setFilters]
  )

  /**
   * Set page size (resets to page 1)
   */
  const setPageSize = useCallback(
    (pageSize: number) => {
      setFilters({ pageSize, page: 1 }, false)
    },
    [setFilters]
  )

  /**
   * Count active filters (excluding defaults and platform, which is always required)
   */
  const activeFilterCount = useMemo(() => {
    let count = 0
    // Platform is NOT counted - it's a required selector, not a filter
    if (filters.handle) count++
    if (filters.country && filters.country.length > 0) count++
    if (filters.gender) count++
    if (filters.language) count++
    if (filters.minAge !== undefined || filters.maxAge !== undefined) count++
    if (filters.minFollowers !== undefined || filters.maxFollowers !== undefined) count++
    if (filters.minEngagements !== undefined || filters.maxEngagements !== undefined) count++
    if (filters.minEngagementRate !== undefined) count++
    if (filters.minCredibility !== undefined) count++
    if (filters.categories && filters.categories.length > 0) count++
    if (filters.excludeBlacklisted !== DEFAULT_FILTERS.excludeBlacklisted) count++
    if (filters.minInternalRating !== undefined) count++
    if (filters.hasWorkedWithUs !== undefined) count++
    // Audience filters
    if (filters.audienceCountry && filters.audienceCountry.length > 0) count++
    if (filters.audienceGender) count++
    if (filters.audienceLanguage) count++
    if (filters.audienceMinAge !== undefined || filters.audienceMaxAge !== undefined) count++
    // Account filters
    if (filters.onlyVerified) count++
    if (filters.onlyCredible) count++
    if (filters.excludePrivate) count++
    // Platform-specific - Instagram
    if (filters.minReelsPlays !== undefined || filters.maxReelsPlays !== undefined) count++
    if (
      filters.minFollowersCredibility !== undefined ||
      filters.maxFollowersCredibility !== undefined
    )
      count++
    // Platform-specific - TikTok
    if (filters.minTiktokViews !== undefined || filters.maxTiktokViews !== undefined) count++
    if (filters.minTiktokSaves !== undefined || filters.maxTiktokSaves !== undefined) count++
    if (filters.minTiktokShares !== undefined || filters.maxTiktokShares !== undefined) count++
    // Platform-specific - YouTube
    if (filters.minYoutubeViews !== undefined || filters.maxYoutubeViews !== undefined) count++
    return count
  }, [filters])

  /**
   * Build query string for API call
   */
  const queryString = useMemo(() => {
    const params = new URLSearchParams()

    // Always include pagination
    params.set('page', String(filters.page))
    params.set('pageSize', String(filters.pageSize))

    // Add filters
    if (filters.platform) params.set('platform', filters.platform)
    if (filters.handle) params.set('handle', filters.handle)
    if (filters.country && filters.country.length > 0) {
      params.set('country', filters.country.join(','))
    }
    if (filters.gender) params.set('gender', filters.gender)
    if (filters.language) params.set('language', filters.language)
    if (filters.minAge !== undefined) params.set('minAge', String(filters.minAge))
    if (filters.maxAge !== undefined) params.set('maxAge', String(filters.maxAge))
    if (filters.minFollowers !== undefined) params.set('minFollowers', String(filters.minFollowers))
    if (filters.maxFollowers !== undefined) params.set('maxFollowers', String(filters.maxFollowers))
    if (filters.minEngagements !== undefined)
      params.set('minEngagements', String(filters.minEngagements))
    if (filters.maxEngagements !== undefined)
      params.set('maxEngagements', String(filters.maxEngagements))
    if (filters.minEngagementRate !== undefined) {
      params.set('minEngagementRate', String(filters.minEngagementRate))
    }
    if (filters.minCredibility !== undefined) {
      params.set('minCredibility', String(filters.minCredibility))
    }
    if (filters.categories && filters.categories.length > 0) {
      params.set('categories', filters.categories.join(','))
    }
    params.set('excludeBlacklisted', String(filters.excludeBlacklisted))
    if (filters.minInternalRating !== undefined) {
      params.set('minInternalRating', String(filters.minInternalRating))
    }
    if (filters.hasWorkedWithUs !== undefined) {
      params.set('hasWorkedWithUs', String(filters.hasWorkedWithUs))
    }
    // Audience filters
    if (filters.audienceCountry && filters.audienceCountry.length > 0) {
      params.set('audienceCountry', filters.audienceCountry.join(','))
    }
    if (filters.audienceCountryMinPercent !== undefined) {
      params.set('audienceCountryMinPercent', String(filters.audienceCountryMinPercent))
    }
    if (filters.audienceGender) params.set('audienceGender', filters.audienceGender)
    if (filters.audienceGenderMinPercent !== undefined) {
      params.set('audienceGenderMinPercent', String(filters.audienceGenderMinPercent))
    }
    if (filters.audienceLanguage) params.set('audienceLanguage', filters.audienceLanguage)
    if (filters.audienceLanguageMinPercent !== undefined) {
      params.set('audienceLanguageMinPercent', String(filters.audienceLanguageMinPercent))
    }
    if (filters.audienceMinAge !== undefined)
      params.set('audienceMinAge', String(filters.audienceMinAge))
    if (filters.audienceMaxAge !== undefined)
      params.set('audienceMaxAge', String(filters.audienceMaxAge))
    if (filters.audienceAgeMinPercent !== undefined) {
      params.set('audienceAgeMinPercent', String(filters.audienceAgeMinPercent))
    }
    // Account filters
    if (filters.onlyVerified) params.set('onlyVerified', 'true')
    if (filters.onlyCredible) params.set('onlyCredible', 'true')
    if (filters.excludePrivate) params.set('excludePrivate', 'true')
    // Platform-specific - Instagram
    if (filters.minReelsPlays !== undefined)
      params.set('minReelsPlays', String(filters.minReelsPlays))
    if (filters.maxReelsPlays !== undefined)
      params.set('maxReelsPlays', String(filters.maxReelsPlays))
    if (filters.minFollowersCredibility !== undefined)
      params.set('minFollowersCredibility', String(filters.minFollowersCredibility))
    if (filters.maxFollowersCredibility !== undefined)
      params.set('maxFollowersCredibility', String(filters.maxFollowersCredibility))
    // Platform-specific - TikTok
    if (filters.minTiktokViews !== undefined)
      params.set('minTiktokViews', String(filters.minTiktokViews))
    if (filters.maxTiktokViews !== undefined)
      params.set('maxTiktokViews', String(filters.maxTiktokViews))
    if (filters.minTiktokSaves !== undefined)
      params.set('minTiktokSaves', String(filters.minTiktokSaves))
    if (filters.maxTiktokSaves !== undefined)
      params.set('maxTiktokSaves', String(filters.maxTiktokSaves))
    if (filters.minTiktokShares !== undefined)
      params.set('minTiktokShares', String(filters.minTiktokShares))
    if (filters.maxTiktokShares !== undefined)
      params.set('maxTiktokShares', String(filters.maxTiktokShares))
    // Platform-specific - YouTube
    if (filters.minYoutubeViews !== undefined)
      params.set('minYoutubeViews', String(filters.minYoutubeViews))
    if (filters.maxYoutubeViews !== undefined)
      params.set('maxYoutubeViews', String(filters.maxYoutubeViews))

    return params.toString()
  }, [filters])

  return {
    filters,
    setFilters,
    setFilter,
    clearFilters,
    setPage,
    setPageSize,
    activeFilterCount,
    queryString,
    isDefaultFilters: activeFilterCount === 0,
  }
}
