'use client'

import { FilterChip } from './FilterChip'
import { ReelsIcon } from './constants'

interface ReelsPlaysFilterProps {
  minReelsPlays?: number
  maxReelsPlays?: number
  onMinReelsPlaysChange: (value: number | undefined) => void
  onMaxReelsPlaysChange: (value: number | undefined) => void
}

// Parse input value (handles K/M suffixes)
function parseNumberInput(value: string): number | undefined {
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

// Format number for display
function formatNumber(num: number): string {
  if (num >= 1000000) return `${num / 1000000}M`
  if (num >= 1000) return `${num / 1000}K`
  return num.toString()
}

export function ReelsPlaysFilter({
  minReelsPlays,
  maxReelsPlays,
  onMinReelsPlaysChange,
  onMaxReelsPlaysChange,
}: ReelsPlaysFilterProps) {
  const isActive = minReelsPlays !== undefined || maxReelsPlays !== undefined

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseNumberInput(e.target.value)
    onMinReelsPlaysChange(value)
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseNumberInput(e.target.value)
    onMaxReelsPlaysChange(value)
  }

  return (
    <FilterChip label="Reels Plays" icon={<ReelsIcon />} isActive={isActive}>
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Reels Plays</h4>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="From"
            defaultValue={minReelsPlays !== undefined ? formatNumber(minReelsPlays) : ''}
            onBlur={handleMinChange}
            onKeyDown={(e) => e.key === 'Enter' && handleMinChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400">-</span>
          <input
            type="text"
            placeholder="To"
            defaultValue={maxReelsPlays !== undefined ? formatNumber(maxReelsPlays) : ''}
            onBlur={handleMaxChange}
            onKeyDown={(e) => e.key === 'Enter' && handleMaxChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </FilterChip>
  )
}
