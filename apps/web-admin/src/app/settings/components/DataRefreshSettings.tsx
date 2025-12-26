'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useState, useEffect } from 'react'
import Button from '@/components/ui/button/Button'
import Input from '@/components/form/input/InputField'
import Label from '@/components/form/Label'

interface NetworkThreshold {
  basicDataDays: number
  audienceDataDays: number
}

interface DataRefreshSettings {
  instagram: NetworkThreshold
  tiktok: NetworkThreshold
  youtube: NetworkThreshold
}

type SocialNetwork = 'instagram' | 'tiktok' | 'youtube'

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
)

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
  </svg>
)

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
)

interface NetworkConfig {
  id: SocialNetwork
  label: string
  icon: React.ReactNode
  bgColor: string
}

const SOCIAL_NETWORKS: NetworkConfig[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    icon: <InstagramIcon />,
    bgColor: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
  },
  { id: 'tiktok', label: 'TikTok', icon: <TikTokIcon />, bgColor: 'bg-black' },
  { id: 'youtube', label: 'YouTube', icon: <YouTubeIcon />, bgColor: 'bg-red-600' },
]

const DEFAULT_SETTINGS: DataRefreshSettings = {
  instagram: { basicDataDays: 30, audienceDataDays: 180 },
  tiktok: { basicDataDays: 30, audienceDataDays: 180 },
  youtube: { basicDataDays: 30, audienceDataDays: 180 },
}

interface ValidationErrors {
  [key: string]: string | undefined
}

export default function DataRefreshSettings() {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<DataRefreshSettings>(DEFAULT_SETTINGS)
  const [errors, setErrors] = useState<ValidationErrors>({})

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['dataRefreshSettings'],
    queryFn: async () => {
      const res = await apiClient.get('/settings/data-refresh')
      return res.data as DataRefreshSettings
    },
  })

  useEffect(() => {
    if (settingsData) {
      setFormData(settingsData)
    }
  }, [settingsData])

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<DataRefreshSettings>) => {
      return await apiClient.patch('/settings/data-refresh', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataRefreshSettings'] })
    },
  })

  const validateField = (
    network: SocialNetwork,
    field: 'basicDataDays' | 'audienceDataDays',
    value: number
  ): string | undefined => {
    if (value < 1) {
      return 'Threshold must be at least 1 day'
    }
    if (value > 365) {
      return 'Threshold cannot exceed 365 days'
    }

    if (field === 'basicDataDays') {
      const audienceValue = formData[network].audienceDataDays
      if (value > audienceValue) {
        return 'Basic data threshold cannot exceed audience data threshold'
      }
    }

    if (field === 'audienceDataDays') {
      const basicValue = formData[network].basicDataDays
      if (basicValue > value) {
        return 'Audience data threshold must be greater than or equal to basic data threshold'
      }
    }

    return undefined
  }

  const handleChange = (
    network: SocialNetwork,
    field: 'basicDataDays' | 'audienceDataDays',
    value: string
  ) => {
    const numValue = parseInt(value, 10) || 0
    const errorKey = `${network}.${field}`

    setFormData((prev) => ({
      ...prev,
      [network]: {
        ...prev[network],
        [field]: numValue,
      },
    }))

    const error = validateField(network, field, numValue)
    setErrors((prev) => ({
      ...prev,
      [errorKey]: error,
    }))

    // Also validate the related field when one changes
    if (field === 'basicDataDays') {
      const audienceError = validateField(
        network,
        'audienceDataDays',
        formData[network].audienceDataDays
      )
      setErrors((prev) => ({
        ...prev,
        [`${network}.audienceDataDays`]: audienceError,
      }))
    } else {
      const newFormData = {
        ...formData,
        [network]: {
          ...formData[network],
          [field]: numValue,
        },
      }
      const basicError = validateField(network, 'basicDataDays', newFormData[network].basicDataDays)
      setErrors((prev) => ({
        ...prev,
        [`${network}.basicDataDays`]: basicError,
      }))
    }
  }

  const hasErrors = Object.values(errors).some((error) => error !== undefined)

  const handleSubmit = () => {
    // Validate all fields before submitting
    const newErrors: ValidationErrors = {}
    for (const network of SOCIAL_NETWORKS) {
      const basicError = validateField(
        network.id,
        'basicDataDays',
        formData[network.id].basicDataDays
      )
      const audienceError = validateField(
        network.id,
        'audienceDataDays',
        formData[network.id].audienceDataDays
      )
      if (basicError) newErrors[`${network.id}.basicDataDays`] = basicError
      if (audienceError) newErrors[`${network.id}.audienceDataDays`] = audienceError
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    updateMutation.mutate(formData)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Social Media Data Refresh Settings
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Configure how often influencer data should be updated from each social network. These
          thresholds determine when the background worker will refresh stale data.
        </p>
      </div>

      <div className="space-y-8">
        {SOCIAL_NETWORKS.map((network) => (
          <div
            key={network.id}
            className="p-4 border border-gray-200 rounded-lg dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`flex items-center justify-center w-10 h-10 text-white rounded-lg ${network.bgColor}`}
              >
                {network.icon}
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{network.label}</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Basic Data Threshold</Label>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Profile pic, Bio, Follower count
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Update every</span>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={formData[network.id].basicDataDays}
                    onChange={(e) => handleChange(network.id, 'basicDataDays', e.target.value)}
                    className="w-20 !bg-white dark:!bg-gray-900"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">days</span>
                </div>
                {errors[`${network.id}.basicDataDays`] && (
                  <p className="mt-1 text-xs text-error-600 dark:text-error-400">
                    {errors[`${network.id}.basicDataDays`]}
                  </p>
                )}
              </div>

              <div>
                <Label>Audience Data Threshold</Label>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Demographics, detailed stats
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Update every</span>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={formData[network.id].audienceDataDays}
                    onChange={(e) => handleChange(network.id, 'audienceDataDays', e.target.value)}
                    className="w-20 !bg-white dark:!bg-gray-900"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">days</span>
                </div>
                {errors[`${network.id}.audienceDataDays`] && (
                  <p className="mt-1 text-xs text-error-600 dark:text-error-400">
                    {errors[`${network.id}.audienceDataDays`]}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {updateMutation.isSuccess && (
          <div className="p-3 border rounded-md bg-success-50 border-success-200 dark:bg-success-900/20 dark:border-success-800">
            <p className="text-sm text-success-800 dark:text-success-400">
              Settings saved successfully
            </p>
          </div>
        )}

        {updateMutation.isError && (
          <div className="p-3 border rounded-md bg-error-50 border-error-200 dark:bg-error-900/20 dark:border-error-800">
            <p className="text-sm text-error-800 dark:text-error-400">
              Failed to save settings. Please try again.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={updateMutation.isPending || hasErrors}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
