import { useAuthStore } from '../lib/auth-store'

/**
 * Hook to check permissions for the current user
 *
 * @example
 * const hasCreatePermission = usePermission('user:Create')
 * const { hasPermission } = usePermission()
 * if (hasPermission('user:Delete')) { ... }
 */
export function usePermission(action?: string): boolean | { hasPermission: (action: string) => boolean } {
  const hasPermissionFn = useAuthStore((state) => state.hasPermission)

  // If action provided, return boolean directly
  if (action) {
    return hasPermissionFn(action)
  }

  // Otherwise return object with function
  return { hasPermission: hasPermissionFn }
}
