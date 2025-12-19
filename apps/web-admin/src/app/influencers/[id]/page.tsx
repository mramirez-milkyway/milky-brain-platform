'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useParams, useRouter } from 'next/navigation'
import Button from '@/components/ui/button/Button'
import PermissionGuard from '@/components/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'
import { useModal } from '@/hooks/useModal'
import { EditInfluencerModal, DeleteInfluencerModal } from '../components'

interface CreatorSocial {
  id: number
  socialMedia: string
  handle: string
  followers: number | null
  tier: string | null
  socialLink: string | null
}

interface CreatorDetail {
  id: number
  fullName: string
  gender: string | null
  country: string | null
  city: string | null
  email: string | null
  phoneNumber: string | null
  characteristics: string | null
  pastClients: string | null
  pastCampaigns: string | null
  comments: string | null
  isActive: boolean
  languages: string | null
  categories: string | null
  internalTags: string | null
  isBlacklisted: boolean
  blacklistReason: string | null
  agencyName: string | null
  managerName: string | null
  billingInfo: string | null
  lastBrand: string | null
  campaignsActive: number | null
  lastCampaignCompleted: string | null
  lastFee: string | null
  lastCpv: number | null
  lastCpm: number | null
  internalRating: number | null
  createdAt: string
  updatedAt: string
  creatorSocials: CreatorSocial[]
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

// Parse JSON string safely
function parseJsonArray(value: string | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return value
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
  return count.toLocaleString()
}

// Format date
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Info row component
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
        {value || '-'}
      </dd>
    </div>
  )
}

// Section component
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="px-6 py-4">
        <dl className="divide-y divide-gray-200 dark:divide-gray-700">{children}</dl>
      </div>
    </div>
  )
}

function CreatorDetailContent() {
  const params = useParams()
  const router = useRouter()
  const creatorId = params.id as string
  const { hasPermission } = usePermission() as { hasPermission: (action: string) => boolean }
  const editModal = useModal()
  const deleteModal = useModal()

  const canUpdate = hasPermission('creator:Update')
  const canDelete = hasPermission('creator:Delete')

  const {
    data: creator,
    isLoading,
    error,
    refetch,
  } = useQuery<CreatorDetail>({
    queryKey: ['creator', creatorId],
    queryFn: async () => {
      const res = await apiClient.get(`/creators/${creatorId}`)
      return res.data
    },
    enabled: !!creatorId,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  if (error || !creator) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-lg text-gray-600 dark:text-gray-400">Creator not found</div>
        <Button onClick={() => router.push('/influencers')}>Back to List</Button>
      </div>
    )
  }

  const categories = parseJsonArray(creator.categories)
  const languages = parseJsonArray(creator.languages)
  const internalTags = parseJsonArray(creator.internalTags)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => router.push('/influencers')}
            className="flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{creator.fullName}</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Creator ID: {creator.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {creator.isBlacklisted ? (
            <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full dark:bg-red-900 dark:text-red-300">
              Blacklisted
            </span>
          ) : creator.isActive ? (
            <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-900 dark:text-green-300">
              Active
            </span>
          ) : (
            <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full dark:bg-gray-700 dark:text-gray-300">
              Inactive
            </span>
          )}
          {canUpdate && (
            <Button variant="outline" onClick={editModal.openModal}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              onClick={deleteModal.openModal}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditInfluencerModal
        isOpen={editModal.isOpen}
        onClose={editModal.closeModal}
        creator={creator}
        onSuccess={() => refetch()}
      />

      {/* Delete Modal */}
      <DeleteInfluencerModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        creator={creator}
        onSuccess={() => router.push('/influencers')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Section title="Basic Information">
          <InfoRow label="Full Name" value={creator.fullName} />
          <InfoRow label="Gender" value={creator.gender} />
          <InfoRow label="Country" value={creator.country} />
          <InfoRow label="City" value={creator.city} />
          <InfoRow label="Email" value={creator.email} />
          <InfoRow label="Phone" value={creator.phoneNumber} />
          <InfoRow
            label="Languages"
            value={
              languages.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {languages.map((lang, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded dark:bg-gray-700 dark:text-gray-300"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              ) : null
            }
          />
        </Section>

        {/* Social Accounts */}
        <Section title="Social Accounts">
          {creator.creatorSocials.length > 0 ? (
            <div className="space-y-4">
              {creator.creatorSocials.map((social) => (
                <div
                  key={social.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-600 dark:text-gray-400">
                      <PlatformIcon platform={social.socialMedia} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        @{social.handle}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {social.socialMedia}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatFollowers(social.followers)}
                    </div>
                    {social.tier && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{social.tier}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 py-4">No social accounts linked</p>
          )}
        </Section>

        {/* Categories & Tags */}
        <Section title="Categories & Tags">
          <InfoRow
            label="Categories"
            value={
              categories.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {categories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded dark:bg-blue-900 dark:text-blue-300"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              ) : null
            }
          />
          <InfoRow
            label="Internal Tags"
            value={
              internalTags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {internalTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded dark:bg-purple-900 dark:text-purple-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null
            }
          />
          <InfoRow label="Characteristics" value={creator.characteristics} />
        </Section>

        {/* Agency & Management */}
        <Section title="Agency & Management">
          <InfoRow label="Agency Name" value={creator.agencyName} />
          <InfoRow label="Manager Name" value={creator.managerName} />
          <InfoRow label="Billing Info" value={creator.billingInfo} />
        </Section>

        {/* Professional History */}
        <Section title="Professional History">
          <InfoRow label="Past Clients" value={creator.pastClients} />
          <InfoRow label="Past Campaigns" value={creator.pastCampaigns} />
          <InfoRow label="Comments" value={creator.comments} />
        </Section>

        {/* Campaign Metrics */}
        <Section title="Campaign Metrics">
          <InfoRow label="Last Brand" value={creator.lastBrand} />
          <InfoRow label="Active Campaigns" value={creator.campaignsActive?.toString()} />
          <InfoRow
            label="Last Campaign Completed"
            value={formatDate(creator.lastCampaignCompleted)}
          />
          <InfoRow label="Last Fee" value={creator.lastFee ? `$${creator.lastFee}` : null} />
          <InfoRow label="Last CPV" value={creator.lastCpv?.toFixed(2)} />
          <InfoRow label="Last CPM" value={creator.lastCpm?.toFixed(2)} />
          <InfoRow label="Internal Rating" value={creator.internalRating?.toFixed(1)} />
        </Section>

        {/* Status */}
        {creator.isBlacklisted && (
          <Section title="Blacklist Information">
            <InfoRow label="Blacklisted" value="Yes" />
            <InfoRow label="Reason" value={creator.blacklistReason} />
          </Section>
        )}
      </div>

      {/* Timestamps */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Created: {formatDate(creator.createdAt)} | Updated: {formatDate(creator.updatedAt)}
      </div>
    </div>
  )
}

export default function CreatorDetailPage() {
  return (
    <PermissionGuard permission="creator:Read">
      <CreatorDetailContent />
    </PermissionGuard>
  )
}
