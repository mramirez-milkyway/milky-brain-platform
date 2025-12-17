'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useInfluencerFilters, Platform, Gender } from '../hooks/useInfluencerFilters'
import Button from '@/components/ui/button/Button'

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

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'organization', label: 'Organization' },
]

// Country code to flag emoji mapping
const getCountryFlag = (code: string): string => {
  const codePoints = code
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'ES', label: 'Spain' },
  { value: 'MX', label: 'Mexico' },
  { value: 'AR', label: 'Argentina' },
  { value: 'CO', label: 'Colombia' },
  { value: 'BR', label: 'Brazil' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'FR', label: 'France' },
  { value: 'DE', label: 'Germany' },
  { value: 'IT', label: 'Italy' },
  { value: 'PT', label: 'Portugal' },
  { value: 'CL', label: 'Chile' },
  { value: 'PE', label: 'Peru' },
  { value: 'VE', label: 'Venezuela' },
  { value: 'EC', label: 'Ecuador' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'IN', label: 'India' },
]

// Category icons (using simple emoji for now, can be replaced with SVGs)
const CATEGORY_ICONS: Record<string, string> = {
  beauty: '💄',
  fashion: '👗',
  gaming: '🎮',
  food: '🍔',
  travel: '✈️',
  fitness: '💪',
  tech: '💻',
  music: '🎵',
  comedy: '😂',
  lifestyle: '🏠',
  education: '📚',
  sports: '⚽',
  art: '🎨',
  photography: '📷',
  parenting: '👶',
  automotive: '🚗',
  pets: '🐶',
  health: '🏥',
  finance: '💰',
  diy: '🔨',
  books: '📖',
  movies: '🎬',
  nature: '🌿',
  spirituality: '🧘',
}

const CATEGORIES = Object.keys(CATEGORY_ICONS)

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
]

// MultiSelect dropdown component
interface MultiSelectOption {
  value: string
  label: string
  icon?: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder: string
  maxSelected?: number
  className?: string
}

