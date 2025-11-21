'use client'

import { ReactNode } from 'react'
import { usePermission } from '@/hooks/usePermission'
import AccessDenied from './AccessDenied'

interface PermissionGuardProps {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}

/**
 * PermissionGuard component
 *
 * Wraps content and only renders it if the user has the required permission.
 * Shows AccessDenied component by default, or a custom fallback if provided.
 *
 * @example
 * <PermissionGuard permission="user:Read">
 *   <UserManagementPage />
 * </PermissionGuard>
 */
export default function PermissionGuard({ permission, children, fallback }: PermissionGuardProps) {
  const hasPermission = usePermission(permission) as boolean

  if (!hasPermission) {
    return <>{fallback || <AccessDenied />}</>
  }

  return <>{children}</>
}
