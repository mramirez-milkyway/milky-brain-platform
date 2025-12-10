'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { ImportType } from './CsvUpload'

interface JobHistoryPanelProps {
  refreshTrigger: number
  importType: ImportType
}

interface Job {
  id: number
  taskId: string
  jobType: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RETRYING'
  fileName: string | null
  createdAt: string
  completedAt: string | null
  result: {
    totalRows?: number
    successCount?: number
    errorCount?: number
    // Influencer import fields
    createdCreators?: number
    createdSocialAccounts?: number
    updatedSocialAccounts?: number
    // Client import fields
    createdClients?: number
    updatedClients?: number
    duplicateCount?: number
  } | null
}

const JOB_TYPE_LABELS: Record<ImportType, string> = {
  influencer_import: 'Influencer Import',
  client_import: 'Client Import',
}

export default function JobHistoryPanel({ refreshTrigger, importType }: JobHistoryPanelProps) {
  const router = useRouter()
  const [autoRefresh, setAutoRefresh] = useState(true)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['import-jobs', refreshTrigger, importType],
    queryFn: async () => {
      const response = await apiClient.get('/jobs', {
        params: {
          jobType: importType,
          pageSize: 50,
        },
      })
      return response.data
    },
    refetchInterval: autoRefresh ? 5000 : false, // Poll every 5 seconds if auto-refresh is on
  })

  const jobs: Job[] = data?.data || []
  const hasInProgressJobs = jobs.some(
    (job) => job.status === 'RUNNING' || job.status === 'PENDING' || job.status === 'RETRYING'
  )

  // Auto-enable refresh when there are in-progress jobs
  useEffect(() => {
    if (hasInProgressJobs && !autoRefresh) {
      setAutoRefresh(true)
    }
  }, [hasInProgressJobs, autoRefresh])

  const getStatusBadge = (status: Job['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex px-2 text-xs font-semibold leading-5 rounded-full bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400">
            Completed
          </span>
        )
      case 'RUNNING':
        return (
          <span className="inline-flex px-2 text-xs font-semibold leading-5 rounded-full bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400">
            <svg
              className="-ml-1 mr-1 inline h-3 w-3 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Running
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex px-2 text-xs font-semibold leading-5 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
            Pending
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex px-2 text-xs font-semibold leading-5 rounded-full bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-400">
            Failed
          </span>
        )
      case 'RETRYING':
        return (
          <span className="inline-flex px-2 text-xs font-semibold leading-5 rounded-full bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400">
            Retrying
          </span>
        )
      default:
        return (
          <span className="inline-flex px-2 text-xs font-semibold leading-5 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
            {status}
          </span>
        )
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {JOB_TYPE_LABELS[importType]} History
        </h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900"
            />
            Auto-refresh
          </label>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <svg
              className="h-8 w-8 animate-spin text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
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
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              No import jobs found. Upload a CSV file to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                    Job ID
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                    Results
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                    Completed At
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    onClick={() => router.push(`/import-center/${job.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-mono text-sm text-gray-900 dark:text-white">
                        {job.taskId.substring(0, 8)}...
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(job.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {job.fileName || 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {job.result ? (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-success-600 dark:text-success-400">
                            ✓ {job.result.successCount || 0}
                          </span>
                          {job.result.errorCount ? (
                            <span className="text-error-600 dark:text-error-400">
                              ✗ {job.result.errorCount}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                      {formatDate(job.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                      {job.completedAt ? formatDate(job.completedAt) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/import-center/${job.id}`)
                        }}
                        className="p-2 text-brand-600 transition-colors rounded-md hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20"
                        title="View Details"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
