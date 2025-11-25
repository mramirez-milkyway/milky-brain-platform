import { create } from 'zustand'
import { apiClient } from './api-client'

interface User {
  id: number
  email: string
  name: string
  status: string
  picture?: string
}

interface Permission {
  policy: string
  actions: string[]
  resources: string[]
}

interface AuthState {
  user: User | null
  permissions: Permission[]
  isAuthenticated: boolean
  tokenRefreshTimer: NodeJS.Timeout | null
  setUser: (user: User | null) => void
  setPermissions: (permissions: Permission[]) => void
  hasPermission: (action: string) => boolean
  canAccessRoute: (path: string) => boolean
  logout: () => void
  startProactiveRefresh: () => void
  stopProactiveRefresh: () => void
}

// Role-based permission mapping (simplified - matches backend RBAC)
const ROLE_PERMISSIONS: Record<string, string[]> = {
  Admin: ['*'], // All permissions
  Editor: [
    'user:Read',
    'user:Write',
    'user:Update',
    'user:Invite',
    'role:Read',
    'policy:Read',
    'notification:Read',
    'notification:Write',
    'navigation:Read',
    'influencer:Read',
    'influencer:Export',
  ],
  Viewer: [
    'user:Read',
    'role:Read',
    'policy:Read',
    'settings:Read',
    'notification:Read',
    'navigation:Read',
    'influencer:Read',
    'influencer:Export',
  ],
}

// Route to permission mapping
export const ROUTE_PERMISSIONS: Record<string, string> = {
  '/users': 'user:Write', // User management requires write access
  '/users/invite': 'user:Create',
  '/roles': 'role:Read',
  '/policies': 'policy:Read',
  '/settings': 'settings:Write', // Only Admin can access settings
  '/audit': 'audit:Read',
  '/navigation': 'navigation:Read',
  '/influencers': 'influencer:Read',
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  permissions: [],
  isAuthenticated: false,
  tokenRefreshTimer: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setPermissions: (permissions) => set({ permissions }),

  /**
   * Check if user has a specific permission
   * Supports wildcards: 'user:*', '*'
   */
  hasPermission: (action: string): boolean => {
    const { permissions, user } = get()

    if (!user) return false

    // If no permissions loaded yet, deny access (safer default)
    if (!permissions || permissions.length === 0) {
      console.warn('No permissions loaded yet for user', user.email)
      return false // Deny until permissions load
    }

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Checking permission:', action, 'Available permissions:', permissions)
    }

    // Check if any permission matches
    return permissions.some((perm) => {
      // Check for wildcard permissions
      if (perm.actions.includes('*')) return true

      // Check for specific action
      if (perm.actions.includes(action)) return true

      // Check for resource-level wildcards (e.g., 'user:*' matches 'user:Read')
      const [resource] = action.split(':')
      const wildcardAction = `${resource}:*`
      if (perm.actions.includes(wildcardAction)) return true

      return false
    })
  },

  /**
   * Check if user can access a specific route
   */
  canAccessRoute: (path: string): boolean => {
    const requiredPermission = ROUTE_PERMISSIONS[path]
    if (!requiredPermission) return true // No permission required

    return get().hasPermission(requiredPermission)
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      get().stopProactiveRefresh()
      set({ user: null, permissions: [], isAuthenticated: false })
    }
  },

  /**
   * Start proactive token refresh (5 minutes before expiration)
   * Access tokens expire in 12 hours, so refresh after ~11 hours 55 minutes
   */
  startProactiveRefresh: () => {
    const { tokenRefreshTimer } = get()

    // Clear existing timer
    if (tokenRefreshTimer) {
      clearInterval(tokenRefreshTimer)
    }

    // Refresh every 11 hours 55 minutes (5 minutes before 12-hour expiration)
    const refreshInterval = (11 * 60 + 55) * 60 * 1000 // 11h 55m in milliseconds

    const timer = setInterval(async () => {
      try {
        await apiClient.post('/auth/refresh')
        console.log('Token refreshed proactively')
      } catch (error) {
        console.error('Proactive token refresh failed:', error)
        get().stopProactiveRefresh()
      }
    }, refreshInterval)

    set({ tokenRefreshTimer: timer })
  },

  /**
   * Stop proactive token refresh
   */
  stopProactiveRefresh: () => {
    const { tokenRefreshTimer } = get()
    if (tokenRefreshTimer) {
      clearInterval(tokenRefreshTimer)
      set({ tokenRefreshTimer: null })
    }
  },
}))
