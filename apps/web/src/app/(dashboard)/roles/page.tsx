'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export default function RolesPage() {
  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await apiClient.get('/roles')
      return res.data
    },
  })

  if (isLoading) return <div>Loading...</div>

  const roles = rolesData?.roles || []

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Roles</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role: any) => (
          <div key={role.id} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {role.name}
            </h3>
            <p className="text-gray-600">{role.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
