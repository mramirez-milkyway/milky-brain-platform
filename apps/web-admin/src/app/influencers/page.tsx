'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/button/Button'
import PermissionGuard from '@/components/PermissionGuard'

interface CreatorSocial {
  id: number
  socialMedia: string
  handle: string
  followers: number | null
  tier: string | null
  socialLink: string | null
}

interface Creator {
  id: number
  fullName: string
  country: string | null
  city: string | null
  categories: string | null
  isActive: boolean
  isBlacklisted: boolean
  creatorSocials: CreatorSocial[]
}

interface CreatorsResponse {
  data: Creator[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Platform icon component
const PlatformIcon = ({ platform }: { platform: string }) => {
  const platformLower = platform.toLowerCase()

  if (platformLower === 'tiktok') {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    )
  } else if (platformLower === 'youtube') {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  } else if (platformLower === 'instagram') {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    )
  }

  // Default social icon
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </svg>
  )
}

// Parse categories JSON string safely
function parseCategories(categories: string | null): string[] {
  if (!categories) return []
  try {
    const parsed = JSON.parse(categories)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // If not JSON, treat as comma-separated or single value
    return categories
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
  }
}

// Format followers count
function formatFollowers(count: number | null): string {
  if (count === null) return '-'
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

function CreatorsContent() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Fetch creators
  const { data: creatorsData, isLoading } = useQuery<CreatorsResponse>({
    queryKey: ['creators', page, pageSize],
    queryFn: async () => {
      const res = await apiClient.get(`/creators?page=${page}&pageSize=${pageSize}`)
      return res.data
    },
  })

  const creators: Creator[] = creatorsData?.data || []
  const totalPages = creatorsData?.totalPages || 1
  const total = creatorsData?.total || 0

  // Reset to page 1 when page size changes
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }

  const handleRowClick = (creatorId: number) => {
    router.push(`/influencers/${creatorId}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Creators</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {total} creators in database
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Categories</th>
                <th className="px-6 py-3">Social Accounts</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {creators.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    No creators found. Import creators to get started.
                  </td>
                </tr>
              ) : (
                creators.map((creator) => (
                  <tr
                    key={creator.id}
                    onClick={() => handleRowClick(creator.id)}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {creator.fullName}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {[creator.city, creator.country].filter(Boolean).join(', ') || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {parseCategories(creator.categories)
                          .slice(0, 3)
                          .map((category, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded dark:bg-blue-900 dark:text-blue-300"
                            >
                              {category}
                            </span>
                          ))}
                        {parseCategories(creator.categories).length > 3 && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded dark:bg-gray-700 dark:text-gray-400">
                            +{parseCategories(creator.categories).length - 3}
                          </span>
                        )}
                        {parseCategories(creator.categories).length === 0 && (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {creator.creatorSocials.slice(0, 3).map((social) => (
                          <div
                            key={social.id}
                            className="flex items-center gap-1 text-gray-700 dark:text-gray-300"
                            title={`${social.handle} - ${formatFollowers(social.followers)} followers`}
                          >
                            <PlatformIcon platform={social.socialMedia} />
                            <span className="text-xs">{formatFollowers(social.followers)}</span>
                          </div>
                        ))}
                        {creator.creatorSocials.length > 3 && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            +{creator.creatorSocials.length - 3}
                          </span>
                        )}
                        {creator.creatorSocials.length === 0 && (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {creator.isBlacklisted ? (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded dark:bg-red-900 dark:text-red-300">
                          Blacklisted
                        </span>
                      ) : creator.isActive ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded dark:bg-green-900 dark:text-green-300">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded dark:bg-gray-700 dark:text-gray-300">
                          Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-sm text-gray-700 dark:text-gray-300">
                Rows per page:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-2 py-1 text-sm border border-gray-300 rounded bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages} ({total} total)
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 text-sm"
            >
              Previous
            </Button>
            <Button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreatorsPage() {
  return (
    <PermissionGuard permission="creator:Read">
      <CreatorsContent />
    </PermissionGuard>
  )
}
