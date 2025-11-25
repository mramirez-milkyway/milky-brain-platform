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
    permission: 'user:Write', // Only users with user management permissions (Admin, Editor)
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
  {
    icon: <UserCircleIcon />,
    name: 'Influencers',
    path: '/influencers',
    permission: 'influencer:Read', // Only users with influencer:Read permission
  },
]

// Additional navigation items
const additionalItems: NavItem[] = [
  {
    icon: <PageIcon />,
    name: 'Settings',
    path: '/settings',
    permission: 'settings:Write', // Only Admin can access settings (Write implies manage permission)
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
  // CRITICAL: Subscribe to permissions to trigger re-renders when they change
  const permissions = useAuthStore((state) => state.permissions)

  console.log('AppSidebar render - Permissions:', permissions)

  const isActive = useCallback((path: string) => path === pathname, [pathname])

  // Filter navigation items based on user permissions
  // CRITICAL: Compute hasPermission check inline using permissions directly
  // This ensures the filter runs whenever permissions change
  const filteredNavItems = useMemo(() => {
    console.log('Filtering nav items with permissions:', permissions)
    return navItems.filter((item) => {
      if (!item.permission) return true

      // Inline permission check to ensure it uses current permissions
      return permissions.some((perm) => {
        if (perm.actions.includes('*')) return true
        if (perm.actions.includes(item.permission!)) return true

        const [resource] = item.permission!.split(':')
        const wildcardAction = `${resource}:*`
        if (perm.actions.includes(wildcardAction)) return true

        return false
      })
    })
  }, [permissions])

  const filteredAdditionalItems = useMemo(() => {
    console.log('Filtering additional items with permissions:', permissions)
    return additionalItems.filter((item) => {
      if (!item.permission) return true

      // Inline permission check to ensure it uses current permissions
      return permissions.some((perm) => {
        if (perm.actions.includes('*')) return true
        if (perm.actions.includes(item.permission!)) return true

        const [resource] = item.permission!.split(':')
        const wildcardAction = `${resource}:*`
        if (perm.actions.includes(wildcardAction)) return true

        return false
      })
    })
  }, [permissions])

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
        <Link href="/">
          <Image
            src="/images/logo/milkyway-logo.svg"
            alt="Milky Way Agency"
            width={isExpanded || isHovered || isMobileOpen ? 150 : 32}
            height={isExpanded || isHovered || isMobileOpen ? 40 : 32}
            className="dark:hidden transition-all duration-300"
          />
          <Image
            src="/images/logo/milkyway-logo-white.svg"
            alt="Milky Way Agency"
            width={isExpanded || isHovered || isMobileOpen ? 150 : 32}
            height={isExpanded || isHovered || isMobileOpen ? 40 : 32}
            className="hidden dark:block transition-all duration-300"
          />
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
