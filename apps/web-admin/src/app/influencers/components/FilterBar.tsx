'use client'

import { useState, useCallback } from 'react'
import { useInfluencerFilters, Platform, InfluencerFilters } from '../hooks/useInfluencerFilters'
import {
  LocationFilter,
  GenderFilter,
  LanguageFilter,
  AgeFilter,
  FollowersFilter,
  EngagementsFilter,
  ReelsPlaysFilter,
  FollowersCredibilityFilter,
  ViewsFilter,
  SavesFilter,
  SharesFilter,
  AppliedFiltersBar,
} from './filters'

// Platform icon components
const InstagramIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
)

const TikTokIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
)

const YouTubeIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
)

// Platform icon map
const PlatformIcons: Record<Platform, React.FC<{ className?: string }>> = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  youtube: YouTubeIcon,
}

// Constants for filter options
const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
]

interface FilterBarProps {
  className?: string
}

export function FilterBar({ className = '' }: FilterBarProps) {
  const { filters, setFilter, setFilters, clearFilters, activeFilterCount } = useInfluencerFilters()
  const [handleInput, setHandleInput] = useState(filters.handle ?? '')

  // Debounced handle search
  const handleHandleChange = useCallback(
    (value: string) => {
      setHandleInput(value)
      const timeoutId = setTimeout(() => {
        setFilter('handle', value || undefined)
      }, 300)
      return () => clearTimeout(timeoutId)
    },
    [setFilter]
  )

  // Handle removing a single filter or multiple related filters
  const handleRemoveFilter = useCallback(
    (key: keyof InfluencerFilters, value?: string) => {
      if (key === 'audienceCountry' || key === 'country') {
        // Handle array filters
        if (value) {
          const newValues = value.split(',').filter(Boolean)
          setFilter(key, newValues.length > 0 ? newValues : undefined)
        } else {
          setFilter(key, undefined)
        }
      } else {
        // Group related filters (min/max pairs, age with percent, etc.)
        const relatedFilters: Partial<InfluencerFilters> = { [key]: undefined }

        // Handle min/max pairs - when removing one, remove the other
        const minMaxPairs: Record<string, string> = {
          minFollowers: 'maxFollowers',
          maxFollowers: 'minFollowers',
          minEngagements: 'maxEngagements',
          maxEngagements: 'minEngagements',
          minReelsPlays: 'maxReelsPlays',
          maxReelsPlays: 'minReelsPlays',
          minTiktokViews: 'maxTiktokViews',
          maxTiktokViews: 'minTiktokViews',
          minTiktokSaves: 'maxTiktokSaves',
          maxTiktokSaves: 'minTiktokSaves',
          minTiktokShares: 'maxTiktokShares',
          maxTiktokShares: 'minTiktokShares',
          minYoutubeViews: 'maxYoutubeViews',
          maxYoutubeViews: 'minYoutubeViews',
          minFollowersCredibility: 'maxFollowersCredibility',
          maxFollowersCredibility: 'minFollowersCredibility',
          minAge: 'maxAge',
          maxAge: 'minAge',
        }

        // Handle audience filters with percent - remove percent when removing main filter
        const audienceWithPercent: Record<string, string[]> = {
          audienceMinAge: ['audienceMaxAge', 'audienceAgeMinPercent'],
          audienceMaxAge: ['audienceMinAge', 'audienceAgeMinPercent'],
          audienceAgeMinPercent: ['audienceMinAge', 'audienceMaxAge'],
          audienceGender: ['audienceGenderMinPercent'],
          audienceGenderMinPercent: ['audienceGender'],
          audienceLanguage: ['audienceLanguageMinPercent'],
          audienceLanguageMinPercent: ['audienceLanguage'],
        }

        if (minMaxPairs[key]) {
          relatedFilters[minMaxPairs[key] as keyof InfluencerFilters] = undefined
        }

        if (audienceWithPercent[key]) {
          audienceWithPercent[key].forEach((relatedKey) => {
            relatedFilters[relatedKey as keyof InfluencerFilters] = undefined
          })
        }

        setFilters(relatedFilters)
      }
    },
    [setFilter, setFilters]
  )

  // Get platform-specific filters
  const renderPlatformSpecificFilters = () => {
    switch (filters.platform) {
      case 'instagram':
        return (
          <>
            <ReelsPlaysFilter
              minReelsPlays={filters.minReelsPlays}
              maxReelsPlays={filters.maxReelsPlays}
              onMinReelsPlaysChange={(v) => setFilter('minReelsPlays', v)}
              onMaxReelsPlaysChange={(v) => setFilter('maxReelsPlays', v)}
            />
            <FollowersCredibilityFilter
              minCredibility={filters.minFollowersCredibility}
              maxCredibility={filters.maxFollowersCredibility}
              onMinCredibilityChange={(v) => setFilter('minFollowersCredibility', v)}
              onMaxCredibilityChange={(v) => setFilter('maxFollowersCredibility', v)}
            />
          </>
        )
      case 'tiktok':
        return (
          <>
            <ViewsFilter
              platform="tiktok"
              minViews={filters.minTiktokViews}
              maxViews={filters.maxTiktokViews}
              onMinViewsChange={(v) => setFilter('minTiktokViews', v)}
              onMaxViewsChange={(v) => setFilter('maxTiktokViews', v)}
            />
            <SavesFilter
              minSaves={filters.minTiktokSaves}
              maxSaves={filters.maxTiktokSaves}
              onMinSavesChange={(v) => setFilter('minTiktokSaves', v)}
              onMaxSavesChange={(v) => setFilter('maxTiktokSaves', v)}
            />
            <SharesFilter
              minShares={filters.minTiktokShares}
              maxShares={filters.maxTiktokShares}
              onMinSharesChange={(v) => setFilter('minTiktokShares', v)}
              onMaxSharesChange={(v) => setFilter('maxTiktokShares', v)}
            />
          </>
        )
      case 'youtube':
        return (
          <ViewsFilter
            platform="youtube"
            minViews={filters.minYoutubeViews}
            maxViews={filters.maxYoutubeViews}
            onMinViewsChange={(v) => setFilter('minYoutubeViews', v)}
            onMaxViewsChange={(v) => setFilter('maxYoutubeViews', v)}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Bar: Platform + Handle Search */}
      <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        {/* Platform Selector */}
        <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
          {PLATFORMS.map((p) => {
            const Icon = PlatformIcons[p.value]
            return (
              <button
                key={p.value}
                onClick={() => setFilter('platform', p.value)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                  filters.platform === p.value
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Handle Search */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <span className="text-gray-400">@</span>
          <input
            type="text"
            placeholder="Influencer profile URL, user ID or @handle"
            value={handleInput}
            onChange={(e) => handleHandleChange(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0"
          />
        </div>

        {/* Start Over Button */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            START OVER
          </button>
        )}
      </div>

      {/* Filter Title */}
      <div className="text-sm font-medium text-gray-900 dark:text-white">
        Narrow your discovered influencers...
      </div>

      {/* Demographics Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Demographics
        </h3>
        <div className="flex flex-wrap gap-2">
          <LocationFilter
            audienceCountry={filters.audienceCountry}
            audienceCountryMinPercent={filters.audienceCountryMinPercent}
            onAudienceCountryChange={(v) => setFilter('audienceCountry', v)}
            onAudienceCountryMinPercentChange={(v) => setFilter('audienceCountryMinPercent', v)}
            country={filters.country}
            onCountryChange={(v) => setFilter('country', v)}
          />
          <GenderFilter
            audienceGender={filters.audienceGender}
            audienceGenderMinPercent={filters.audienceGenderMinPercent}
            onAudienceGenderChange={(v) => setFilter('audienceGender', v)}
            onAudienceGenderMinPercentChange={(v) => setFilter('audienceGenderMinPercent', v)}
            gender={filters.gender}
            onGenderChange={(v) => setFilter('gender', v)}
          />
          <LanguageFilter
            audienceLanguage={filters.audienceLanguage}
            audienceLanguageMinPercent={filters.audienceLanguageMinPercent}
            onAudienceLanguageChange={(v) => setFilter('audienceLanguage', v)}
            onAudienceLanguageMinPercentChange={(v) => setFilter('audienceLanguageMinPercent', v)}
            language={filters.language}
            onLanguageChange={(v) => setFilter('language', v)}
          />
          <AgeFilter
            audienceMinAge={filters.audienceMinAge}
            audienceMaxAge={filters.audienceMaxAge}
            audienceAgeMinPercent={filters.audienceAgeMinPercent}
            onAudienceMinAgeChange={(v) => setFilter('audienceMinAge', v)}
            onAudienceMaxAgeChange={(v) => setFilter('audienceMaxAge', v)}
            onAudienceAgeMinPercentChange={(v) => setFilter('audienceAgeMinPercent', v)}
            minAge={filters.minAge}
            maxAge={filters.maxAge}
            onMinAgeChange={(v) => setFilter('minAge', v)}
            onMaxAgeChange={(v) => setFilter('maxAge', v)}
          />
        </div>
      </div>

      {/* Performance Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Performance
        </h3>
        <div className="flex flex-wrap gap-2">
          <FollowersFilter
            minFollowers={filters.minFollowers}
            maxFollowers={filters.maxFollowers}
            onMinFollowersChange={(v) => setFilter('minFollowers', v)}
            onMaxFollowersChange={(v) => setFilter('maxFollowers', v)}
          />
          <EngagementsFilter
            minEngagements={filters.minEngagements}
            maxEngagements={filters.maxEngagements}
            minEngagementRate={filters.minEngagementRate}
            onMinEngagementsChange={(v) => setFilter('minEngagements', v)}
            onMaxEngagementsChange={(v) => setFilter('maxEngagements', v)}
            onMinEngagementRateChange={(v) => setFilter('minEngagementRate', v)}
          />
          {renderPlatformSpecificFilters()}
        </div>
      </div>

      {/* Internal Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Internal
        </h3>
        <div className="flex flex-wrap items-center gap-4">
          {/* Exclude Blacklisted */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.excludeBlacklisted}
              onChange={(e) => setFilter('excludeBlacklisted', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Exclude blacklisted</span>
          </label>

          {/* Categories Multi-select */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">Categories:</label>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  const current = filters.categories || []
                  if (!current.includes(e.target.value)) {
                    setFilter('categories', [...current, e.target.value])
                  }
                }
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Add category...</option>
              {[
                'beauty',
                'fashion',
                'gaming',
                'food',
                'travel',
                'fitness',
                'tech',
                'music',
                'comedy',
                'lifestyle',
                'education',
                'sports',
              ].map((cat) => (
                <option key={cat} value={cat} disabled={filters.categories?.includes(cat)}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            {filters.categories && filters.categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filters.categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                  >
                    {cat}
                    <button
                      onClick={() => {
                        const updated = filters.categories?.filter((c) => c !== cat)
                        setFilter('categories', updated?.length ? updated : undefined)
                      }}
                      className="hover:text-blue-600"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Internal Rating */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">Min Rating:</label>
            <select
              value={filters.minInternalRating ?? ''}
              onChange={(e) =>
                setFilter('minInternalRating', e.target.value ? Number(e.target.value) : undefined)
              }
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Any</option>
              <option value="50">≥ 50</option>
              <option value="60">≥ 60</option>
              <option value="70">≥ 70</option>
              <option value="80">≥ 80</option>
              <option value="90">≥ 90</option>
            </select>
          </div>

          {/* Has Worked With Us */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.hasWorkedWithUs === true}
              onChange={(e) => setFilter('hasWorkedWithUs', e.target.checked ? true : undefined)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Has worked with us</span>
          </label>
        </div>
      </div>

      {/* Applied Filters Bar */}
      <AppliedFiltersBar
        filters={filters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={clearFilters}
      />
    </div>
  )
}
