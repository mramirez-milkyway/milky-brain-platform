'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface FilterOptions {
  countries: string[]
  citiesByCountry: Record<string, string[]>
  languages: string[]
  categories: string[]
}

/**
 * Fetch filter options from the API
 */
async function fetchFilterOptions(): Promise<FilterOptions> {
  const response = await apiClient.get<FilterOptions>('/creators/filter-options')
  return response.data
}

/**
 * Hook to get filter options for dropdowns
 * Returns countries, cities (grouped by country), languages, and categories
 */
export function useFilterOptions() {
  return useQuery({
    queryKey: ['creators', 'filter-options'],
    queryFn: fetchFilterOptions,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  })
}

/**
 * Get cities for a specific country
 */
export function getCitiesForCountry(
  filterOptions: FilterOptions | undefined,
  country: string | undefined
): string[] {
  if (!filterOptions || !country) {
    return []
  }
  return filterOptions.citiesByCountry[country] ?? []
}
