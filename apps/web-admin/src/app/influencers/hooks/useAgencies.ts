'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface Agency {
  id: number
  name: string
}

/**
 * Fetch all agencies or search by query
 */
async function fetchAgencies(query?: string): Promise<Agency[]> {
  const params = query ? `?q=${encodeURIComponent(query)}` : ''
  const response = await apiClient.get<Agency[]>(`/agencies${params}`)
  return response.data
}

/**
 * Create a new agency
 */
async function createAgency(name: string): Promise<Agency> {
  const response = await apiClient.post<Agency>('/agencies', { name })
  return response.data
}

/**
 * Hook to get all agencies
 */
export function useAgencies(query?: string) {
  return useQuery({
    queryKey: ['agencies', query ?? ''],
    queryFn: () => fetchAgencies(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to create a new agency
 */
export function useCreateAgency() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAgency,
    onSuccess: () => {
      // Invalidate agencies cache to refetch the list
      queryClient.invalidateQueries({ queryKey: ['agencies'] })
    },
  })
}
