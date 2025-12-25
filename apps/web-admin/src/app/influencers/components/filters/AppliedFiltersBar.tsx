'use client'

import { InfluencerFilters } from '../../hooks/useInfluencerFilters'
import { COUNTRIES, LANGUAGES, getCountryFlag } from './constants'

interface AppliedFiltersBarProps {
  filters: InfluencerFilters
  onRemoveFilter: (key: keyof InfluencerFilters, value?: string) => void
  onClearAll: () => void
}

// Format number for display
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

function getCountryLabel(code: string): string {
  return COUNTRIES.find((c) => c.value === code)?.label || code
}

function getLanguageLabel(code: string): string {
  return LANGUAGES.find((l) => l.value === code)?.label || code
}

interface FilterTagProps {
  label: string
  value: string
  onRemove: () => void
}

function FilterTag({ label, value, onRemove }: FilterTagProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md">
      <span className="font-medium text-gray-600 dark:text-gray-400">{label}:</span>
      <span>{value}</span>
      <button
        onClick={onRemove}
        className="ml-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </span>
  )
}

export function AppliedFiltersBar({ filters, onRemoveFilter, onClearAll }: AppliedFiltersBarProps) {
  const filterTags: { label: string; value: string; onRemove: () => void }[] = []

  // Location - Audience
  if (filters.audienceCountry && filters.audienceCountry.length > 0) {
    filters.audienceCountry.forEach((code) => {
      filterTags.push({
        label: 'Location Aud',
        value: `${getCountryFlag(code)} ${getCountryLabel(code)}${filters.audienceCountryMinPercent ? ` > ${filters.audienceCountryMinPercent}%` : ''}`,
        onRemove: () => {
          const newCountries = filters.audienceCountry?.filter((c) => c !== code)
          onRemoveFilter(
            'audienceCountry',
            newCountries?.length ? newCountries.join(',') : undefined
          )
        },
      })
    })
  }

  // Location - Influencer
  if (filters.country && filters.country.length > 0) {
    filters.country.forEach((code) => {
      filterTags.push({
        label: 'Location Inf',
        value: `${getCountryFlag(code)} ${getCountryLabel(code)}`,
        onRemove: () => {
          const newCountries = filters.country?.filter((c) => c !== code)
          onRemoveFilter('country', newCountries?.length ? newCountries.join(',') : undefined)
        },
      })
    })
  }

  // Language - Audience
  if (filters.audienceLanguage) {
    filterTags.push({
      label: 'Language Aud',
      value: `${getLanguageLabel(filters.audienceLanguage)}${filters.audienceLanguageMinPercent ? ` > ${filters.audienceLanguageMinPercent}%` : ''}`,
      onRemove: () => onRemoveFilter('audienceLanguage'),
    })
  }

  // Language - Influencer
  if (filters.language) {
    filterTags.push({
      label: 'Language Inf',
      value: getLanguageLabel(filters.language),
      onRemove: () => onRemoveFilter('language'),
    })
  }

  // Gender - Audience
  if (filters.audienceGender) {
    filterTags.push({
      label: 'Gender Aud',
      value: `${filters.audienceGender.charAt(0).toUpperCase() + filters.audienceGender.slice(1)}${filters.audienceGenderMinPercent ? ` > ${filters.audienceGenderMinPercent}%` : ''}`,
      onRemove: () => onRemoveFilter('audienceGender'),
    })
  }

  // Gender - Influencer
  if (filters.gender) {
    filterTags.push({
      label: 'Gender Inf',
      value: filters.gender.charAt(0).toUpperCase() + filters.gender.slice(1),
      onRemove: () => onRemoveFilter('gender'),
    })
  }

  // Age - Audience
  if (filters.audienceMinAge !== undefined || filters.audienceMaxAge !== undefined) {
    const minAge = filters.audienceMinAge ?? 13
    const maxAge = filters.audienceMaxAge ?? '65+'
    filterTags.push({
      label: 'Age Aud',
      value: `${minAge}-${maxAge} y.o.${filters.audienceAgeMinPercent ? ` > ${filters.audienceAgeMinPercent}%` : ''}`,
      onRemove: () => onRemoveFilter('audienceMinAge'),
    })
  }

  // Age - Influencer
  if (filters.minAge !== undefined || filters.maxAge !== undefined) {
    const minAge = filters.minAge ?? 18
    const maxAge = filters.maxAge ?? '65+'
    filterTags.push({
      label: 'Age Inf',
      value: `${minAge}-${maxAge} y.o.`,
      onRemove: () => onRemoveFilter('minAge'),
    })
  }

  // Followers
  if (filters.minFollowers !== undefined || filters.maxFollowers !== undefined) {
    const min = filters.minFollowers !== undefined ? formatNumber(filters.minFollowers) : '0'
    const max = filters.maxFollowers !== undefined ? formatNumber(filters.maxFollowers) : '∞'
    filterTags.push({
      label: 'Followers',
      value: `${min} - ${max}`,
      onRemove: () => onRemoveFilter('minFollowers'),
    })
  }

  // Engagements
  if (filters.minEngagements !== undefined || filters.maxEngagements !== undefined) {
    const min = filters.minEngagements !== undefined ? formatNumber(filters.minEngagements) : '0'
    const max = filters.maxEngagements !== undefined ? formatNumber(filters.maxEngagements) : '∞'
    filterTags.push({
      label: 'Engagements',
      value: `${min}-${max}`,
      onRemove: () => onRemoveFilter('minEngagements'),
    })
  }

  // Engagement Rate
  if (filters.minEngagementRate !== undefined) {
    filterTags.push({
      label: 'Engagement Rate',
      value: `≥ ${filters.minEngagementRate}%`,
      onRemove: () => onRemoveFilter('minEngagementRate'),
    })
  }

  // Reels Plays (Instagram)
  if (filters.minReelsPlays !== undefined || filters.maxReelsPlays !== undefined) {
    const min = filters.minReelsPlays !== undefined ? formatNumber(filters.minReelsPlays) : '0'
    const max = filters.maxReelsPlays !== undefined ? formatNumber(filters.maxReelsPlays) : '∞'
    filterTags.push({
      label: 'Reels Plays',
      value: `${min} - ${max}`,
      onRemove: () => onRemoveFilter('minReelsPlays'),
    })
  }

  // TikTok Views
  if (filters.minTiktokViews !== undefined || filters.maxTiktokViews !== undefined) {
    const min = filters.minTiktokViews !== undefined ? formatNumber(filters.minTiktokViews) : '0'
    const max = filters.maxTiktokViews !== undefined ? formatNumber(filters.maxTiktokViews) : '∞'
    filterTags.push({
      label: 'Views',
      value: `${min} - ${max}`,
      onRemove: () => onRemoveFilter('minTiktokViews'),
    })
  }

  // YouTube Views
  if (filters.minYoutubeViews !== undefined || filters.maxYoutubeViews !== undefined) {
    const min = filters.minYoutubeViews !== undefined ? formatNumber(filters.minYoutubeViews) : '0'
    const max = filters.maxYoutubeViews !== undefined ? formatNumber(filters.maxYoutubeViews) : '∞'
    filterTags.push({
      label: 'Views',
      value: `${min} - ${max}`,
      onRemove: () => onRemoveFilter('minYoutubeViews'),
    })
  }

  // Followers Credibility (Instagram)
  if (
    filters.minFollowersCredibility !== undefined ||
    filters.maxFollowersCredibility !== undefined
  ) {
    const min =
      filters.minFollowersCredibility !== undefined ? `${filters.minFollowersCredibility}%` : '0%'
    const max =
      filters.maxFollowersCredibility !== undefined ? `${filters.maxFollowersCredibility}%` : '100%'
    filterTags.push({
      label: 'Credibility',
      value: `${min} - ${max}`,
      onRemove: () => onRemoveFilter('minFollowersCredibility'),
    })
  }

  // TikTok Saves
  if (filters.minTiktokSaves !== undefined || filters.maxTiktokSaves !== undefined) {
    const min = filters.minTiktokSaves !== undefined ? formatNumber(filters.minTiktokSaves) : '0'
    const max = filters.maxTiktokSaves !== undefined ? formatNumber(filters.maxTiktokSaves) : '∞'
    filterTags.push({
      label: 'Saves',
      value: `${min} - ${max}`,
      onRemove: () => onRemoveFilter('minTiktokSaves'),
    })
  }

  // TikTok Shares
  if (filters.minTiktokShares !== undefined || filters.maxTiktokShares !== undefined) {
    const min = filters.minTiktokShares !== undefined ? formatNumber(filters.minTiktokShares) : '0'
    const max = filters.maxTiktokShares !== undefined ? formatNumber(filters.maxTiktokShares) : '∞'
    filterTags.push({
      label: 'Shares',
      value: `${min} - ${max}`,
      onRemove: () => onRemoveFilter('minTiktokShares'),
    })
  }

  // Handle search
  if (filters.handle) {
    filterTags.push({
      label: 'Handle',
      value: `@${filters.handle}`,
      onRemove: () => onRemoveFilter('handle'),
    })
  }

  // Categories
  if (filters.categories && filters.categories.length > 0) {
    filterTags.push({
      label: 'Categories',
      value: filters.categories.join(', '),
      onRemove: () => onRemoveFilter('categories'),
    })
  }

  // Internal Rating
  if (filters.minInternalRating !== undefined) {
    filterTags.push({
      label: 'Min Rating',
      value: `≥ ${filters.minInternalRating}`,
      onRemove: () => onRemoveFilter('minInternalRating'),
    })
  }

  // Has Worked With Us
  if (filters.hasWorkedWithUs) {
    filterTags.push({
      label: 'Internal',
      value: 'Has worked with us',
      onRemove: () => onRemoveFilter('hasWorkedWithUs'),
    })
  }

  // No active filters
  if (filterTags.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filters:</span>
      {filterTags.map((tag, idx) => (
        <FilterTag key={`${tag.label}-${idx}`} {...tag} />
      ))}
      <button
        onClick={onClearAll}
        className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
      >
        Clear all
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )
}
