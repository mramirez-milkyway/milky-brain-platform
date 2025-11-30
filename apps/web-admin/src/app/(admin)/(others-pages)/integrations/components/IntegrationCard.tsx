'use client'

import React from 'react'
import Image from 'next/image'
import ProgressBar from '@/components/progress-bar/ProgressBar'

type IntegrationCardProps = {
  provider: string
  totalQuota: number
  remainingQuota: number
  usedQuota: number
  usagePercentage: number
  status: 'active' | 'error' | 'inactive'
  errorMessage?: string
  reloadInfo?: string
  onRetry?: () => void
}

export default function IntegrationCard({
  provider,
  totalQuota,
  remainingQuota,
  usedQuota,
  usagePercentage,
  status,
  errorMessage,
  reloadInfo,
  onRetry,
}: IntegrationCardProps) {
  const statusColors = {
    active: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200',
    error: 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  }

  const getProgressColor = () => {
    if (status !== 'active') return 'bg-gray-400'
    if (usagePercentage >= 90) return 'bg-error-500'
    if (usagePercentage >= 70) return 'bg-warning-500'
    return 'bg-success-500'
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            {provider === 'IMAI' ? (
              <Image
                src="/images/integrations/imai-logo.png"
                alt="IMAI Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            ) : (
              <span className="text-2xl">🔌</span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{provider}</h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      {status === 'error' || status === 'inactive' ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">{errorMessage}</p>
          {onRetry && status === 'error' && (
            <button
              onClick={onRetry}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Quota Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Quota</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalQuota.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">credits</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {remainingQuota.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">credits</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Usage</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {usagePercentage.toFixed(1)}%
              </span>
            </div>
            <div className="relative w-full bg-gray-200 rounded-full h-3 dark:bg-gray-800">
              <div
                className={`absolute left-0 h-full rounded-full ${getProgressColor()}`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {usedQuota.toLocaleString()} / {totalQuota.toLocaleString()} credits used
            </p>
          </div>

          {/* Reload Info */}
          {reloadInfo && (
            <div className="mt-4 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
              <p className="text-xs text-brand-700 dark:text-brand-300 flex items-center gap-2">
                <span className="text-base">ℹ️</span>
                {reloadInfo}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
