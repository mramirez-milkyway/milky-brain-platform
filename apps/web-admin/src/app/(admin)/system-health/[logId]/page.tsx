'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import PermissionGuard from '@/components/PermissionGuard'
import Button from '@/components/ui/button/Button'
import { apiClient } from '@/lib/api-client'

interface SystemLogDetail {
  id: number
  context: string
  errorMessage: string
  stackTrace: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

function SystemLogDetailContent() {
  const params = useParams()
  const router = useRouter()
  const logId = params?.logId as string

  const { data: log, isLoading, error } = useQuery<SystemLogDetail>({
    queryKey: ['system-log', logId],
    queryFn: async () => {
      const response = await apiClient.get(`/system-health/logs/${logId}`)
      return response.data
    },
    enabled: !!logId,
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatMetadata = (metadata: Record<string, unknown> | null) => {
    if (!metadata) return 'No metadata available'
    return JSON.stringify(metadata, null, 2)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  if (error || !log) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Log not found</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            The system log you are looking for does not exist or has been deleted.
          </p>
          <Button onClick={() => router.push('/system-health')} className="mt-4">
            Back to System Health
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/system-health')}
              className="p-2 text-gray-600 transition-colors rounded-md hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              System Log #{logId}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
              {log.context}
            </span>
          </div>
          <p className="mt-1 ml-11 text-sm text-gray-600 dark:text-gray-400">
            View full error details and stack trace
          </p>
        </div>
      </div>

      {/* Error Summary */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Error Summary</h3>

        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Context</p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">{log.context}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Timestamp</p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {formatDate(log.createdAt)}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Error Message</p>
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-900">
            <p className="text-red-800 dark:text-red-300 font-medium">{log.errorMessage}</p>
          </div>
        </div>
      </div>

      {/* Stack Trace */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Stack Trace</h3>
        <div className="p-4 overflow-x-auto bg-gray-900 rounded-lg">
          <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap break-words">
            {log.stackTrace || 'No stack trace available'}
          </pre>
        </div>
      </div>

      {/* Metadata */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Request Metadata
        </h3>
        <div className="p-4 overflow-x-auto bg-gray-50 rounded-lg dark:bg-gray-900">
          <pre className="text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">
            {formatMetadata(log.metadata)}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default function SystemLogDetailPage() {
  return (
    <PermissionGuard permission="systemHealth:Read">
      <SystemLogDetailContent />
    </PermissionGuard>
  )
}
