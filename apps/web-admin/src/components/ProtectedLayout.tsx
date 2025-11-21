'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/lib/auth-store'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { setUser, setPermissions, startProactiveRefresh, stopProactiveRefresh } = useAuthStore()

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await apiClient.get('/auth/me')
      return res.data
    },
    retry: false,
  })

  // Fetch permissions
  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await apiClient.get('/auth/me/permissions')
      console.log('Fetched permissions:', res.data.permissions) // Debug log
      return res.data.permissions
    },
    retry: false,
    enabled: !!userData, // Only fetch if user is authenticated
    staleTime: Infinity, // Never mark as stale - permissions don't change during session
    refetchOnMount: false, // Don't refetch on every mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
  })

  useEffect(() => {
    if (userData) {
      setUser(userData)
    } else if (!userLoading) {
      router.push('/login')
    }
  }, [userData, userLoading, setUser, router])

  useEffect(() => {
    if (permissionsData) {
      console.log('Setting permissions in store:', permissionsData)
      setPermissions(permissionsData)
    }
  }, [permissionsData, setPermissions])

  // Start proactive token refresh when user is authenticated
  useEffect(() => {
    if (userData) {
      startProactiveRefresh()
    }

    return () => {
      stopProactiveRefresh()
    }
  }, [userData, startProactiveRefresh, stopProactiveRefresh])

  const isLoading = userLoading || permissionsLoading

  // Don't render children until both user AND permissions are loaded
  if (isLoading || !userData || !permissionsData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-lg text-gray-700 dark:text-gray-300">
          {userLoading
            ? 'Loading user...'
            : permissionsLoading
              ? 'Loading permissions...'
              : 'Loading...'}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
