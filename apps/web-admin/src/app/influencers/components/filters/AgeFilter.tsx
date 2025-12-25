'use client'

import { FilterChip } from './FilterChip'
import { AgeIcon, AGE_BRACKETS, INFLUENCER_AGE_BRACKETS, PERCENTAGE_THRESHOLDS } from './constants'

interface AgeFilterProps {
  // Audience age
  audienceMinAge?: number
  audienceMaxAge?: number
  audienceAgeMinPercent?: number
  onAudienceMinAgeChange: (age: number | undefined) => void
  onAudienceMaxAgeChange: (age: number | undefined) => void
  onAudienceAgeMinPercentChange: (percent: number | undefined) => void
  // Influencer age
  minAge?: number
  maxAge?: number
  onMinAgeChange: (age: number | undefined) => void
  onMaxAgeChange: (age: number | undefined) => void
}

export function AgeFilter({
  audienceMinAge,
  audienceMaxAge,
  audienceAgeMinPercent,
  onAudienceMinAgeChange,
  onAudienceMaxAgeChange,
  onAudienceAgeMinPercentChange,
  minAge,
  maxAge,
  onMinAgeChange,
  onMaxAgeChange,
}: AgeFilterProps) {
  const isActive =
    audienceMinAge !== undefined ||
    audienceMaxAge !== undefined ||
    minAge !== undefined ||
    maxAge !== undefined

  return (
    <FilterChip label="Age" icon={<AgeIcon />} isActive={isActive}>
      <div className="p-4">
        {/* Audience Section */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audience</h4>
          <div className="flex items-center gap-2">
            <select
              value={audienceMinAge || ''}
              onChange={(e) => onAudienceMinAgeChange(e.target.value ? Number(e.target.value) : undefined)}
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Min</option>
              {AGE_BRACKETS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            <select
              value={audienceMaxAge || ''}
              onChange={(e) => onAudienceMaxAgeChange(e.target.value ? Number(e.target.value) : undefined)}
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Max</option>
              {AGE_BRACKETS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            <select
              value={audienceAgeMinPercent || ''}
              onChange={(e) => onAudienceAgeMinPercentChange(e.target.value ? Number(e.target.value) : undefined)}
              className="w-24 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">%</option>
              {PERCENTAGE_THRESHOLDS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Influencer Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Influencer</h4>
          <div className="flex items-center gap-2">
            <select
              value={minAge || ''}
              onChange={(e) => onMinAgeChange(e.target.value ? Number(e.target.value) : undefined)}
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Min</option>
              {INFLUENCER_AGE_BRACKETS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            <select
              value={maxAge || ''}
              onChange={(e) => onMaxAgeChange(e.target.value ? Number(e.target.value) : undefined)}
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Max</option>
              {INFLUENCER_AGE_BRACKETS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </FilterChip>
  )
}
