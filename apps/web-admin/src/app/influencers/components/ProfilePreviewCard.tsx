'use client'

import Image from 'next/image'
import Badge from '@/components/ui/badge/Badge'
import Button from '@/components/ui/button/Button'
import type { ImaiProfile } from '../hooks/useImaiProfileLookup'

// Platform icon components (reused from FilterBar)
const InstagramIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
)

const TikTokIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
)

const YouTubeIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
)

const CheckIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const XIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

type Platform = 'instagram' | 'tiktok' | 'youtube'

const PlatformIcons: Record<Platform, React.FC<{ className?: string }>> = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  youtube: YouTubeIcon,
}

const PlatformColors: Record<Platform, string> = {
  instagram: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500',
  tiktok: 'bg-black dark:bg-white dark:text-black',
  youtube: 'bg-red-600',
}

interface ProfilePreviewCardProps {
  profile: ImaiProfile | null
  isLoading: boolean
  isError: boolean
  errorMessage?: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Format follower count for display (e.g., 1.2M, 500K)
 */
function formatFollowers(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  }
  return count.toString()
}

/**
 * Loading skeleton for the profile preview
 */
export function ProfilePreviewSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] animate-pulse">
      <div className="flex items-start gap-4">
        {/* Avatar skeleton */}
        <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />

        {/* Content skeleton */}
        <div className="flex-1 space-y-3">
          {/* Name and badge */}
          <div className="flex items-center gap-2">
            <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Handle */}
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />

          {/* Bio */}
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Stats */}
          <div className="flex gap-6 pt-2">
            <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>

      {/* Button skeleton */}
      <div className="mt-6 flex justify-end gap-3">
        <div className="h-10 w-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="h-10 w-40 rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  )
}

/**
 * Error state when influencer is not found
 */
export function ProfileNotFoundCard({
  handle,
  platform,
  onCancel,
}: {
  handle: string
  platform: Platform
  onCancel: () => void
}) {
  const PlatformIcon = PlatformIcons[platform]

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
      <div className="flex items-start gap-4">
        {/* Error icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
          <XIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
            Influencer Not Found
          </h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            We couldn&apos;t find an influencer with the handle{' '}
            <span className="font-medium">@{handle}</span> on{' '}
            <span className="inline-flex items-center gap-1 font-medium">
              <PlatformIcon className="h-4 w-4" />
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </span>
            .
          </p>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            Please verify the handle is correct and try again.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={onCancel}>
          Try Another Handle
        </Button>
      </div>
    </div>
  )
}

/**
 * Profile preview card showing influencer details from IMAI lookup
 */
export function ProfilePreviewCard({
  profile,
  isLoading,
  isError,
  errorMessage,
  onConfirm,
  onCancel,
}: ProfilePreviewCardProps) {
  // Loading state
  if (isLoading) {
    return <ProfilePreviewSkeleton />
  }

  // Error or not found state
  if (isError || !profile) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
            <XIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
              {isError ? 'Error Looking Up Profile' : 'Influencer Not Found'}
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {errorMessage || 'We couldn\'t find this influencer. Please verify the handle and try again.'}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onCancel}>
            Try Another Handle
          </Button>
        </div>
      </div>
    )
  }

  const platform = profile.platform as Platform
  const PlatformIcon = PlatformIcons[platform]

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Is this the influencer you want to add?
      </div>

      {/* Profile content */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          {profile.profilePicUrl ? (
            <Image
              src={profile.profilePicUrl}
              alt={profile.fullName}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
              <span className="text-xl font-semibold text-gray-500 dark:text-gray-400">
                {profile.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Platform badge overlay */}
          <div
            className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-white ${PlatformColors[platform]}`}
          >
            <PlatformIcon className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Name and platform badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {profile.fullName}
            </h3>
            <Badge
              variant="light"
              size="sm"
              color={platform === 'youtube' ? 'error' : platform === 'tiktok' ? 'dark' : 'primary'}
              startIcon={<PlatformIcon className="h-3 w-3" />}
            >
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </Badge>
          </div>

          {/* Handle */}
          <p className="text-sm text-gray-500 dark:text-gray-400">@{profile.handle}</p>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {profile.bio}
            </p>
          )}

          {/* Stats */}
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatFollowers(profile.followers)}
              </span>
              <span className="ml-1 text-gray-500 dark:text-gray-400">followers</span>
            </div>
            {profile.engagementRate !== null && (
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {profile.engagementRate.toFixed(2)}%
                </span>
                <span className="ml-1 text-gray-500 dark:text-gray-400">engagement</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          No, Try Another
        </Button>
        <Button variant="primary" onClick={onConfirm} startIcon={<CheckIcon className="h-4 w-4" />}>
          Yes, This Is Correct
        </Button>
      </div>
    </div>
  )
}

export default ProfilePreviewCard
