'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import Button from '@/components/ui/button/Button'
import Input from '@/components/form/input/InputField'
import Label from '@/components/form/Label'

interface Role {
  id: number
  name: string
  description: string | null
}

interface User {
  id: number
  email: string
  name: string
  status: 'ACTIVE' | 'INVITED' | 'DEACTIVATED'
  lastSeenAt: string | null
  createdAt: string
  userRoles: Array<{ role: Role }>
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState<number | null>(null)
  const [showCancelInviteModal, setShowCancelInviteModal] = useState<number | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRoleId, setInviteRoleId] = useState<number | null>(null)

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/users')
      return res.data
    },
  })

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await apiClient.get('/roles')
      return res.data
    },
  })

  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; name: string; roleId?: number }) => {
      return await apiClient.post('/users/invite', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteName('')
      setInviteRoleId(null)
    },
  })

  const resendInviteMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiClient.post(`/users/${userId}/resend-invitation`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiClient.delete(`/users/${userId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowDeactivateModal(null)
    },
  })

  const cancelInviteMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiClient.delete(`/users/${userId}/cancel-invitation`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowCancelInviteModal(null)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  const users: User[] = usersData?.users || []
  const roles: Role[] = rolesData?.roles || []
  const activeUsersCount = users.filter((u) => u.status === 'ACTIVE').length

  const formatLastActivity = (lastSeenAt: string | null) => {
    if (!lastSeenAt) return 'Never'
    try {
      return formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  const isRecentlyActive = (lastSeenAt: string | null) => {
    if (!lastSeenAt) return false
    const hourAgo = Date.now() - 60 * 60 * 1000
    return new Date(lastSeenAt).getTime() > hourAgo
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Total Active Users: <span className="font-semibold">{activeUsersCount}</span>
          </p>
        </div>
        <Button size="sm" onClick={() => setShowInviteModal(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Invite User
        </Button>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                  User
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                  Roles
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {isRecentlyActive(user.lastSeenAt) && (
                        <span className="flex w-2 h-2 mr-2">
                          <span className="absolute inline-flex w-2 h-2 bg-green-400 rounded-full opacity-75 animate-ping"></span>
                          <span className="relative inline-flex w-2 h-2 bg-green-500 rounded-full"></span>
                        </span>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {user.userRoles.length > 0 ? (
                        user.userRoles.map((ur) => (
                          <span
                            key={ur.role.id}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-brand-100 text-brand-800 dark:bg-brand-900/20 dark:text-brand-400"
                          >
                            {ur.role.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No roles</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${
                        user.status === 'ACTIVE'
                          ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400'
                          : user.status === 'INVITED'
                            ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                    {formatLastActivity(user.lastSeenAt)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {user.status === 'INVITED' && (
                        <>
                          <button
                            onClick={() => resendInviteMutation.mutate(user.id)}
                            disabled={resendInviteMutation.isPending}
                            className="p-2 text-brand-600 transition-colors rounded-md hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20 disabled:opacity-50"
                            title="Resend Invitation"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => setShowCancelInviteModal(user.id)}
                            className="p-2 text-error-600 transition-colors rounded-md hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/20"
                            title="Cancel Invitation"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </>
                      )}
                      {user.status === 'ACTIVE' && (
                        <button
                          onClick={() => setShowDeactivateModal(user.id)}
                          className="p-2 text-error-600 transition-colors rounded-md hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/20"
                          title="Deactivate User"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg dark:bg-gray-900">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Invite User</h2>
            <div className="space-y-4">
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Role</Label>
                <select
                  value={inviteRoleId || ''}
                  onChange={(e) => setInviteRoleId(e.target.value ? +e.target.value : null)}
                  className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select a role...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {inviteMutation.isError && (
              <div className="p-3 mt-4 border rounded-md bg-error-50 border-error-200 dark:bg-error-900/20 dark:border-error-800">
                <p className="text-sm text-error-800 dark:text-error-400">
                  Failed to send invitation. Please try again.
                </p>
              </div>
            )}
            <div className="flex justify-end mt-6 space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowInviteModal(false)
                  setInviteEmail('')
                  setInviteName('')
                  setInviteRoleId(null)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  inviteMutation.mutate({
                    email: inviteEmail,
                    name: inviteName || inviteEmail,
                    roleId: inviteRoleId || undefined,
                  })
                }
                disabled={!inviteEmail || inviteMutation.isPending}
              >
                {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg dark:bg-gray-900">
            <h2 className="mb-4 text-xl font-bold text-error-600 dark:text-error-400">
              Confirm Deactivation
            </h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to deactivate this user? They will be immediately logged out and
              will no longer be able to access the system.
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowDeactivateModal(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => deactivateMutation.mutate(showDeactivateModal)}
                disabled={deactivateMutation.isPending}
                className="bg-error-600 hover:bg-error-700 text-white"
              >
                {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate User'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Invitation Modal */}
      {showCancelInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg dark:bg-gray-900">
            <h2 className="mb-4 text-xl font-bold text-error-600 dark:text-error-400">
              Cancel Invitation
            </h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to cancel this invitation? The user will not be able to accept
              the invitation and their account will be permanently deleted.
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowCancelInviteModal(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => cancelInviteMutation.mutate(showCancelInviteModal)}
                disabled={cancelInviteMutation.isPending}
                className="bg-error-600 hover:bg-error-700 text-white"
              >
                {cancelInviteMutation.isPending ? 'Canceling...' : 'Cancel Invitation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
