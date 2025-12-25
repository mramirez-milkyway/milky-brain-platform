'use client'

import { FilterChip } from './FilterChip'
import { GenderIcon, PERCENTAGE_THRESHOLDS } from './constants'
import { Gender, AudienceGender } from '../../hooks/useInfluencerFilters'

interface GenderFilterProps {
  // Audience gender
  audienceGender?: AudienceGender
  audienceGenderMinPercent?: number
  onAudienceGenderChange: (gender: AudienceGender | undefined) => void
  onAudienceGenderMinPercentChange: (percent: number | undefined) => void
  // Influencer gender
  gender?: Gender
  onGenderChange: (gender: Gender | undefined) => void
}

const AUDIENCE_GENDERS: { value: AudienceGender | 'any'; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

const INFLUENCER_GENDERS: { value: Gender | 'any'; label: string; tooltip?: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'organization', label: 'Organization', tooltip: 'Business or brand accounts' },
]

export function GenderFilter({
  audienceGender,
  audienceGenderMinPercent,
  onAudienceGenderChange,
  onAudienceGenderMinPercentChange,
  gender,
  onGenderChange,
}: GenderFilterProps) {
  const isActive = audienceGender !== undefined || gender !== undefined

  return (
    <FilterChip label="Gender" icon={<GenderIcon />} isActive={isActive}>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-6">
          {/* Audience Column */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Audience</h4>
            <div className="space-y-2">
              {AUDIENCE_GENDERS.map((g) => (
                <label key={g.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="audienceGender"
                    checked={
                      g.value === 'any' ? audienceGender === undefined : audienceGender === g.value
                    }
                    onChange={() =>
                      onAudienceGenderChange(g.value === 'any' ? undefined : (g.value as AudienceGender))
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{g.label}</span>
                </label>
              ))}
            </div>

            {/* Percentage Threshold - only show when a gender is selected */}
            {audienceGender && (
              <div className="mt-3">
                <select
                  value={audienceGenderMinPercent || 50}
                  onChange={(e) => onAudienceGenderMinPercentChange(Number(e.target.value))}
                  className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {PERCENTAGE_THRESHOLDS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Influencer Column */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Influencer</h4>
            <div className="space-y-2">
              {INFLUENCER_GENDERS.map((g) => (
                <label key={g.value} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="influencerGender"
                    checked={g.value === 'any' ? gender === undefined : gender === g.value}
                    onChange={() =>
                      onGenderChange(g.value === 'any' ? undefined : (g.value as Gender))
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{g.label}</span>
                  {g.tooltip && (
                    <span className="text-gray-400 dark:text-gray-500" title={g.tooltip}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FilterChip>
  )
}
