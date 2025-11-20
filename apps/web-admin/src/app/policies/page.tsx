'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

interface PolicyStatement {
  Effect: 'Allow' | 'Deny'
  Actions: string[]
  Resources: string[]
  Conditions?: Record<string, unknown>
}

interface Policy {
  id: number
  name: string
  description: string | null
  statements: PolicyStatement[]
  createdAt: string
}

export default function PoliciesPage() {
  const { data: policiesData, isLoading } = useQuery({
    queryKey: ['policies'],
    queryFn: async () => {
      const res = await apiClient.get('/policies')
      return res.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  const policies: Policy[] = policiesData?.policies || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Policies</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          IAM-like access control policies
        </p>
      </div>

      {/* Policies List */}
      <div className="space-y-4">
        {policies.map((policy) => (
          <div
            key={policy.id}
            className="p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800"
          >
            {/* Policy Header */}
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {policy.name}
              </h3>
              {policy.description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {policy.description}
                </p>
              )}
            </div>

            {/* Policy Statements */}
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="mb-2 text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                Policy Statements
              </div>
              <div className="overflow-x-auto">
                <pre className="text-sm text-gray-700 dark:text-gray-300">
                  {JSON.stringify(policy.statements, null, 2)}
                </pre>
              </div>
            </div>

            {/* Statement Summary */}
            <div className="flex flex-wrap gap-2 mt-4">
              {policy.statements.map((stmt, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md ${
                    stmt.Effect === 'Allow'
                      ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400'
                      : 'bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-400'
                  }`}
                >
                  {stmt.Effect}: {stmt.Actions.length} action(s) on{' '}
                  {stmt.Resources.length} resource(s)
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {policies.length === 0 && (
        <div className="p-12 text-center bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
          <svg
            className="w-12 h-12 mx-auto text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No policies found
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Get started by creating your first policy
          </p>
        </div>
      )}
    </div>
  )
}
