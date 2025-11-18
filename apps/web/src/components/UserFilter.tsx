'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

interface UserFilterProps {
  selectedUserId: string
  onUserChange: (userId: string) => void
}

export function UserFilter({ selectedUserId, onUserChange }: UserFilterProps) {
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/users')
      return res.data
    },
  })

  const users = usersData?.users || []

  return (
    <div className="flex flex-col">
      <label htmlFor="userFilter" className="text-sm font-medium text-gray-700 mb-1">
        Filter by User
      </label>
      <select
        id="userFilter"
        value={selectedUserId}
        onChange={(e) => onUserChange(e.target.value)}
        disabled={isLoading}
        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        <option value="">All Users</option>
        {users.map((user: any) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.email})
          </option>
        ))}
      </select>
    </div>
  )
}
