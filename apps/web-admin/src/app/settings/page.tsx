'use client'

import { useState } from 'react'
import PermissionGuard from '@/components/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'
import GeneralSettings from './components/GeneralSettings'
import ExportControlsSettings from './components/ExportControlsSettings'

type TabId = 'general' | 'export-controls'

function SettingsContent() {
  const [activeTab, setActiveTab] = useState<TabId>('general')
  const { hasPermission } = usePermission()

  const tabs: Array<{ id: TabId; label: string; permission?: string }> = [
    { id: 'general', label: 'General' },
    { id: 'export-controls', label: 'Export Controls', permission: 'exportControl:Read' },
  ]

  const visibleTabs = tabs.filter((tab) => !tab.permission || hasPermission(tab.permission))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage your organization and system settings
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex -mb-px space-x-8" aria-label="Tabs">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'export-controls' && hasPermission('exportControl:Read') && (
          <ExportControlsSettings />
        )}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <PermissionGuard permission="settings:Write">
      <SettingsContent />
    </PermissionGuard>
  )
}
