'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/lib/auth-store'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

interface AuthData {
  user: User
  permissions: Permission[]
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const {
    setUser,
    setPermissions,
    startProactiveRefresh,
    stopProactiveRefresh,
    user,
    permissions,
  } = useAuthStore()

  // Fetch both user AND permissions in a single atomic query
  // This eliminates race conditions by ensuring both are loaded together
  const {
    data: authData,
    isLoading,
    error,
  } = useQuery<AuthData>({
    queryKey: ['auth-data'],
    queryFn: async () => {
      console.log('Fetching user and permissions atomically...')

      // Fetch user
      const userRes = await apiClient.get('/auth/me')
      const userData = userRes.data

      // Fetch permissions
      const permissionsRes = await apiClient.get('/auth/me/permissions')
      const permissionsData = permissionsRes.data.permissions

      console.log('Fetched user:', userData)
      console.log('Fetched permissions:', permissionsData)

      return {
        user: userData,
        permissions: permissionsData,
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - not infinity to allow refetching
    refetchOnWindowFocus: false,
  })

  // Single useEffect to set both user and permissions atomically
  // This ensures Zustand store is updated in one synchronous batch
  useEffect(() => {
    if (authData) {
      console.log('Setting user and permissions in store atomically')
      // Update store in a single batch
      setUser(authData.user)
      setPermissions(authData.permissions)
    } else if (error) {
      console.error('Auth data fetch failed:', error)
      router.push('/login')
    }
  }, [authData, error, setUser, setPermissions, router])

  // Start proactive token refresh when user is authenticated
  useEffect(() => {
    if (authData?.user) {
      startProactiveRefresh()
    }

    return () => {
      stopProactiveRefresh()
    }
  }, [authData?.user, startProactiveRefresh, stopProactiveRefresh])

  // Don't render until BOTH:
  // 1. Query has completed successfully with data
  // 2. Zustand store has been populated (checked via selectors)
  const isStoreReady = user !== null && permissions.length >= 0

  if (isLoading || !authData || !isStoreReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-lg text-gray-700 dark:text-gray-300">
          {isLoading ? 'Loading authentication...' : 'Initializing...'}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
