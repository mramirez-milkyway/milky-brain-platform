'use client'

import { ReactNode } from 'react'
import { usePermission } from '@/hooks/usePermission'
import AccessDenied from './AccessDenied'

interface PermissionGuardProps {
  permission: string | string[]
  children: ReactNode
  fallback?: ReactNode
  /** If true, all permissions are required. If false, any one permission is sufficient. Default: true */
  requireAll?: boolean
}

/**
 * PermissionGuard component
 *
 * Wraps content and only renders it if the user has the required permission(s).
 * Shows AccessDenied component by default, or a custom fallback if provided.
 *
 * @example
 * // Single permission
 * <PermissionGuard permission="user:Read">
 *   <UserManagementPage />
 * </PermissionGuard>
 *
 * @example
 * // Multiple permissions (any one is sufficient)
 * <PermissionGuard permission={['influencer:Import', 'client:Import']} requireAll={false}>
 *   <ImportCenterPage />
 * </PermissionGuard>
 */
export default function PermissionGuard({
  permission,
  children,
  fallback,
  requireAll = true,
}: PermissionGuardProps) {
  const { hasPermission } = usePermission() as { hasPermission: (action: string) => boolean }

  const permissions = Array.isArray(permission) ? permission : [permission]

  const hasAccess = requireAll
    ? permissions.every((p) => hasPermission(p))
    : permissions.some((p) => hasPermission(p))

  if (!hasAccess) {
    return <>{fallback || <AccessDenied />}</>
  }

  return <>{children}</>
}