function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  maxSelected,
  className = '',
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else if (!maxSelected || selected.length < maxSelected) {
      onChange([...selected, value])
    }
  }

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selected.filter((v) => v !== value))
  }

  const selectedLabels = selected
    .map((v) => options.find((o) => o.value === v))
    .filter(Boolean) as MultiSelectOption[]

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[34px] px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer flex items-center flex-wrap gap-1"
      >
        {selectedLabels.length === 0 ? (
          <span className="text-gray-400">{placeholder}</span>
        ) : (
          selectedLabels.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
            >
              {option.icon && <span>{option.icon}</span>}
              {option.label}
              <button
                onClick={(e) => handleRemove(option.value, e)}
                className="hover:text-blue-600 ml-1"
              >
                &times;
              </button>
            </span>
          ))
        )}
        <svg
          className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] max-h-64 overflow-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option.value)
                const isDisabled = !isSelected && maxSelected && selected.length >= maxSelected
                return (
                  <div
                    key={option.value}
                    onClick={() => !isDisabled && handleToggle(option.value)}
                    className={`px-3 py-2 text-sm flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                        : isDisabled
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      disabled={isDisabled}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    {option.icon && <span className="text-base">{option.icon}</span>}
                    <span>{option.label}</span>
                  </div>
                )
              })
            )}
          </div>
          {maxSelected && (
            <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700">
              {selected.length}/{maxSelected} selected
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface FilterBarProps {
  className?: string
}

// Prepare country options with flags
const countryOptions: MultiSelectOption[] = COUNTRIES.map((c) => ({
  value: c.value,
  label: c.label,
  icon: getCountryFlag(c.value),
}))

// Prepare category options with icons
const categoryOptions: MultiSelectOption[] = CATEGORIES.map((cat) => ({
  value: cat,
  label: cat.charAt(0).toUpperCase() + cat.slice(1),
  icon: CATEGORY_ICONS[cat],
}))

export function FilterBar({ className = '' }: FilterBarProps) {
  const { filters, setFilter, setFilters, clearFilters, activeFilterCount } = useInfluencerFilters()
  const [isExpanded, setIsExpanded] = useState(false)
  const [handleInput, setHandleInput] = useState(filters.handle ?? '')

  // Debounced handle search
  const handleHandleChange = useCallback(
    (value: string) => {
      setHandleInput(value)
      // Debounce the actual filter update
      const timeoutId = setTimeout(() => {
        setFilter('handle', value || undefined)
      }, 300)
      return () => clearTimeout(timeoutId)
    },
    [setFilter]
  )

  // Country multi-select handler
  const handleCountryChange = useCallback(
    (countries: string[]) => {
      setFilter('country', countries.length > 0 ? countries : undefined)
    },
    [setFilter]
  )

  // Categories multi-select handler
  const handleCategoryChange = useCallback(
    (categories: string[]) => {
      setFilter('categories', categories.length > 0 ? categories : undefined)
    },
    [setFilter]
  )

  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}
    >
      {/* Main Filter Row */}
      <div className="p-4 space-y-4">
        {/* Top Row: Platform + Handle + Quick Actions */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Platform Selector (Required) */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Platform</label>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              {PLATFORMS.map((p) => {
                const Icon = PlatformIcons[p.value]
                return (
                  <button
                    key={p.value}
                    onClick={() => setFilter('platform', p.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                      filters.platform === p.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Handle Search */}
          <div className="flex-1 min-w-[200px] max-w-[300px]">
            <input
              type="text"
              placeholder="Search by handle..."
              value={handleInput}
              onChange={(e) => handleHandleChange(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Blacklist Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.excludeBlacklisted}
              onChange={(e) => setFilter('excludeBlacklisted', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Exclude Blacklisted</span>
          </label>

          {/* Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            {isExpanded ? 'Less Filters' : 'More Filters'}
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <Button
              onClick={clearFilters}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Clear All ({activeFilterCount})
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          {/* Demographics Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Demographics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Gender */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Gender
                </label>
                <select
                  value={filters.gender ?? ''}
                  onChange={(e) => setFilter('gender', (e.target.value as Gender) || undefined)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any</option>
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Language
                </label>
                <select
                  value={filters.language ?? ''}
                  onChange={(e) => setFilter('language', e.target.value || undefined)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any</option>
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Countries */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Countries (max 5)
                </label>
                <MultiSelect
                  options={countryOptions}
                  selected={filters.country ?? []}
                  onChange={handleCountryChange}
                  placeholder="Select countries..."
                  maxSelected={5}
                />
              </div>
            </div>
          </div>

          {/* Performance Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Followers Range */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Followers (Min)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 10000"
                  value={filters.minFollowers ?? ''}
                  onChange={(e) =>
                    setFilter('minFollowers', e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Followers (Max)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1000000"
                  value={filters.maxFollowers ?? ''}
                  onChange={(e) =>
                    setFilter('maxFollowers', e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Engagement Rate */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Min Engagement Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 3.5"
                  value={filters.minEngagementRate ?? ''}
                  onChange={(e) =>
                    setFilter(
                      'minEngagementRate',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Credibility */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Min Credibility (%)
                </label>
                <input
                  type="number"
                  step="1"
                  placeholder="e.g. 70"
                  value={filters.minCredibility ?? ''}
                  onChange={(e) =>
                    setFilter('minCredibility', e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Platform-specific metrics */}
            {filters.platform === 'instagram' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Min Reels Plays
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 100000"
                    value={filters.minReelsPlays ?? ''}
                    onChange={(e) =>
                      setFilter(
                        'minReelsPlays',
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Max Reels Plays
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 500000"
                    value={filters.maxReelsPlays ?? ''}
                    onChange={(e) =>
                      setFilter(
                        'maxReelsPlays',
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {filters.platform === 'tiktok' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Min TikTok Views
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={filters.minTiktokViews ?? ''}
                    onChange={(e) =>
                      setFilter(
                        'minTiktokViews',
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Max TikTok Views
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1000000"
                    value={filters.maxTiktokViews ?? ''}
                    onChange={(e) =>
                      setFilter(
                        'maxTiktokViews',
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Internal Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Internal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Internal Rating */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Min Internal Rating
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  placeholder="e.g. 80"
                  value={filters.minInternalRating ?? ''}
                  onChange={(e) =>
                    setFilter(
                      'minInternalRating',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Has Worked With Us */}
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasWorkedWithUs === true}
                    onChange={(e) =>
                      setFilter('hasWorkedWithUs', e.target.checked ? true : undefined)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Has Worked With Us
                  </span>
                </label>
              </div>
            </div>

            {/* Categories */}
            <div className="max-w-xs">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Categories
              </label>
              <MultiSelect
                options={categoryOptions}
                selected={filters.categories ?? []}
                onChange={handleCategoryChange}
                placeholder="Select categories..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Indicator */}
      {activeFilterCount > 0 && !isExpanded && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {filters.country && filters.country.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              Countries: {filters.country.join(', ')}
              <button
                onClick={() => setFilter('country', undefined)}
                className="hover:text-blue-600"
              >
                &times;
              </button>
            </span>
          )}
          {filters.gender && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              Gender: {filters.gender}
              <button
                onClick={() => setFilter('gender', undefined)}
                className="hover:text-blue-600"
              >
                &times;
              </button>
            </span>
          )}
          {(filters.minFollowers !== undefined || filters.maxFollowers !== undefined) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              Followers: {filters.minFollowers ?? 0} - {filters.maxFollowers ?? '∞'}
              <button
                onClick={() => setFilters({ minFollowers: undefined, maxFollowers: undefined })}
                className="hover:text-blue-600"
              >
                &times;
              </button>
            </span>
          )}
          {filters.categories && filters.categories.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              Categories: {filters.categories.slice(0, 2).join(', ')}
              {filters.categories.length > 2 && ` +${filters.categories.length - 2}`}
              <button
                onClick={() => setFilter('categories', undefined)}
                className="hover:text-blue-600"
              >
                &times;
              </button>
            </span>
          )}
          {filters.minInternalRating !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              Rating: &gt;={filters.minInternalRating}
              <button
                onClick={() => setFilter('minInternalRating', undefined)}
                className="hover:text-blue-600"
              >
                &times;
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
