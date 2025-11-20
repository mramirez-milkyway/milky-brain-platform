'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/lib/auth-store'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { setUser } = useAuthStore()

  const { data: userData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await apiClient.get('/auth/me')
      return res.data
    },
    retry: false,
  })

  useEffect(() => {
    if (userData) {
      setUser(userData)
    } else if (!isLoading) {
      router.push('/login')
    }
  }, [userData, isLoading, setUser, router])

  if (isLoading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-lg text-gray-700 dark:text-gray-300">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}
