'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import Button from '@/components/ui/button/Button'
import Input from '@/components/form/input/InputField'
import Label from '@/components/form/Label'
import { useImaiProfileLookup } from '../hooks/useImaiProfileLookup'
import { useCreateCreator, type CreateCreatorInput } from '../hooks/useCreatorMutations'
import { ProfilePreviewCard, ProfilePreviewSkeleton } from './ProfilePreviewCard'
import { useFilterOptions } from '../hooks/useFilterOptions'

type Platform = 'instagram' | 'tiktok' | 'youtube'
type Step = 'lookup' | 'preview' | 'form'

// Platform icon components
const InstagramIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
)

const TikTokIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
)

const YouTubeIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
)

const SearchIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
)

const PlatformIcons: Record<Platform, React.FC<{ className?: string }>> = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  youtube: YouTubeIcon,
}

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
]

// Country code to name mapping (DB stores codes like "US", "AR", etc.)
const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  ES: 'Spain',
  MX: 'Mexico',
  AR: 'Argentina',
  CO: 'Colombia',
  BR: 'Brazil',
  GB: 'United Kingdom',
  UK: 'United Kingdom',
  FR: 'France',
  DE: 'Germany',
  IT: 'Italy',
  PT: 'Portugal',
  CL: 'Chile',
  PE: 'Peru',
  VE: 'Venezuela',
  EC: 'Ecuador',
  CA: 'Canada',
  AU: 'Australia',
  JP: 'Japan',
  KR: 'South Korea',
  IN: 'India',
  CN: 'China',
  RU: 'Russia',
  NL: 'Netherlands',
  BE: 'Belgium',
  CH: 'Switzerland',
  AT: 'Austria',
  PL: 'Poland',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  IE: 'Ireland',
  NZ: 'New Zealand',
  ZA: 'South Africa',
  TR: 'Turkey',
  GR: 'Greece',
  IL: 'Israel',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  SG: 'Singapore',
  TH: 'Thailand',
  ID: 'Indonesia',
  MY: 'Malaysia',
  PH: 'Philippines',
  VN: 'Vietnam',
  TW: 'Taiwan',
  HK: 'Hong Kong',
  EG: 'Egypt',
  NG: 'Nigeria',
  KE: 'Kenya',
  MA: 'Morocco',
  UA: 'Ukraine',
  CZ: 'Czech Republic',
  RO: 'Romania',
  HU: 'Hungary',
  PR: 'Puerto Rico',
  DO: 'Dominican Republic',
  GT: 'Guatemala',
  CR: 'Costa Rica',
  PA: 'Panama',
  UY: 'Uruguay',
  PY: 'Paraguay',
  BO: 'Bolivia',
  HN: 'Honduras',
  SV: 'El Salvador',
  NI: 'Nicaragua',
  CU: 'Cuba',
}

// Country code to flag emoji
const getCountryFlag = (code: string): string => {
  const upperCode = code.toUpperCase()
  // Check if it looks like a country code (2 letters)
  if (upperCode.length === 2 && /^[A-Z]{2}$/.test(upperCode)) {
    const codePoints = upperCode.split('').map((char) => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  }
  return '🌍' // Default globe for unknown format
}

// Get display text for country select option
const getCountryDisplay = (code: string): string => {
  const flag = getCountryFlag(code)
  const name = COUNTRY_NAMES[code.toUpperCase()] || code
  return `${flag} ${name}`
}

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
  beauty: '💄',
  fashion: '👗',
  gaming: '🎮',
  food: '🍔',
  travel: '✈️',
  fitness: '💪',
  tech: '💻',
  music: '🎵',
  comedy: '😂',
  lifestyle: '🏠',
  education: '📚',
  sports: '⚽',
  art: '🎨',
  photography: '📷',
  parenting: '👶',
  automotive: '🚗',
  pets: '🐶',
  health: '🏥',
  finance: '💰',
  diy: '🔨',
  books: '📖',
  movies: '🎬',
  nature: '🌿',
  spirituality: '🧘',
}

