export class IntegrationUsageDto {
  provider: string
  totalQuota: number
  remainingQuota: number
  usedQuota: number
  usagePercentage: number
  status: 'active' | 'error' | 'inactive'
  errorMessage?: string
  reloadInfo?: string
}

export class IntegrationsUsageResponseDto {
  integrations: IntegrationUsageDto[]
}
