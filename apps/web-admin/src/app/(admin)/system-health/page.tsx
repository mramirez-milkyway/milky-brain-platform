'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import PermissionGuard from '@/components/PermissionGuard'
import { apiClient } from '@/lib/api-client'

interface SystemLog {
  id: number
  context: string
  errorMessage: string
  createdAt: string
}

interface SystemLogListResponse {
  data: SystemLog[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function SystemHealthContent() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [contextFilter, setContextFilter] = useState<string>('')
  const pageSize = 20

  // Fetch available contexts for filter dropdown
  const { data: contexts = [] } = useQuery<string[]>({
    queryKey: ['system-health-contexts'],
    queryFn: async () => {
      const response = await apiClient.get('/system-health/contexts')
      return response.data
    },
  })

  // Fetch system logs
  const { data, isLoading, error } = useQuery<SystemLogListResponse>({
    queryKey: ['system-health-logs', page, pageSize, contextFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      })
      if (contextFilter) {
        params.append('context', contextFilter)
      }
      const response = await apiClient.get(`/system-health/logs?${params}`)
      return response.data
    },
  })

  const handleRowClick = (logId: number) => {
    router.push(`/system-health/${logId}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Health</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            View system errors and unhandled exceptions for troubleshooting
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Context:</label>
          <select
            value={contextFilter}
            onChange={(e) => {
              setContextFilter(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Contexts</option>
            {contexts.map((ctx) => (
              <option key={ctx} value={ctx}>
                {ctx}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Logs Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            System Error Logs
            {data && <span className="ml-2 text-sm font-normal text-gray-500">({data.total} total)</span>}
          </h3>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
            </div>
          ) : error ? (
            <div className="py-10 text-center">
              <p className="text-red-600 dark:text-red-400">Failed to load system logs</p>
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mb-4 text-5xl">
                <svg
                  className="w-16 h-16 mx-auto text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">All Systems Healthy</p>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                No unhandled exceptions have been logged.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="px-6 py-3">Context</th>
                      <th className="px-6 py-3">Error Message</th>
                      <th className="px-6 py-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => handleRowClick(log.id)}
                        className="border-b border-gray-200 cursor-pointer dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            {log.context}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 max-w-md truncate">
                          {log.errorMessage}
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Page {data.page} of {data.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                      disabled={page === data.totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SystemHealthPage() {
  return (
    <PermissionGuard permission="systemHealth:Read">
      <SystemHealthContent />
    </PermissionGuard>
  )
}
