'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import Button from '@/components/ui/button/Button'
import Input from '@/components/form/input/InputField'
import Label from '@/components/form/Label'
import PermissionGuard from '@/components/PermissionGuard'

interface AuditEvent {
  id: number
  action: string
  description: string | null
  actorId: number
  actor: {
    name: string
    email: string
  } | null
  ipAddress: string | null
  userAgent: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

function AuditContent() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [userId, setUserId] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['auditLog', { startDate, endDate, userId }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (userId) params.append('userId', userId)
      params.append('limit', '100')

      const res = await apiClient.get(`/audit?${params.toString()}`)
      return res.data
    },
  })

  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
    setUserId('')
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportError('')

    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (userId) params.append('userId', userId)

      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      const url = `${baseURL}/audit/export?${params.toString()}`

      window.location.href = url
    } catch (error: unknown) {
      setExportError('Failed to export audit log')
    } finally {
      setIsExporting(false)
    }
  }

  const handleViewDetails = (event: AuditEvent) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  const events: AuditEvent[] = auditData?.events || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Log</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Tamper-evident activity log
          </p>
        </div>
        <Button size="sm" onClick={handleExport} disabled={isExporting}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      {exportError && (
        <div className="p-4 border rounded-lg bg-error-50 border-error-200 dark:bg-error-900/20 dark:border-error-800">
          <p className="text-sm text-error-800 dark:text-error-400">{exportError}</p>
        </div>
      )}

      {/* Filters */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <Label>User ID</Label>
            <Input
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Filter by user..."
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={handleClearFilters} className="w-full">
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                  Description
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                  Actor
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                  IP Address
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                    {new Date(event.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {event.description || event.action}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap dark:text-white">
                    {event.actor?.name || `User ${event.actorId}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                    {event.ipAddress || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                    <button
                      onClick={() => handleViewDetails(event)}
                      className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300"
                      title="View details"
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
      </div>

      {events.length === 0 && (
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No audit events found
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Try adjusting your filters
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-gray-400/50 backdrop-blur-[32px]">
          <div className="w-full max-w-2xl p-6 bg-white rounded-lg dark:bg-gray-900 relative">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Event Details</h2>
            <div className="space-y-4">
              <div>
                <Label>Action</Label>
                <p className="text-gray-900 dark:text-white">{selectedEvent.action}</p>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-gray-900 dark:text-white">
                  {selectedEvent.description || 'N/A'}
                </p>
              </div>
              <div>
                <Label>Actor</Label>
                <p className="text-gray-900 dark:text-white">
                  {selectedEvent.actor?.name} ({selectedEvent.actor?.email})
                </p>
              </div>
              <div>
                <Label>IP Address</Label>
                <p className="text-gray-900 dark:text-white">{selectedEvent.ipAddress || 'N/A'}</p>
              </div>
              <div>
                <Label>User Agent</Label>
                <p className="text-sm text-gray-700 break-all dark:text-gray-300">
                  {selectedEvent.userAgent || 'N/A'}
                </p>
              </div>
              <div>
                <Label>Metadata</Label>
                {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 ? (
                  <pre className="p-4 overflow-x-auto text-sm text-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-gray-300">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No metadata available
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AuditPage() {
  return (
    <PermissionGuard permission="audit:Read">
      <AuditContent />
    </PermissionGuard>
  )
}
