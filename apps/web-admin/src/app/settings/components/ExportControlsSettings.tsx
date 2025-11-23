'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useState } from 'react'
import Button from '@/components/ui/button/Button'
import Input from '@/components/form/input/InputField'
import Label from '@/components/form/Label'

interface ExportControlSetting {
  id: number
  roleId: number
  roleName: string
  exportType: string
  rowLimit: number
  enableWatermark: boolean
  dailyLimit: number | null
  monthlyLimit: number | null
}

interface FormData {
  roleId: number
  exportType: string
  rowLimit: number
  enableWatermark: boolean
  dailyLimit: number | null
  monthlyLimit: number | null
}

export default function ExportControlsSettings() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<FormData>({
    roleId: 0,
    exportType: 'all',
    rowLimit: 100,
    enableWatermark: true,
    dailyLimit: 20,
    monthlyLimit: 200,
  })

  // Fetch settings
  const { data: settingsResponse, isLoading } = useQuery({
    queryKey: ['exportControlSettings'],
    queryFn: async () => {
      const res = await apiClient.get('/export-controls')
      return res.data
    },
  })

  // Fetch roles for dropdown
  const { data: rolesResponse } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await apiClient.get('/roles')
      return res.data
    },
  })

  const settings: ExportControlSetting[] = settingsResponse?.settings || []
  const roles = rolesResponse?.roles || []

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiClient.post('/export-controls', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exportControlSettings'] })
      setShowForm(false)
      resetForm()
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FormData> }) => {
      return await apiClient.patch(`/export-controls/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exportControlSettings'] })
      setShowForm(false)
      setEditingId(null)
      resetForm()
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/export-controls/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exportControlSettings'] })
    },
  })

  const resetForm = () => {
    setFormData({
      roleId: 0,
      exportType: 'all',
      rowLimit: 100,
      enableWatermark: true,
      dailyLimit: 20,
      monthlyLimit: 200,
    })
  }

  const handleEdit = (setting: ExportControlSetting) => {
    setFormData({
      roleId: setting.roleId,
      exportType: setting.exportType,
      rowLimit: setting.rowLimit,
      enableWatermark: setting.enableWatermark,
      dailyLimit: setting.dailyLimit,
      monthlyLimit: setting.monthlyLimit,
    })
    setEditingId(setting.id)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this export control setting?')) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Export Controls</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Configure role-based export limitations and watermarking
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setEditingId(null)
              setShowForm(!showForm)
            }}
          >
            {showForm ? 'Cancel' : 'Add Setting'}
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="p-4 mb-6 border border-gray-200 rounded-lg dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50"
          >
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
              {editingId ? 'Edit Setting' : 'New Setting'}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Role</Label>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value) })}
                  required
                  className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-800"
                >
                  <option value={0}>Select a role</option>
                  {roles.map((role: any) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Export Type</Label>
                <select
                  value={formData.exportType}
                  onChange={(e) => setFormData({ ...formData, exportType: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-800"
                >
                  <option value="all">All (Default)</option>
                  <option value="influencer_list">Influencer List</option>
                  <option value="report">Report</option>
                </select>
              </div>

              <div>
                <Label>Row Limit (-1 for unlimited)</Label>
                <Input
                  type="number"
                  value={formData.rowLimit}
                  onChange={(e) => setFormData({ ...formData, rowLimit: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  id="enableWatermark"
                  checked={formData.enableWatermark}
                  onChange={(e) => setFormData({ ...formData, enableWatermark: e.target.checked })}
                  className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                />
                <label
                  htmlFor="enableWatermark"
                  className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  Enable Watermark
                </label>
              </div>

              <div>
                <Label>Daily Limit (leave empty for no limit)</Label>
                <Input
                  type="number"
                  value={formData.dailyLimit || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dailyLimit: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                />
              </div>

              <div>
                <Label>Monthly Limit (leave empty for no limit)</Label>
                <Input
                  type="number"
                  value={formData.monthlyLimit || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthlyLimit: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end mt-4 space-x-2">
              <Button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  resetForm()
                }}
                className="bg-gray-500 hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Export Type</th>
                <th className="px-4 py-3">Row Limit</th>
                <th className="px-4 py-3">Watermark</th>
                <th className="px-4 py-3">Daily Limit</th>
                <th className="px-4 py-3">Monthly Limit</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((setting) => (
                <tr key={setting.id} className="border-b dark:border-gray-800">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {setting.roleName}
                  </td>
                  <td className="px-4 py-3">{setting.exportType}</td>
                  <td className="px-4 py-3">
                    {setting.rowLimit === -1 ? (
                      <span className="text-green-600 dark:text-green-400">Unlimited</span>
                    ) : (
                      setting.rowLimit
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {setting.enableWatermark ? (
                      <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded dark:bg-green-900 dark:text-green-300">
                        On
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded dark:bg-gray-700 dark:text-gray-300">
                        Off
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{setting.dailyLimit || '—'}</td>
                  <td className="px-4 py-3">{setting.monthlyLimit || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(setting)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(setting.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400"
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {settings.length === 0 && (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              No export control settings configured. Add one to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