const getCategoryIcon = (category: string): string => {
  return CATEGORY_ICONS[category.toLowerCase()] || '📌'
}

// Multi-select dropdown component
interface MultiSelectDropdownProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder: string
  getIcon?: (value: string) => string
}

function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder,
  getIcon,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

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

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selected.filter((v) => v !== value))
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[44px] px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent dark:bg-gray-900 text-gray-800 dark:text-white cursor-pointer flex items-center flex-wrap gap-1"
      >
        {selected.length === 0 ? (
          <span className="text-gray-400 dark:text-white/30">{placeholder}</span>
        ) : (
          selected.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
            >
              {getIcon && <span>{getIcon(value)}</span>}
              {value}
              <button
                onClick={(e) => handleRemove(value, e)}
                className="hover:text-blue-600 ml-0.5"
              >
                &times;
              </button>
            </span>
          ))
        )}
        <svg
          className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option)
                return (
                  <div
                    key={option}
                    onClick={() => handleToggle(option)}
                    className={`px-3 py-2 text-sm flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    {getIcon && <span>{getIcon(option)}</span>}
                    <span>{option}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface AddInfluencerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface FormData {
  fullName: string
  handle: string
  platform: Platform
  followers: number
  gender: 'male' | 'female' | 'organization' | ''
  country: string
  city: string
  email: string
  phoneNumber: string
  categories: string[]
  languages: string[]
  characteristics: string
  comments: string
  internalRating: number | ''
}

const initialFormData: FormData = {
  fullName: '',
  handle: '',
  platform: 'instagram',
  followers: 0,
  gender: '',
  country: '',
  city: '',
  email: '',
  phoneNumber: '',
  categories: [],
  languages: [],
  characteristics: '',
  comments: '',
  internalRating: '',
}

export function AddInfluencerModal({ isOpen, onClose, onSuccess }: AddInfluencerModalProps) {
  const [step, setStep] = useState<Step>('lookup')
  const [handle, setHandle] = useState('')
  const [platform, setPlatform] = useState<Platform>('instagram')
  const [shouldLookup, setShouldLookup] = useState(false)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  // Filter options for dropdowns
  const { data: filterOptions } = useFilterOptions()

  // IMAI profile lookup
  const {
    data: lookupResult,
    isLoading: isLookingUp,
    isError: lookupError,
    error,
  } = useImaiProfileLookup(handle, platform, shouldLookup)

  // Create mutation
  const createCreator = useCreateCreator()

  // Reset modal state
  const resetModal = useCallback(() => {
    setStep('lookup')
    setHandle('')
    setPlatform('instagram')
    setShouldLookup(false)
    setFormData(initialFormData)
    setFormErrors({})
  }, [])

  // Handle close
  const handleClose = useCallback(() => {
    resetModal()
    onClose()
  }, [resetModal, onClose])

  // Handle lookup submission
  const handleLookup = useCallback(() => {
    if (!handle.trim()) return
    setShouldLookup(true)
    setStep('preview')
  }, [handle])

  // Handle profile confirmation
  const handleConfirmProfile = useCallback(() => {
    if (!lookupResult?.profile) return

    const profile = lookupResult.profile
    setFormData((prev) => ({
      ...prev,
      fullName: profile.fullName,
      handle: profile.handle,
      platform: profile.platform as Platform,
      followers: profile.followers,
    }))
    setStep('form')
  }, [lookupResult])

  // Handle cancel from preview
  const handleCancelPreview = useCallback(() => {
    setShouldLookup(false)
    setStep('lookup')
  }, [])

  // Handle form field change
  const handleFieldChange = useCallback(
    (field: keyof FormData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        let value: string | number | '' = e.target.value

        // Handle number fields with validation
        if (e.target.type === 'number') {
          if (e.target.value === '') {
            value = ''
          } else {
            const numValue = Number(e.target.value)
            // For internalRating, clamp between 0-100
            if (field === 'internalRating') {
              value = Math.max(0, Math.min(100, numValue))
            } else {
              value = numValue
            }
          }
        }

        setFormData((prev) => ({ ...prev, [field]: value }))

        // Clear error when field is edited
        if (formErrors[field]) {
          setFormErrors((prev) => ({ ...prev, [field]: undefined }))
        }
      },
    [formErrors]
  )

  // Handle multi-select array fields
  const handleArrayFieldChange = useCallback(
    (field: 'categories' | 'languages') => (values: string[]) => {
      setFormData((prev) => ({ ...prev, [field]: values }))
    },
    []
  )

  // Validate form
  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required'
    }
    if (!formData.handle.trim()) {
      errors.handle = 'Handle is required'
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }
    if (
      formData.internalRating !== '' &&
      (formData.internalRating < 0 || formData.internalRating > 100)
    ) {
      errors.internalRating = 'Rating must be between 0 and 100'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData])

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return

    const payload: CreateCreatorInput = {
      fullName: formData.fullName,
      socialAccounts: [
        {
          handle: formData.handle,
          platform: formData.platform,
          followers: formData.followers || undefined,
        },
      ],
      gender: formData.gender || undefined,
      country: formData.country || undefined,
      city: formData.city || undefined,
      email: formData.email || undefined,
      phoneNumber: formData.phoneNumber || undefined,
      // Serialize arrays as JSON strings for the API
      categories: formData.categories.length > 0 ? JSON.stringify(formData.categories) : undefined,
      languages: formData.languages.length > 0 ? JSON.stringify(formData.languages) : undefined,
      characteristics: formData.characteristics || undefined,
      comments: formData.comments || undefined,
      internalRating: formData.internalRating !== '' ? formData.internalRating : undefined,
    }

    try {
      await createCreator.mutateAsync(payload)
      handleClose()
      onSuccess?.()
    } catch {
      // Error handling is done by the mutation
    }
  }, [validateForm, formData, createCreator, handleClose, onSuccess])

  // Go back to lookup step
  const handleBackToLookup = useCallback(() => {
    setStep('lookup')
    setShouldLookup(false)
  }, [])

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'lookup':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Add New Influencer
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Enter the influencer&apos;s social media handle to look up their profile.
              </p>
            </div>

            {/* Platform Selection */}
            <div>
              <Label>Platform</Label>
              <div className="mt-2 flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                {PLATFORMS.map((p) => {
                  const Icon = PlatformIcons[p.value]
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPlatform(p.value)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                        platform === p.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Handle Input */}
            <div>
              <Label>Handle</Label>
              <div className="mt-2 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.replace(/^@/, ''))}
                  placeholder="username"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent pl-8 pr-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && handle.trim()) {
                      handleLookup()
                    }
                  }}
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Enter the username without the @ symbol
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleLookup}
                disabled={!handle.trim()}
                startIcon={<SearchIcon className="w-4 h-4" />}
              >
                Look Up Profile
              </Button>
            </div>
          </div>
        )

      case 'preview':
        return (
          <div className="space-y-6">
            <div>
              <button
                onClick={handleBackToLookup}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Confirm Profile
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Review the profile details before adding.
              </p>
            </div>

            {isLookingUp ? (
              <ProfilePreviewSkeleton />
            ) : (
              <ProfilePreviewCard
                profile={lookupResult?.profile ?? null}
                isLoading={isLookingUp}
                isError={lookupError || lookupResult?.found === false}
                errorMessage={
                  lookupError
                    ? (error as Error)?.message || 'Failed to look up profile'
                    : lookupResult?.found === false
                      ? `We couldn't find @${handle} on ${platform}. Please check the handle and try again.`
                      : undefined
                }
                onConfirm={handleConfirmProfile}
                onCancel={handleCancelPreview}
              />
            )}
          </div>
        )

      case 'form':
        return (
          <div className="space-y-6">
            <div>
              <button
                onClick={handleBackToLookup}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Start Over
              </button>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Complete Profile
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Fill in additional details for this influencer.
              </p>
            </div>

            {/* Error message */}
            {createCreator.isError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300">
                {(createCreator.error as Error)?.message ||
                  'Failed to create influencer. Please try again.'}
              </div>
            )}

            {/* Form */}
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit()
              }}
            >
              {/* Basic Info */}
              <div className="space-y-4">
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Basic Information
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      type="text"
                      value={formData.fullName}
                      onChange={handleFieldChange('fullName')}
                      error={!!formErrors.fullName}
                      hint={formErrors.fullName}
                      required
                    />
                  </div>
                  <div>
                    <Label>Handle *</Label>
                    <Input
                      type="text"
                      value={formData.handle}
                      onChange={handleFieldChange('handle')}
                      error={!!formErrors.handle}
                      hint={formErrors.handle}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Platform</Label>
                    <Input type="text" value={formData.platform} disabled />
                  </div>
                  <div>
                    <Label>Followers</Label>
                    <Input
                      type="number"
                      value={formData.followers}
                      onChange={handleFieldChange('followers')}
                    />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <select
                      value={formData.gender}
                      onChange={handleFieldChange('gender')}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="organization">Organization</option>
                    </select>
                  </div>
                  <div>
                    <Label>Internal Rating (0-100)</Label>
                    <Input
                      type="number"
                      value={formData.internalRating}
                      onChange={handleFieldChange('internalRating')}
                      min="0"
                      max="100"
                      error={!!formErrors.internalRating}
                      hint={formErrors.internalRating}
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Location</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Country</Label>
                    <select
                      value={formData.country}
                      onChange={handleFieldChange('country')}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    >
                      <option value="">Select country</option>
                      {filterOptions?.countries.map((country) => (
                        <option key={country} value={country}>
                          {getCountryDisplay(country)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input
                      type="text"
                      value={formData.city}
                      onChange={handleFieldChange('city')}
                      placeholder="e.g., Los Angeles"
                    />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-4">
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Contact Information
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={handleFieldChange('email')}
                      placeholder="influencer@example.com"
                      error={!!formErrors.email}
                      hint={formErrors.email}
                    />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      type="text"
                      value={formData.phoneNumber}
                      onChange={handleFieldChange('phoneNumber')}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
              </div>

              {/* Categories & Languages */}
              <div className="space-y-4">
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Categories & Languages
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Categories</Label>
                    <MultiSelectDropdown
                      options={filterOptions?.categories ?? []}
                      selected={formData.categories}
                      onChange={handleArrayFieldChange('categories')}
                      placeholder="Select categories..."
                      getIcon={getCategoryIcon}
                    />
                  </div>
                  <div>
                    <Label>Languages</Label>
                    <MultiSelectDropdown
                      options={filterOptions?.languages ?? []}
                      selected={formData.languages}
                      onChange={handleArrayFieldChange('languages')}
                      placeholder="Select languages..."
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Additional Notes
                </h5>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label>Characteristics</Label>
                    <textarea
                      value={formData.characteristics}
                      onChange={handleFieldChange('characteristics')}
                      placeholder="Notable characteristics or style..."
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                  <div>
                    <Label>Comments</Label>
                    <textarea
                      value={formData.comments}
                      onChange={handleFieldChange('comments')}
                      placeholder="Internal comments or notes..."
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={handleClose} disabled={createCreator.isPending}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={createCreator.isPending}>
                  {createCreator.isPending ? 'Adding...' : 'Add Influencer'}
                </Button>
              </div>
            </form>
          </div>
        )
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="relative w-full max-w-[700px] m-5 sm:m-0 max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6 lg:p-8">{renderStepContent()}</div>
    </Modal>
  )
}

export default AddInfluencerModal
