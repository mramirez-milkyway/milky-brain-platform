'use client'

import { FilterChip } from './FilterChip'

interface FollowersCredibilityFilterProps {
  minCredibility?: number
  maxCredibility?: number
  onMinCredibilityChange: (value: number | undefined) => void
  onMaxCredibilityChange: (value: number | undefined) => void
}

// Parse percentage input
function parsePercentInput(value: string): number | undefined {
  if (!value) return undefined
  const cleaned = value.replace(/%/g, '').trim()
  const num = parseFloat(cleaned)
  if (isNaN(num)) return undefined
  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, num))
}

const CredibilityIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
)

export function FollowersCredibilityFilter({
  minCredibility,
  maxCredibility,
  onMinCredibilityChange,
  onMaxCredibilityChange,
}: FollowersCredibilityFilterProps) {
  const isActive = minCredibility !== undefined || maxCredibility !== undefined

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parsePercentInput(e.target.value)
    onMinCredibilityChange(value)
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parsePercentInput(e.target.value)
    onMaxCredibilityChange(value)
  }

  return (
    <FilterChip label="Followers Credibility" icon={<CredibilityIcon />} isActive={isActive}>
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Followers Credibility
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Percentage of real, authentic followers (0-100%)
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Min %"
            defaultValue={minCredibility !== undefined ? `${minCredibility}` : ''}
            onBlur={handleMinChange}
            onKeyDown={(e) =>
              e.key === 'Enter' &&
              handleMinChange(e as unknown as React.ChangeEvent<HTMLInputElement>)
            }
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400">-</span>
          <input
            type="text"
            placeholder="Max %"
            defaultValue={maxCredibility !== undefined ? `${maxCredibility}` : ''}
            onBlur={handleMaxChange}
            onKeyDown={(e) =>
              e.key === 'Enter' &&
              handleMaxChange(e as unknown as React.ChangeEvent<HTMLInputElement>)
            }
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </FilterChip>
  )
}
