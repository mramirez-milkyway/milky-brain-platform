'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

// Types
export interface CreateCreatorSocialInput {
  handle: string
  platform: 'instagram' | 'tiktok' | 'youtube'
  followers?: number
  tier?: string
  socialLink?: string
}

export interface CreateCreatorInput {
  fullName: string
  socialAccounts: CreateCreatorSocialInput[]
  gender?: 'male' | 'female' | 'organization'
  country?: string
  city?: string
  email?: string
  phoneNumber?: string
  characteristics?: string
  pastClients?: string
  pastCampaigns?: string
  comments?: string
  languages?: string
  categories?: string
  internalTags?: string
  agencyName?: string
  managerName?: string
  billingInfo?: string
  internalRating?: number
}

export interface UpdateCreatorInput {
  fullName?: string
  gender?: 'male' | 'female' | 'organization'
  country?: string
  city?: string
  email?: string
  phoneNumber?: string
  characteristics?: string
  pastClients?: string
  pastCampaigns?: string
  comments?: string
  isActive?: boolean
  languages?: string
  categories?: string
  internalTags?: string
  isBlacklisted?: boolean
  blacklistReason?: string
  agencyName?: string
  managerName?: string
  billingInfo?: string
  internalRating?: number
}

export interface CreatorResponse {
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
  internalRating: number | null
  createdAt: string
  updatedAt: string
  restored?: boolean
  creatorSocials: Array<{
    id: number
    socialMedia: string
    handle: string
    followers: number | null
    tier: string | null
    socialLink: string | null
  }>
}

/**
 * Hook to create a new creator/influencer
 * Handles restore-on-create logic automatically
 */
export function useCreateCreator() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCreatorInput): Promise<CreatorResponse> => {
      const response = await apiClient.post('/creators', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creators'] })
    },
  })
}

/**
 * Hook to update an existing creator/influencer
 */
export function useUpdateCreator() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number
      data: UpdateCreatorInput
    }): Promise<CreatorResponse> => {
      const response = await apiClient.patch(`/creators/${id}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['creators'] })
      queryClient.invalidateQueries({ queryKey: ['creator', variables.id] })
    },
  })
}

/**
 * Hook to soft-delete a creator/influencer
 */
export function useDeleteCreator() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number): Promise<{ message: string }> => {
      const response = await apiClient.delete(`/creators/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creators'] })
    },
  })
}
