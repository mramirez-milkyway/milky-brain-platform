'use client'

import PermissionGuard from '@/components/PermissionGuard'
import ExportControlsSettings from '../components/ExportControlsSettings'

export default function ExportControlsPage() {
  return (
    <PermissionGuard permission="exportControl:Read">
      <ExportControlsSettings />
    </PermissionGuard>
  )
}
