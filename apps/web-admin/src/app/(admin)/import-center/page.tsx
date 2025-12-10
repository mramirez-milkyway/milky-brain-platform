'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import CsvUpload, { ImportType } from '@/components/import/CsvUpload'
import JobHistoryPanel from '@/components/import/JobHistoryPanel'
import PermissionGuard from '@/components/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'

const VALID_IMPORT_TYPES: ImportType[] = ['influencer_import', 'client_import']

function ImportCenterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { hasPermission } = usePermission() as { hasPermission: (action: string) => boolean }

  const canImportInfluencers = hasPermission('influencer:Import')
  const canImportClients = hasPermission('client:Import')

  // Define available import types based on permissions
  const allImportTypes: { value: ImportType; label: string; permission: boolean }[] = [
    {
      value: 'influencer_import' as const,
      label: 'Influencer Import',
      permission: canImportInfluencers,
    },
    { value: 'client_import' as const, label: 'Client Import', permission: canImportClients },
  ]
  const availableImportTypes = allImportTypes.filter((type) => type.permission)

  // Get import type from URL or default to first available
  const typeParam = searchParams.get('type')
  const getValidImportType = (): ImportType => {
    if (
      typeParam &&
      VALID_IMPORT_TYPES.includes(typeParam as ImportType) &&
      availableImportTypes.some((t) => t.value === typeParam)
    ) {
      return typeParam as ImportType
    }
    return availableImportTypes[0]?.value || 'influencer_import'
  }
  const selectedImportType = getValidImportType()

  // Update URL when import type changes
  const handleImportTypeChange = (type: ImportType) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('type', type)
    router.push(`?${params.toString()}`, { scroll: false })
  }

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
            Upload CSV files to import data into the system
          </p>
        </div>
      </div>

      {/* Import Type Selector */}
      {availableImportTypes.length > 1 && (
        <div className="flex gap-2">
          {availableImportTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => handleImportTypeChange(type.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedImportType === type.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      )}

      {/* Upload Section */}
      <CsvUpload onSuccess={handleImportSuccess} importType={selectedImportType} />

      {/* Job History Section */}
      <JobHistoryPanel refreshTrigger={refreshTrigger} importType={selectedImportType} />
    </div>
  )
}

export default function ImportCenterPage() {
  return (
    <PermissionGuard permission={['influencer:Import', 'client:Import']} requireAll={false}>
      <ImportCenterContent />
    </PermissionGuard>
  )
}
