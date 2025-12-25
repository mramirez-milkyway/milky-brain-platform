'use client'

import { FilterChip } from './FilterChip'

interface SavesFilterProps {
  minSaves?: number
  maxSaves?: number
  onMinSavesChange: (value: number | undefined) => void
  onMaxSavesChange: (value: number | undefined) => void
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

const SavesIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
)

export function SavesFilter({
  minSaves,
  maxSaves,
  onMinSavesChange,
  onMaxSavesChange,
}: SavesFilterProps) {
  const isActive = minSaves !== undefined || maxSaves !== undefined

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseNumberInput(e.target.value)
    onMinSavesChange(value)
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseNumberInput(e.target.value)
    onMaxSavesChange(value)
  }

  return (
    <FilterChip label="Saves" icon={<SavesIcon />} isActive={isActive}>
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Saves</h4>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="From"
            defaultValue={minSaves !== undefined ? formatNumber(minSaves) : ''}
            onBlur={handleMinChange}
            onKeyDown={(e) => e.key === 'Enter' && handleMinChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400">-</span>
          <input
            type="text"
            placeholder="To"
            defaultValue={maxSaves !== undefined ? formatNumber(maxSaves) : ''}
            onBlur={handleMaxChange}
            onKeyDown={(e) => e.key === 'Enter' && handleMaxChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </FilterChip>
  )
}
