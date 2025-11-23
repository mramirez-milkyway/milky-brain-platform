export class ExportControlResponseDto {
  id: number
  roleId: number
  roleName: string
  exportType: string
  rowLimit: number
  enableWatermark: boolean
  dailyLimit: number | null
  monthlyLimit: number | null
  createdAt: Date
  updatedAt: Date
}

export class UserQuotaResponseDto {
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
