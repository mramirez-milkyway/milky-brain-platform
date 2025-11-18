'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export default function PoliciesPage() {
  const { data: policiesData, isLoading } = useQuery({
    queryKey: ['policies'],
    queryFn: async () => {
      const res = await apiClient.get('/policies')
      return res.data
    },
  })

  if (isLoading) return <div>Loading...</div>

  const policies = policiesData?.policies || []

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Policies</h1>

      <div className="space-y-4">
        {policies.map((policy: any) => (
          <div key={policy.id} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {policy.name}
            </h3>
            <p className="text-gray-600 mb-4">{policy.description}</p>
            <div className="bg-gray-50 rounded p-4">
              <pre className="text-sm text-gray-700 overflow-x-auto">
                {JSON.stringify(policy.statements, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
