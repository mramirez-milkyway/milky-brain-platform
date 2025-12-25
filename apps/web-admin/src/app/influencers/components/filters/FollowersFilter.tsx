'use client'

import { FilterChip } from './FilterChip'
import { FollowersIcon } from './constants'

interface FollowersFilterProps {
  minFollowers?: number
  maxFollowers?: number
  onMinFollowersChange: (value: number | undefined) => void
  onMaxFollowersChange: (value: number | undefined) => void
}

// Format number for display in input placeholder
function formatNumber(num: number): string {
  if (num >= 1000000) return `${num / 1000000}M`
  if (num >= 1000) return `${num / 1000}K`
  return num.toString()
}

// Parse input value (handles K/M suffixes)
function parseFollowerInput(value: string): number | undefined {
  if (!value) return undefined
  const cleaned = value.toUpperCase().replace(/,/g, '')

  if (cleaned.endsWith('M')) {
    const num = parseFloat(cleaned.slice(0, -1))
    return isNaN(num) ? undefined : Math.round(num * 1000000)
  }
  if (cleaned.endsWith('K')) {
    const num = parseFloat(cleaned.slice(0, -1))
    return isNaN(num) ? undefined : Math.round(num * 1000)
  }

  const num = parseInt(cleaned, 10)
  return isNaN(num) ? undefined : num
}

export function FollowersFilter({
  minFollowers,
  maxFollowers,
  onMinFollowersChange,
  onMaxFollowersChange,
}: FollowersFilterProps) {
  const isActive = minFollowers !== undefined || maxFollowers !== undefined

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFollowerInput(e.target.value)
    onMinFollowersChange(value)
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFollowerInput(e.target.value)
    onMaxFollowersChange(value)
  }

  return (
    <FilterChip label="Followers" icon={<FollowersIcon />} isActive={isActive}>
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Followers</h4>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="100"
            defaultValue={minFollowers !== undefined ? formatNumber(minFollowers) : ''}
            onBlur={handleMinChange}
            onKeyDown={(e) => e.key === 'Enter' && handleMinChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400">-</span>
          <input
            type="text"
            placeholder="1,000"
            defaultValue={maxFollowers !== undefined ? formatNumber(maxFollowers) : ''}
            onBlur={handleMaxChange}
            onKeyDown={(e) => e.key === 'Enter' && handleMaxChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Supports K (thousands) and M (millions), e.g. 10K, 1M
        </p>
      </div>
    </FilterChip>
  )
}
