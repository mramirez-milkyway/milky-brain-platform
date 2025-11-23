'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/lib/auth-store'

interface QuotaData {
  userId: number
  exportType: string
  rowLimit: number
  enableWatermark: boolean
  dailyLimit: number | null
  monthlyLimit: number | null
  dailyUsed: number
  monthlyUsed: number
  dailyRemaining: number | null
  monthlyRemaining: number | null
}

interface ExportQuotaIndicatorProps {
  exportType?: string
  className?: string
}

export default function ExportQuotaIndicator({ exportType = 'all', className = '' }: ExportQuotaIndicatorProps) {
  const { user } = useAuthStore()

  const { data: quotaData, isLoading } = useQuery<QuotaData>({
    queryKey: ['userQuota', user?.id, exportType],
    queryFn: async () => {
      const res = await apiClient.get(`/export-controls/quota/${user?.id}?exportType=${exportType}`)
      return res.data
    },
    enabled: !!user?.id,
  })

  if (isLoading || !quotaData) {
    return null
  }

  const isUnlimited = quotaData.rowLimit === -1
  const isDailyLimitApproaching = quotaData.dailyRemaining !== null && quotaData.dailyRemaining <= 2
  const isDailyLimitExhausted = quotaData.dailyRemaining !== null && quotaData.dailyRemaining <= 0
  const isMonthlyLimitExhausted = quotaData.monthlyRemaining !== null && quotaData.monthlyRemaining <= 0

  const limitExhausted = isDailyLimitExhausted || isMonthlyLimitExhausted

  return (
    <div
      className={`p-4 border rounded-lg ${
        limitExhausted
          ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
          : isDailyLimitApproaching
          ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
          : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
      } ${className}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg
            className={`w-5 h-5 ${
              limitExhausted
                ? 'text-red-600 dark:text-red-400'
                : isDailyLimitApproaching
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h4
            className={`text-sm font-medium ${
              limitExhausted
                ? 'text-red-800 dark:text-red-400'
                : isDailyLimitApproaching
                ? 'text-yellow-800 dark:text-yellow-400'
                : 'text-blue-800 dark:text-blue-400'
            }`}
          >
            Export Quota
          </h4>
          <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            {isUnlimited ? (
              <p>You can export <strong>unlimited rows</strong></p>
            ) : (
              <p>You can export up to <strong>{quotaData.rowLimit} rows</strong></p>
            )}

            {quotaData.dailyLimit !== null && (
              <p className="mt-1">
                {isDailyLimitExhausted ? (
                  <span className="text-red-600 dark:text-red-400">
                    Daily export limit reached ({quotaData.dailyLimit}/{quotaData.dailyLimit}). Resets at midnight UTC.
                  </span>
                ) : (
                  <>
                    Remaining today: <strong>{quotaData.dailyRemaining}/{quotaData.dailyLimit}</strong> exports
                    {isDailyLimitApproaching && <span className="ml-1">(limit approaching)</span>}
                  </>
                )}
              </p>
            )}

            {quotaData.monthlyLimit !== null && (
              <p className="mt-1">
                {isMonthlyLimitExhausted ? (
                  <span className="text-red-600 dark:text-red-400">
                    Monthly export limit reached ({quotaData.monthlyLimit}/{quotaData.monthlyLimit}). Resets on 1st of next month.
                  </span>
                ) : (
                  <>
                    Remaining this month: <strong>{quotaData.monthlyRemaining}/{quotaData.monthlyLimit}</strong> exports
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
