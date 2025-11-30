'use client'

import { useQuery } from '@tanstack/react-query'
import PermissionGuard from '@/components/PermissionGuard'
import { apiClient } from '@/lib/api-client'
import IntegrationCard from './components/IntegrationCard'

type IntegrationUsage = {
  provider: string
  totalQuota: number
  remainingQuota: number
  usedQuota: number
  usagePercentage: number
  status: 'active' | 'error' | 'inactive'
  errorMessage?: string
  reloadInfo?: string
}

type IntegrationsUsageResponse = {
  integrations: IntegrationUsage[]
}

function IntegrationsContent() {
  const { data, isLoading, error, refetch } = useQuery<IntegrationsUsageResponse>({
    queryKey: ['integrations-usage'],
    queryFn: async () => {
      const res = await apiClient.get('/integrations/usage')
      return res.data
    },
    refetchInterval: false, // Don't auto-refresh, use manual refresh button
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integrations</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Monitor quota and usage for external integrations
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integrations</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Monitor quota and usage for external integrations
          </p>
        </div>
        <div className="rounded-xl border border-error-200 bg-error-50 p-6 dark:border-error-800 dark:bg-error-900/20">
          <p className="text-sm text-error-800 dark:text-error-200">
            Failed to load integrations data. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-error-600 rounded-lg hover:bg-error-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integrations</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Monitor quota and usage for external integrations
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data?.integrations.map((integration) => (
          <IntegrationCard
            key={integration.provider}
            provider={integration.provider}
            totalQuota={integration.totalQuota}
            remainingQuota={integration.remainingQuota}
            usedQuota={integration.usedQuota}
            usagePercentage={integration.usagePercentage}
            status={integration.status}
            errorMessage={integration.errorMessage}
            reloadInfo={integration.reloadInfo}
            onRetry={() => refetch()}
          />
        ))}
      </div>

      {data?.integrations.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 dark:border-gray-800 dark:bg-gray-900 text-center">
          <p className="text-gray-600 dark:text-gray-400">No integrations configured</p>
        </div>
      )}
    </div>
  )
}

export default function IntegrationsPage() {
  return (
    <PermissionGuard permission="integration:Read">
      <IntegrationsContent />
    </PermissionGuard>
  )
}
