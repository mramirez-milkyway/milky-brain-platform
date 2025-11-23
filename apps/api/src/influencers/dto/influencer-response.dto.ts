export class InfluencerResponseDto {
  id: number
  name: string
  platform: string
  followers: number
  engagement: number
  category: string
  createdAt: Date
}

export class PaginatedInfluencersResponseDto {
  data: InfluencerResponseDto[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
