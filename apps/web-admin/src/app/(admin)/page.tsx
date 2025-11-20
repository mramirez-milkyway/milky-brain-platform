'use client'

import { useAuthStore } from '@/lib/auth-store'

export default function DashboardPage() {
  const { user } = useAuthStore()
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Welcome{user?.name ? `, ${user.name}` : ''}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {user?.email ? `Logged in as ${user.email}` : 'This is your main dashboard.'}
        </p>
      </div>

      {/* Placeholder Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Card 1 */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</h3>
            <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-brand-600 dark:text-brand-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">--</div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Placeholder</p>
        </div>

        {/* Card 2 */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Active Sessions
            </h3>
            <div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-900/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-success-600 dark:text-success-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">--</div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Placeholder</p>
        </div>

        {/* Card 3 */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</h3>
            <div className="w-10 h-10 rounded-lg bg-warning-100 dark:bg-warning-900/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-warning-600 dark:text-warning-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">--</div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Placeholder</p>
        </div>

        {/* Card 4 */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">System Status</h3>
            <div className="w-10 h-10 rounded-lg bg-error-100 dark:bg-error-900/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-error-600 dark:text-error-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">--</div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Placeholder</p>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-brand-500"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Activity placeholder - will be populated with real data
            </p>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-success-500"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Activity placeholder - will be populated with real data
            </p>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-warning-500"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Activity placeholder - will be populated with real data
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
