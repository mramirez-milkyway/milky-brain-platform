'use client'

import { Fragment } from 'react'

interface AuditDetailModalProps {
  event: any
  isOpen: boolean
  onClose: () => void
}

export function AuditDetailModal({ event, isOpen, onClose }: AuditDetailModalProps) {
  if (!isOpen || !event) return null

  const formatJson = (data: any) => {
    if (!data) return 'N/A'
    if (typeof data === 'string') return data
    return JSON.stringify(data, null, 2)
  }

  const isSensitive = (key: string) => {
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'accessToken']
    return sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))
  }

  const renderStateComparison = () => {
    if (!event.beforeState && !event.afterState) {
      return <p className="text-sm text-gray-500">No data changes recorded</p>
    }

    if (event.beforeState && event.afterState) {
      // Show what changed
      const beforeKeys = Object.keys(event.beforeState || {})
      const afterKeys = Object.keys(event.afterState || {})
      const allKeys = [...new Set([...beforeKeys, ...afterKeys])]

      const changes = allKeys.filter((key) => {
        if (isSensitive(key)) return false
        const before = event.beforeState?.[key]
        const after = event.afterState?.[key]
        return JSON.stringify(before) !== JSON.stringify(after)
      })

      if (changes.length === 0) {
        return <p className="text-sm text-gray-500">No significant changes detected</p>
      }

      return (
        <div className="space-y-4">
          {changes.map((key) => (
            <div key={key} className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm font-semibold text-gray-700 mb-1">{key}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500 uppercase">Before</span>
                  <pre className="mt-1 text-sm bg-red-50 text-red-900 p-2 rounded overflow-x-auto">
                    {formatJson(event.beforeState?.[key])}
                  </pre>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase">After</span>
                  <pre className="mt-1 text-sm bg-green-50 text-green-900 p-2 rounded overflow-x-auto">
                    {formatJson(event.afterState?.[key])}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Only beforeState or afterState
    const state = event.beforeState || event.afterState
    const filteredState = Object.keys(state || {}).reduce((acc, key) => {
      if (!isSensitive(key)) {
        acc[key] = state[key]
      }
      return acc
    }, {} as any)

    return (
      <pre className="text-sm bg-gray-50 p-4 rounded overflow-x-auto">
        {formatJson(filteredState)}
      </pre>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        {/* Modal panel */}
        <div
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Audit Event Details</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-6">
            {/* Description */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Activity</h4>
              <p className="text-base text-gray-900 bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                {event.description || 'No description available'}
              </p>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">User</h4>
                <p className="text-sm text-gray-900">{event.actor?.name || `User ${event.actorId}`}</p>
                <p className="text-xs text-gray-500">{event.actor?.email}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Timestamp</h4>
                <p className="text-sm text-gray-900">
                  {new Date(event.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Action</h4>
                <p className="text-sm text-gray-900 font-mono">{event.action}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">IP Address</h4>
                <p className="text-sm text-gray-900 font-mono">{event.ipAddress || 'N/A'}</p>
              </div>
              {event.entityType && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Entity</h4>
                  <p className="text-sm text-gray-900">
                    {event.entityType}
                    {event.entityId && ` #${event.entityId}`}
                  </p>
                </div>
              )}
            </div>

            {/* Changes */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Changes</h4>
              {renderStateComparison()}
            </div>

            {/* Technical Details (collapsed by default) */}
            <details className="border rounded">
              <summary className="px-4 py-2 bg-gray-50 cursor-pointer text-sm font-semibold text-gray-700">
                Technical Details
              </summary>
              <div className="p-4 space-y-2">
                <div>
                  <span className="text-xs text-gray-500 uppercase">Event ID:</span>
                  <p className="text-sm font-mono">{event.id}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase">Hash:</span>
                  <p className="text-sm font-mono text-xs break-all">{event.hash}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase">User Agent:</span>
                  <p className="text-sm font-mono text-xs">{event.userAgent || 'N/A'}</p>
                </div>
              </div>
            </details>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
