'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useState } from 'react'
import Button from '@/components/ui/button/Button'
import PermissionGuard from '@/components/PermissionGuard'
import ExportQuotaIndicator from '@/components/export/ExportQuotaIndicator'

interface Influencer {
  id: number
  name: string
  platform: string
  followers: number
  engagement: number
  category: string
}

// Platform icon component
const PlatformIcon = ({ platform }: { platform: string }) => {
  const platformLower = platform.toLowerCase()

  if (platformLower === 'tiktok') {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    )
  } else if (platformLower === 'youtube') {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  } else if (platformLower === 'instagram') {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    )
  }

  // Default social icon
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </svg>
  )
}

function InfluencersContent() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)

  // Fetch influencers
  const { data: influencersData, isLoading } = useQuery({
    queryKey: ['influencers', page],
    queryFn: async () => {
      const res = await apiClient.get(`/influencers?page=${page}&pageSize=20`)
      return res.data
    },
  })

  const influencers: Influencer[] = influencersData?.data || []
  const totalPages = influencersData?.totalPages || 1

  // Export PDF
  const handleExportPdf = async () => {
    try {
      setIsExporting(true)
      const response = await apiClient.get('/influencers/export/pdf', {
        responseType: 'blob',
      })

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url

      // Get filename from headers or use default
      const contentDisposition = response.headers['content-disposition']
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `influencer-list-${new Date().toISOString().split('T')[0]}.pdf`

      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()

      // Refresh quota after successful export
      queryClient.invalidateQueries({ queryKey: ['userQuota'] })

      // Show success message
      alert('PDF exported successfully!')
    } catch (error: any) {
      if (error.response?.status === 429) {
        alert(error.response?.data?.message || 'Export limit reached. Please try again later.')
      } else if (error.response?.status === 403) {
        alert('You do not have permission to export.')
      } else {
        alert('Failed to export PDF. Please try again.')
      }
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
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
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Influencer List</h1>
            <span className="px-3 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full dark:bg-yellow-900 dark:text-yellow-300">
              Mock Data - For Testing Only
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Test export controls with mock influencer data
          </p>
        </div>
      </div>

      {/* Export Quota Indicator */}
      <ExportQuotaIndicator exportType="influencer_list" />

      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleExportPdf}
          disabled={isExporting}
          className="flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Platform</th>
                <th className="px-6 py-3">Followers</th>
                <th className="px-6 py-3">Engagement %</th>
                <th className="px-6 py-3">Category</th>
              </tr>
            </thead>
            <tbody>
              {influencers.map((influencer) => (
                <tr
                  key={influencer.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {influencer.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <PlatformIcon platform={influencer.platform} />
                      <span>{influencer.platform}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {influencer.followers.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {influencer.engagement}%
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {influencer.category}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages}
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
        )}
      </div>
    </div>
  )
}

export default function InfluencersPage() {
  return (
    <PermissionGuard permission="influencer:Read">
      <InfluencersContent />
    </PermissionGuard>
  )
}
