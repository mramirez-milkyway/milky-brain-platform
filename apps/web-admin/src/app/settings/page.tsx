'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useState, useEffect } from 'react'
import Button from '@/components/ui/button/Button'
import Input from '@/components/form/input/InputField'
import Label from '@/components/form/Label'
import PermissionGuard from '@/components/PermissionGuard'

function SettingsContent() {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: '',
    timezone: 'UTC',
    currency: 'USD',
  })

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['orgSettings'],
    queryFn: async () => {
      const res = await apiClient.get('/settings/org')
      return res.data
    },
  })

  useEffect(() => {
    if (settingsData) {
      setFormData({
        name: settingsData.name || '',
        timezone: settingsData.timezone || 'UTC',
        currency: settingsData.currency || 'USD',
      })
    }
  }, [settingsData])

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiClient.patch('/settings/org', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgSettings'] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage your organization settings
        </p>
      </div>

      <div className="p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          Organization Settings
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            updateMutation.mutate(formData)
          }}
          className="space-y-6"
        >
          <div>
            <Label>Organization Name</Label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label>Timezone</Label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="America/Los_Angeles">America/Los_Angeles</option>
              <option value="Europe/London">Europe/London</option>
            </select>
          </div>

          <div>
            <Label>Currency</Label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          {updateMutation.isSuccess && (
            <div className="p-3 border rounded-md bg-success-50 border-success-200 dark:bg-success-900/20 dark:border-success-800">
              <p className="text-sm text-success-800 dark:text-success-400">
                Settings updated successfully
              </p>
            </div>
          )}

          {updateMutation.isError && (
            <div className="p-3 border rounded-md bg-error-50 border-error-200 dark:bg-error-900/20 dark:border-error-800">
              <p className="text-sm text-error-800 dark:text-error-400">
                Failed to update settings. Please try again.
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <PermissionGuard permission="settings:Read">
      <SettingsContent />
    </PermissionGuard>
  )
}
