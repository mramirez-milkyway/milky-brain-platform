'use client'

import { useState } from 'react'
import { FilterChip } from './FilterChip'
import { COUNTRIES, PERCENTAGE_THRESHOLDS, LocationIcon, getCountryFlag } from './constants'

interface LocationFilterProps {
  // Audience location
  audienceCountry?: string[]
  audienceCountryMinPercent?: number
  onAudienceCountryChange: (countries: string[] | undefined) => void
  onAudienceCountryMinPercentChange: (percent: number | undefined) => void
  // Influencer location
  country?: string[]
  onCountryChange: (countries: string[] | undefined) => void
}

export function LocationFilter({
  audienceCountry,
  audienceCountryMinPercent,
  onAudienceCountryChange,
  onAudienceCountryMinPercentChange,
  country,
  onCountryChange,
}: LocationFilterProps) {
  const [audienceSearch, setAudienceSearch] = useState('')
  const [influencerSearch, setInfluencerSearch] = useState('')

  const isActive = (audienceCountry && audienceCountry.length > 0) || (country && country.length > 0)

  const filteredCountriesAudience = COUNTRIES.filter((c) =>
    c.label.toLowerCase().includes(audienceSearch.toLowerCase())
  )
  const filteredCountriesInfluencer = COUNTRIES.filter((c) =>
    c.label.toLowerCase().includes(influencerSearch.toLowerCase())
  )

  const handleAddAudienceCountry = (countryCode: string) => {
    const current = audienceCountry || []
    if (!current.includes(countryCode)) {
      onAudienceCountryChange([...current, countryCode])
    }
    setAudienceSearch('')
  }

  const handleRemoveAudienceCountry = (countryCode: string) => {
    const current = audienceCountry || []
    const updated = current.filter((c) => c !== countryCode)
    onAudienceCountryChange(updated.length > 0 ? updated : undefined)
  }

  const handleAddInfluencerCountry = (countryCode: string) => {
    const current = country || []
    if (!current.includes(countryCode)) {
      onCountryChange([...current, countryCode])
    }
    setInfluencerSearch('')
  }

  const handleRemoveInfluencerCountry = (countryCode: string) => {
    const current = country || []
    const updated = current.filter((c) => c !== countryCode)
    onCountryChange(updated.length > 0 ? updated : undefined)
  }

  const getCountryLabel = (code: string) => {
    return COUNTRIES.find((c) => c.value === code)?.label || code
  }

  return (
    <FilterChip label="Location" icon={<LocationIcon />} isActive={isActive}>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Audience Column */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audience</h4>

            {/* Search Input */}
            <div className="relative mb-2">
              <input
                type="text"
                value={audienceSearch}
                onChange={(e) => setAudienceSearch(e.target.value)}
                placeholder="Add city or country"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {audienceSearch && (
                <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                  {filteredCountriesAudience.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => handleAddAudienceCountry(c.value)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <span>{getCountryFlag(c.value)}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                  {filteredCountriesAudience.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">No results</div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Countries with Percentage */}
            {audienceCountry && audienceCountry.length > 0 && (
              <div className="space-y-2">
                {audienceCountry.map((code) => (
                  <div key={code} className="flex items-center gap-2">
                    <button
                      onClick={() => handleRemoveAudienceCountry(code)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <span className="text-red-500">&times;</span>
                      <span>{getCountryFlag(code)}</span>
                      <span>{getCountryLabel(code)}</span>
                    </button>
                  </div>
                ))}
                {/* Percentage Threshold */}
                <select
                  value={audienceCountryMinPercent || 30}
                  onChange={(e) => onAudienceCountryMinPercentChange(Number(e.target.value))}
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
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Influencer</h4>

            {/* Search Input */}
            <div className="relative mb-2">
              <input
                type="text"
                value={influencerSearch}
                onChange={(e) => setInfluencerSearch(e.target.value)}
                placeholder="Add city or country"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {influencerSearch && (
                <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                  {filteredCountriesInfluencer.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => handleAddInfluencerCountry(c.value)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <span>{getCountryFlag(c.value)}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                  {filteredCountriesInfluencer.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">No results</div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Countries */}
            {country && country.length > 0 && (
              <div className="space-y-2">
                {country.map((code) => (
                  <button
                    key={code}
                    onClick={() => handleRemoveInfluencerCountry(code)}
                    className="inline-flex items-center gap-1.5 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <span className="text-red-500">&times;</span>
                    <span>{getCountryFlag(code)}</span>
                    <span>{getCountryLabel(code)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </FilterChip>
  )
}
