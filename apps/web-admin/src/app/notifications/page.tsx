'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

interface Notification {
  id: number
  userId: number
  type: string
  payload: {
    title: string
    message: string
  }
  readAt: string | null
  createdAt: string
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications')
      return res.data
    },
  })

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return await apiClient.post(`/notifications/${notificationId}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  const notifications: Notification[] = notificationsData?.notifications || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Stay updated with your activity
        </p>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="p-12 text-center bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
            <svg
              className="w-12 h-12 mx-auto text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No notifications
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              You're all caught up!
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-6 bg-white border rounded-lg dark:bg-gray-900 ${
                !notification.readAt
                  ? 'border-brand-500 dark:border-brand-700'
                  : 'border-gray-200 dark:border-gray-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {notification.payload.title}
                    </h3>
                    {!notification.readAt && (
                      <span className="inline-flex w-2 h-2 bg-brand-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    {notification.payload.message}
                  </p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                {!notification.readAt && (
                  <button
                    onClick={() => markReadMutation.mutate(notification.id)}
                    disabled={markReadMutation.isPending}
                    className="ml-4 text-sm text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300 disabled:opacity-50"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
