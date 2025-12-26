'use client'

import { useSidebar } from '@/context/SidebarContext'
import AppHeader from '@/layout/AppHeader'
import AppSidebar from '@/layout/AppSidebar'
import Backdrop from '@/layout/Backdrop'
import ProtectedLayout from '@/components/ProtectedLayout'
import PermissionGuard from '@/components/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import React from 'react'

interface Tab {
  id: string
  label: string
  path: string
  permission?: string
}

const tabs: Tab[] = [
  {
    id: 'export-controls',
    label: 'Export Controls',
    path: '/settings/export-controls',
    permission: 'exportControl:Read',
  },
  {
    id: 'data-refresh',
    label: 'Data Refresh',
    path: '/settings/data-refresh',
    permission: 'settings:Write',
  },
]

function SettingsTabNavigation() {
  const pathname = usePathname()
  const permissionResult = usePermission()
  const hasPermission =
    typeof permissionResult === 'boolean' ? () => permissionResult : permissionResult.hasPermission

  const visibleTabs = tabs.filter((tab) => !tab.permission || hasPermission(tab.permission))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage your organization and system settings
        </p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex -mb-px space-x-8" aria-label="Tabs">
          {visibleTabs.map((tab) => {
            const isActive = pathname === tab.path
            return (
              <Link
                key={tab.id}
                href={tab.path}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    isActive
                      ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar()

  const mainContentMargin = isMobileOpen
    ? 'ml-0'
    : isExpanded || isHovered
      ? 'xl:ml-[290px]'
      : 'xl:ml-[90px]'

  return (
    <ProtectedLayout>
      <div className="min-h-screen xl:flex">
        <AppSidebar />
        <Backdrop />
        <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
          <AppHeader />
          <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
            <PermissionGuard permission="settings:Write">
              <div className="space-y-6">
                <SettingsTabNavigation />
                {children}
              </div>
            </PermissionGuard>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
