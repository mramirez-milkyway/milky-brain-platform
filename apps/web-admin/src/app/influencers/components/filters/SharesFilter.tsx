'use client'

import { FilterChip } from './FilterChip'

interface SharesFilterProps {
  minShares?: number
  maxShares?: number
  onMinSharesChange: (value: number | undefined) => void
  onMaxSharesChange: (value: number | undefined) => void
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

const SharesIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
)

export function SharesFilter({
  minShares,
  maxShares,
  onMinSharesChange,
  onMaxSharesChange,
}: SharesFilterProps) {
  const isActive = minShares !== undefined || maxShares !== undefined

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseNumberInput(e.target.value)
    onMinSharesChange(value)
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseNumberInput(e.target.value)
    onMaxSharesChange(value)
  }

  return (
    <FilterChip label="Shares" icon={<SharesIcon />} isActive={isActive}>
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Shares</h4>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="From"
            defaultValue={minShares !== undefined ? formatNumber(minShares) : ''}
            onBlur={handleMinChange}
            onKeyDown={(e) => e.key === 'Enter' && handleMinChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400">-</span>
          <input
            type="text"
            placeholder="To"
            defaultValue={maxShares !== undefined ? formatNumber(maxShares) : ''}
            onBlur={handleMaxChange}
            onKeyDown={(e) => e.key === 'Enter' && handleMaxChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </FilterChip>
  )
}
