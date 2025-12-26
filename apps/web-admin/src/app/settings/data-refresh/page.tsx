'use client'

import PermissionGuard from '@/components/PermissionGuard'
import DataRefreshSettings from '../components/DataRefreshSettings'

export default function DataRefreshPage() {
  return (
    <PermissionGuard permission="settings:Write">
      <DataRefreshSettings />
    </PermissionGuard>
  )
}
