'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useState, useEffect } from 'react'

export default function SettingsPage() {
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
    mutationFn: async (data: any) => {
      return await apiClient.patch('/settings/org', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgSettings'] })
    },
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Organization Settings</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            updateMutation.mutate(formData)
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              value={formData.timezone}
              onChange={(e) =>
                setFormData({ ...formData, timezone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="America/Los_Angeles">America/Los_Angeles</option>
              <option value="Europe/London">Europe/London</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) =>
                setFormData({ ...formData, currency: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>

          {updateMutation.isSuccess && (
            <p className="text-green-600 text-sm">Settings saved successfully!</p>
          )}
        </form>
      </div>
    </div>
  )
}
