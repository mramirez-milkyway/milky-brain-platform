'use client'

import { useState } from 'react'
import CsvUpload from '@/components/import/CsvUpload'
import JobHistoryPanel from '@/components/import/JobHistoryPanel'
import PermissionGuard from '@/components/PermissionGuard'

function ImportCenterContent() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleImportSuccess = () => {
    // Trigger refresh of job history
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Import Center</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Upload CSV files to import creators and social accounts
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <CsvUpload onSuccess={handleImportSuccess} />

      {/* Job History Section */}
      <JobHistoryPanel refreshTrigger={refreshTrigger} />
    </div>
  )
}

export default function ImportCenterPage() {
  return (
    <PermissionGuard permission="influencer:Import">
      <ImportCenterContent />
    </PermissionGuard>
  )
}
