'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

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

  if (isLoading) return <div className="p-6">Loading...</div>

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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Total Active Users: <span className="font-semibold">{activeUsersCount}</span>
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          + Invite User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {isRecentlyActive(user.lastSeenAt) && (
                      <span className="flex h-2 w-2 mr-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {user.userRoles.length > 0 ? (
                      user.userRoles.map((ur) => (
                        <span
                          key={ur.role.id}
                          className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800"
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
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : user.status === 'INVITED'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatLastActivity(user.lastSeenAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    {user.status === 'INVITED' && (
                      <>
                        <button
                          onClick={() => resendInviteMutation.mutate(user.id)}
                          disabled={resendInviteMutation.isPending}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-50 transition-colors group relative"
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
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Resend Invitation
                          </span>
                        </button>
                        <button
                          onClick={() => setShowCancelInviteModal(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors group relative"
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
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Cancel Invitation
                          </span>
                        </button>
                      </>
                    )}
                    {user.status === 'ACTIVE' && (
                      <button
                        onClick={() => setShowDeactivateModal(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors group relative"
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
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Deactivate User
                        </span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-99999">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <h2 className="text-xl font-bold mb-4">Invite User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteRoleId || ''}
                  onChange={(e) => setInviteRoleId(e.target.value ? +e.target.value : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">Failed to send invitation. Please try again.</p>
              </div>
            )}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowInviteModal(false)
                  setInviteEmail('')
                  setInviteName('')
                  setInviteRoleId(null)
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  inviteMutation.mutate({
                    email: inviteEmail,
                    name: inviteName || inviteEmail,
                    roleId: inviteRoleId || undefined,
                  })
                }
                disabled={!inviteEmail || inviteMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-99999">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <h2 className="text-xl font-bold text-red-600 mb-4">Confirm Deactivation</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to deactivate this user? They will be immediately logged out and
              will no longer be able to access the system.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeactivateModal(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => deactivateMutation.mutate(showDeactivateModal)}
                disabled={deactivateMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Invitation Confirmation Modal */}
      {showCancelInviteModal && (
        <div className="fixed inset-0 bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-99999">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <h2 className="text-xl font-bold text-red-600 mb-4">Cancel Invitation</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to cancel this invitation? The user will not be able to accept
              the invitation and their account will be permanently deleted.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelInviteModal(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => cancelInviteMutation.mutate(showCancelInviteModal)}
                disabled={cancelInviteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {cancelInviteMutation.isPending ? 'Canceling...' : 'Cancel Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
