'use client'

import { useState } from 'react'
import { FilterChip } from './FilterChip'
import { LANGUAGES, PERCENTAGE_THRESHOLDS, LanguageIcon } from './constants'

interface LanguageFilterProps {
  // Audience language
  audienceLanguage?: string
  audienceLanguageMinPercent?: number
  onAudienceLanguageChange: (language: string | undefined) => void
  onAudienceLanguageMinPercentChange: (percent: number | undefined) => void
  // Influencer language
  language?: string
  onLanguageChange: (language: string | undefined) => void
}

export function LanguageFilter({
  audienceLanguage,
  audienceLanguageMinPercent,
  onAudienceLanguageChange,
  onAudienceLanguageMinPercentChange,
  language,
  onLanguageChange,
}: LanguageFilterProps) {
  const [audienceSearch, setAudienceSearch] = useState('')
  const [influencerSearch, setInfluencerSearch] = useState('')

  const isActive = audienceLanguage !== undefined || language !== undefined

  const filteredLanguagesAudience = LANGUAGES.filter((l) =>
    l.label.toLowerCase().includes(audienceSearch.toLowerCase())
  )
  const filteredLanguagesInfluencer = LANGUAGES.filter((l) =>
    l.label.toLowerCase().includes(influencerSearch.toLowerCase())
  )

  const getLanguageLabel = (code: string) => {
    return LANGUAGES.find((l) => l.value === code)?.label || code
  }

  const handleAddAudienceLanguage = (langCode: string) => {
    onAudienceLanguageChange(langCode)
    setAudienceSearch('')
  }

  const handleRemoveAudienceLanguage = () => {
    onAudienceLanguageChange(undefined)
    onAudienceLanguageMinPercentChange(undefined)
  }

  const handleAddInfluencerLanguage = (langCode: string) => {
    onLanguageChange(langCode)
    setInfluencerSearch('')
  }

  const handleRemoveInfluencerLanguage = () => {
    onLanguageChange(undefined)
  }

  return (
    <FilterChip label="Language" icon={<LanguageIcon />} isActive={isActive}>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Audience Column */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audience</h4>

            {!audienceLanguage ? (
              <div className="relative">
                <input
                  type="text"
                  value={audienceSearch}
                  onChange={(e) => setAudienceSearch(e.target.value)}
                  placeholder="Add language"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {audienceSearch && (
                  <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    {filteredLanguagesAudience.map((l) => (
                      <button
                        key={l.value}
                        onClick={() => handleAddAudienceLanguage(l.value)}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {l.label}
                      </button>
                    ))}
                    {filteredLanguagesAudience.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">No results</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRemoveAudienceLanguage}
                    className="inline-flex items-center gap-1.5 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <span className="text-red-500">&times;</span>
                    <span>{getLanguageLabel(audienceLanguage)}</span>
                  </button>
                  <select
                    value={audienceLanguageMinPercent || 20}
                    onChange={(e) => onAudienceLanguageMinPercentChange(Number(e.target.value))}
                    className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {PERCENTAGE_THRESHOLDS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Influencer Column */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Influencer</h4>

            {!language ? (
              <div className="relative">
                <input
                  type="text"
                  value={influencerSearch}
                  onChange={(e) => setInfluencerSearch(e.target.value)}
                  placeholder="Add language"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {influencerSearch && (
                  <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    {filteredLanguagesInfluencer.map((l) => (
                      <button
                        key={l.value}
                        onClick={() => handleAddInfluencerLanguage(l.value)}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {l.label}
                      </button>
                    ))}
                    {filteredLanguagesInfluencer.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">No results</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleRemoveInfluencerLanguage}
                className="inline-flex items-center gap-1.5 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <span className="text-red-500">&times;</span>
                <span>{getLanguageLabel(language)}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </FilterChip>
  )
}
