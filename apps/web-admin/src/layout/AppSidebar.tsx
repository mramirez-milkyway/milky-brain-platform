'use client'
import React, { useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSidebar } from '../context/SidebarContext'
import { useAuthStore } from '@/lib/auth-store'
import {
  GridIcon,
  HorizontaLDots,
  UserCircleIcon,
  PageIcon,
  PieChartIcon,
  TableIcon,
} from '../icons/index'

type NavItem = {
  name: string
  icon: React.ReactNode
  path: string
  permission?: string // Optional permission required to see this item
}

// Main navigation items matching the API navigation service
const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: 'Dashboard',
    path: '/',
    // No permission required - everyone can access dashboard
  },
  {
    icon: <UserCircleIcon />,
    name: 'Users',
    path: '/users',
    permission: 'user:Read', // Only users with user:Read permission
  },
  {
    icon: <PageIcon />,
    name: 'Roles',
    path: '/roles',
    permission: 'role:Read', // Only users with role:Read permission
  },
  {
    icon: <TableIcon />,
    name: 'Policies',
    path: '/policies',
    permission: 'policy:Read', // Only users with policy:Read permission
  },
  {
    icon: <PieChartIcon />,
    name: 'Audit Log',
    path: '/audit',
    permission: 'audit:Read', // Only users with audit:Read permission (typically Admin only)
  },
]

// Additional navigation items
const additionalItems: NavItem[] = [
  {
    icon: <PageIcon />,
    name: 'Settings',
    path: '/settings',
    permission: 'settings:Read', // Only users with settings:Read permission
  },
  {
    icon: <GridIcon />,
    name: 'Notifications',
    path: '/notifications',
    // No permission required for now
  },
]

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar()
  const pathname = usePathname()
  const hasPermission = useAuthStore((state) => state.hasPermission)

  const isActive = useCallback((path: string) => path === pathname, [pathname])

  // Filter navigation items based on user permissions
  const filteredNavItems = useMemo(
    () => navItems.filter((item) => !item.permission || hasPermission(item.permission)),
    [hasPermission]
  )

  const filteredAdditionalItems = useMemo(
    () => additionalItems.filter((item) => !item.permission || hasPermission(item.permission)),
    [hasPermission]
  )

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-1">
      {items.map((nav) => (
        <li key={nav.name}>
          <Link
            href={nav.path}
            className={`menu-item group ${
              isActive(nav.path) ? 'menu-item-active' : 'menu-item-inactive'
            } ${!isExpanded && !isHovered ? 'lg:justify-center' : 'lg:justify-start'}`}
          >
            <span
              className={`${
                isActive(nav.path) ? 'menu-item-icon-active' : 'menu-item-icon-inactive'
              }`}
            >
              {nav.icon}
            </span>
            {(isExpanded || isHovered || isMobileOpen) && (
              <span className={`menu-item-text`}>{nav.name}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )

  return (
    <aside
      className={`fixed flex flex-col xl:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-full transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${isExpanded || isMobileOpen ? 'w-[290px]' : isHovered ? 'w-[290px]' : 'w-[90px]'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        xl:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${!isExpanded && !isHovered ? 'xl:justify-center' : 'justify-start'}`}
      >
        <Link href="/app">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <Image src="/images/logo/logo-icon.svg" alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              {filteredNavItems.length > 0 && (
                <>
                  <h2
                    className={`mb-4 text-xs uppercase flex leading-5 text-gray-400 ${
                      !isExpanded && !isHovered ? 'xl:justify-center' : 'justify-start'
                    }`}
                  >
                    {isExpanded || isHovered || isMobileOpen ? 'Menu' : <HorizontaLDots />}
                  </h2>
                  {renderMenuItems(filteredNavItems)}
                </>
              )}
            </div>
            <div>
              {filteredAdditionalItems.length > 0 && (
                <>
                  <h2
                    className={`mb-4 text-xs uppercase flex leading-5 text-gray-400 ${
                      !isExpanded && !isHovered ? 'xl:justify-center' : 'justify-start'
                    }`}
                  >
                    {isExpanded || isHovered || isMobileOpen ? 'System' : <HorizontaLDots />}
                  </h2>
                  {renderMenuItems(filteredAdditionalItems)}
                </>
              )}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  )
}

export default AppSidebar
