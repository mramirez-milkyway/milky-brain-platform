'use client'

import React, { useState, useRef, useEffect } from 'react'
import type { Agency } from '../hooks/useAgencies'

interface AgencySelectProps {
  agencies: Agency[]
  selectedId: number | null
  onChange: (agency: Agency | null) => void
  onCreateNew: (name: string) => Promise<Agency>
  isCreating?: boolean
  placeholder?: string
}

export function AgencySelect({
  agencies,
  selectedId,
  onChange,
  onCreateNew,
  isCreating = false,
  placeholder = 'Select or create agency...',
}: AgencySelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedAgency = agencies.find((a) => a.id === selectedId)

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

  const filteredAgencies = agencies.filter((agency) =>
    agency.name.toLowerCase().includes(search.toLowerCase())
  )

  const exactMatch = agencies.some((agency) => agency.name.toLowerCase() === search.toLowerCase())

  const handleSelect = (agency: Agency) => {
    onChange(agency)
    setSearch('')
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
    setSearch('')
  }

  const handleCreateNew = async () => {
    if (!search.trim() || exactMatch) return
    setIsCreatingNew(true)
    try {
      const newAgency = await onCreateNew(search.trim())
      onChange(newAgency)
      setSearch('')
      setIsOpen(false)
    } finally {
      setIsCreatingNew(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="h-11 px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent dark:bg-gray-900 text-gray-800 dark:text-white cursor-pointer flex items-center justify-between"
      >
        {selectedAgency ? (
          <div className="flex items-center justify-between flex-1">
            <span>{selectedAgency.name}</span>
            <button
              onClick={handleClear}
              className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              &times;
            </button>
          </div>
        ) : (
          <span className="text-gray-400 dark:text-white/30">{placeholder}</span>
        )}
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Search or type to create..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {filteredAgencies.length === 0 && !search.trim() ? (
              <div className="px-3 py-2 text-sm text-gray-500">No agencies yet</div>
            ) : (
              <>
                {filteredAgencies.map((agency) => (
                  <div
                    key={agency.id}
                    onClick={() => handleSelect(agency)}
                    className={`px-3 py-2 text-sm cursor-pointer ${
                      agency.id === selectedId
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    {agency.name}
                  </div>
                ))}
              </>
            )}

            {/* Create new option */}
            {search.trim() && !exactMatch && (
              <div
                onClick={handleCreateNew}
                className="px-3 py-2 text-sm cursor-pointer border-t border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-700 dark:text-green-400 flex items-center gap-2"
              >
                {isCreatingNew || isCreating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create &quot;{search.trim()}&quot;
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AgencySelect
