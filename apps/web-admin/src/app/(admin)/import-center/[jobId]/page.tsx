'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import PermissionGuard from '@/components/PermissionGuard'
import Button from '@/components/ui/button/Button'
import { apiClient } from '@/lib/api-client'

interface Job {
  id: number
  jobType: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  payload: Record<string, unknown>
  result?: {
    totalRecords?: number
    successCount?: number
    errorCount?: number
    createdCreators?: number
    updatedSocialAccounts?: number
  }
  createdAt: string
  startedAt?: string
  completedAt?: string
  errorMessage?: string
}

interface JobLog {
  id: number
  jobId: number
  level: 'INFO' | 'WARNING' | 'ERROR'
  message: string
  metadata?: {
    rowNumber?: number
    [key: string]: unknown
  }
  createdAt: string
}

function JobDetailContent() {
  const params = useParams()
  const router = useRouter()
  const jobId = params?.jobId as string
  const [logLevelFilter, setLogLevelFilter] = useState<string>('ALL')

  // Fetch job details
  const { data: job, isLoading: jobLoading } = useQuery<Job>({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const response = await apiClient.get(`/jobs/${jobId}`)
      return response.data
    },
    enabled: !!jobId,
  })

  // Fetch job logs
  const { data: logs = [], isLoading: logsLoading } = useQuery<JobLog[]>({
    queryKey: ['job-logs', jobId],
    queryFn: async () => {
      const response = await apiClient.get(`/jobs/${jobId}/logs`)
      return response.data
    },
    enabled: !!jobId,
  })

  // Filter logs by level
  const filteredLogs =
    logLevelFilter === 'ALL' ? logs : logs.filter((log) => log.level === logLevelFilter)

  // Export logs as CSV
  const handleExportLogs = () => {
    if (!logs || logs.length === 0) return

    const headers = ['Timestamp', 'Level', 'Message', 'Row Number', 'Metadata']
    const rows = logs.map((log) => [
      new Date(log.createdAt).toLocaleString(),
      log.level,
      `"${log.message.replace(/"/g, '""')}"`, // Escape quotes
      log.metadata?.rowNumber?.toString() || '',
      JSON.stringify(log.metadata || {}),
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `job_${jobId}_logs.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (jobLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Job not found</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            The job you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => router.push('/import-center')} className="mt-4">
            Back to Import Center
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'FAILED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'RUNNING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'PENDING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'text-red-600 dark:text-red-400'
      case 'WARNING':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'INFO':
        return 'text-blue-600 dark:text-blue-400'
      default:
        return 'text-gray-700 dark:text-gray-300'
    }
  }

  const errorCount = logs.filter((l) => l.level === 'ERROR').length
  const warningCount = logs.filter((l) => l.level === 'WARNING').length
  const infoCount = logs.filter((l) => l.level === 'INFO').length

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/import-center')}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job #{jobId}</h1>
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}
            >
              {job.status}
            </span>
          </div>
          <p className="mt-1 ml-11 text-sm text-gray-600 dark:text-gray-400">
            View detailed job information and logs
          </p>
        </div>
      </div>

      {/* Job Summary */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Job Summary</h3>

        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Job Type</p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {job.jobType.replace('_', ' ').toUpperCase()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {new Date(job.createdAt).toLocaleString()}
            </p>
          </div>
          {job.completedAt && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {new Date(job.completedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {job.result && (
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
              Import Results
            </h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Records</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {job.result.totalRecords || 0}
                </p>
              </div>
              <div className="p-4 border border-green-200 rounded-lg bg-green-50 dark:bg-green-900/20 dark:border-green-900">
                <p className="text-sm text-gray-600 dark:text-gray-400">Success</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {job.result.successCount || 0}
                </p>
              </div>
              <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-900">
                <p className="text-sm text-gray-600 dark:text-gray-400">Errors</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {job.result.errorCount || 0}
                </p>
              </div>
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900">
                <p className="text-sm text-gray-600 dark:text-gray-400">Created Creators</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {job.result.createdCreators || 0}
                </p>
              </div>
              <div className="p-4 border border-purple-200 rounded-lg bg-purple-50 dark:bg-purple-900/20 dark:border-purple-900">
                <p className="text-sm text-gray-600 dark:text-gray-400">Updated Socials</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {job.result.updatedSocialAccounts || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {job.errorMessage && (
          <div className="p-4 mt-6 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-900">
            <p className="text-sm font-semibold text-red-800 dark:text-red-400">Error Message</p>
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">{job.errorMessage}</p>
          </div>
        )}
      </div>

      {/* Job Logs */}
      <div className="bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col gap-4 p-6 border-b border-gray-200 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Job Logs ({filteredLogs.length})
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            {/* Log Level Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Filter:</label>
              <select
                value={logLevelFilter}
                onChange={(e) => setLogLevelFilter(e.target.value)}
                className="px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All ({logs.length})</option>
                <option value="ERROR">Errors ({errorCount})</option>
                <option value="WARNING">Warnings ({warningCount})</option>
                <option value="INFO">Info ({infoCount})</option>
              </select>
            </div>

            {/* Export Button */}
            <Button
              onClick={handleExportLogs}
              disabled={logs.length === 0}
              className="flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Export Logs</span>
            </Button>
          </div>
        </div>

        <div className="p-6">
          {logsLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="text-lg text-gray-600 dark:text-gray-400">Loading logs...</div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                {logs.length === 0
                  ? 'No logs available for this job.'
                  : `No ${logLevelFilter.toLowerCase()} logs found.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Level</th>
                    <th className="px-6 py-3">Row</th>
                    <th className="px-6 py-3">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${getLevelColor(log.level)}`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {log.metadata?.rowNumber ? `#${log.metadata.rowNumber}` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <p className={getLevelColor(log.level)}>{log.message}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function JobDetailPage() {
  return (
    <PermissionGuard permission="influencer:Import">
      <JobDetailContent />
    </PermissionGuard>
  )
}
