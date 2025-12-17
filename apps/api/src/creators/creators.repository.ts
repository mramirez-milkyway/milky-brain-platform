import { Injectable } from '@nestjs/common'
import { PrismaClient, Creator, CreatorSocial, Prisma } from '@prisma/client'
import { CreatorQueryDto, Platform } from './dto'

export type CreatorWithSocials = Creator & {
  creatorSocials: CreatorSocial[]
}

export interface CreatorFilters {
  // Required
  platform?: Platform
  // Basic
  handle?: string
  // Demographics - Creator
  country?: string[]
  gender?: string
  language?: string
  // Performance
  minFollowers?: number
  maxFollowers?: number
  minEngagementRate?: number
  maxEngagementRate?: number
  minCredibility?: number
  // Platform-specific
  minReelsPlays?: number
  maxReelsPlays?: number
  minTiktokViews?: number
  maxTiktokViews?: number
  // Audience demographics
  audienceCountry?: string[]
  audienceCountryMinPercent?: number
  audienceGender?: 'male' | 'female'
  audienceGenderMinPercent?: number
  audienceMinAge?: number
  audienceMaxAge?: number
  audienceAgeMinPercent?: number
  // Internal
  categories?: string[]
  excludeBlacklisted?: boolean
  minInternalRating?: number
  hasWorkedWithUs?: boolean
}

@Injectable()
export class CreatorsRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Build the filter conditions for creators based on query parameters
   */
  private buildFilterConditions(filters: CreatorFilters): {
    creatorWhere: Prisma.CreatorWhereInput
    socialWhere: Prisma.CreatorSocialWhereInput
    needsComplexQuery: boolean
  } {
    const creatorWhere: Prisma.CreatorWhereInput = {
      deletedAt: null,
    }
    const socialWhere: Prisma.CreatorSocialWhereInput = {
      deletedAt: null,
    }
    let needsComplexQuery = false

    // === Blacklist filter (default: exclude) ===
    if (filters.excludeBlacklisted !== false) {
      creatorWhere.isBlacklisted = false
    }

    // === Country filter ===
    if (filters.country && filters.country.length > 0) {
      creatorWhere.country = { in: filters.country }
    }

    // === Gender filter ===
    if (filters.gender) {
      creatorWhere.gender = filters.gender
    }

    // === Language filter (JSON array contains) ===
    if (filters.language) {
      creatorWhere.languages = { contains: filters.language }
    }

    // === Categories filter (JSON array contains any) ===
    if (filters.categories && filters.categories.length > 0) {
      // For JSON array, we need to check if any category matches
      creatorWhere.OR = filters.categories.map((cat) => ({
        categories: { contains: cat },
      }))
    }

    // === Internal rating filter ===
    if (filters.minInternalRating !== undefined) {
      creatorWhere.internalRating = { gte: filters.minInternalRating }
    }

    // === Platform filter (required) ===
    if (filters.platform) {
      socialWhere.socialMedia = filters.platform
    }

    // === Handle filter (partial match, case-insensitive) ===
    if (filters.handle) {
      socialWhere.handle = {
        contains: filters.handle,
        mode: 'insensitive',
      }
    }

    // === Followers range filter ===
    if (filters.minFollowers !== undefined || filters.maxFollowers !== undefined) {
      socialWhere.followers = {}
      if (filters.minFollowers !== undefined) {
        socialWhere.followers.gte = filters.minFollowers
      }
      if (filters.maxFollowers !== undefined) {
        socialWhere.followers.lte = filters.maxFollowers
      }
    }

    // === Complex filters that require raw SQL or subqueries ===
    if (
      filters.minEngagementRate !== undefined ||
      filters.maxEngagementRate !== undefined ||
      filters.minCredibility !== undefined ||
      filters.audienceCountry ||
      filters.audienceGender ||
      filters.audienceMinAge !== undefined ||
      filters.audienceMaxAge !== undefined ||
      filters.minReelsPlays !== undefined ||
      filters.maxReelsPlays !== undefined ||
      filters.minTiktokViews !== undefined ||
      filters.maxTiktokViews !== undefined ||
      filters.hasWorkedWithUs !== undefined
    ) {
      needsComplexQuery = true
    }

    return { creatorWhere, socialWhere, needsComplexQuery }
  }

  /**
   * Find all creators with filters using Prisma (for simple filters)
   */
  async findAllWithFilters(
    filters: CreatorFilters,
    limit?: number,
    offset = 0
  ): Promise<CreatorWithSocials[]> {
    const { creatorWhere, socialWhere, needsComplexQuery } = this.buildFilterConditions(filters)

    // For complex queries, use raw SQL
    if (needsComplexQuery) {
      return this.findAllWithComplexFilters(filters, limit, offset)
    }

    // Simple case: use Prisma query builder
    // We need to find creators that have at least one social matching the criteria
    const hasAnySocialFilter =
      socialWhere.socialMedia || socialWhere.handle || socialWhere.followers

    if (hasAnySocialFilter) {
      creatorWhere.creatorSocials = {
        some: socialWhere,
      }
    }

    const creators = await this.prisma.creator.findMany({
      where: creatorWhere,
      include: {
        creatorSocials: {
          where: {
            deletedAt: null,
            // Filter socials to the selected platform
            ...(filters.platform && { socialMedia: filters.platform }),
          },
          orderBy: {
            followers: 'desc',
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: {
        fullName: 'asc',
      },
    })

    return creators
  }

  /**
   * Find all creators with complex filters using raw SQL
   */
  private async findAllWithComplexFilters(
    filters: CreatorFilters,
    limit?: number,
    offset = 0
  ): Promise<CreatorWithSocials[]> {
    const params: unknown[] = []
    let paramIndex = 1

    // Build WHERE conditions
    const conditions: string[] = ['c."deleted_at" IS NULL']

    // Blacklist
    if (filters.excludeBlacklisted !== false) {
      conditions.push('c."is_blacklisted" = false')
    }

    // Country
    if (filters.country && filters.country.length > 0) {
      conditions.push(`c."country" = ANY($${paramIndex})`)
      params.push(filters.country)
      paramIndex++
    }

    // Gender
    if (filters.gender) {
      conditions.push(`c."gender" = $${paramIndex}`)
      params.push(filters.gender)
      paramIndex++
    }

    // Language (JSON contains)
    if (filters.language) {
      conditions.push(`c."languages" ILIKE $${paramIndex}`)
      params.push(`%${filters.language}%`)
      paramIndex++
    }

    // Categories (JSON contains any)
    if (filters.categories && filters.categories.length > 0) {
      const categoryConditions = filters.categories.map(() => {
        const condition = `c."categories" ILIKE $${paramIndex}`
        paramIndex++
        return condition
      })
      conditions.push(`(${categoryConditions.join(' OR ')})`)
      params.push(...filters.categories.map((cat) => `%${cat}%`))
    }

    // Internal rating
    if (filters.minInternalRating !== undefined) {
      conditions.push(`c."internal_rating" >= $${paramIndex}`)
      params.push(filters.minInternalRating)
      paramIndex++
    }

    // Platform filter
    if (filters.platform) {
      conditions.push(`cs."social_media" = $${paramIndex}`)
      params.push(filters.platform)
      paramIndex++
    }

    // Handle search
    if (filters.handle) {
      conditions.push(`cs."handle" ILIKE $${paramIndex}`)
      params.push(`%${filters.handle}%`)
      paramIndex++
    }

    // Followers range
    if (filters.minFollowers !== undefined) {
      conditions.push(`cs."followers" >= $${paramIndex}`)
      params.push(filters.minFollowers)
      paramIndex++
    }
    if (filters.maxFollowers !== undefined) {
      conditions.push(`cs."followers" <= $${paramIndex}`)
      params.push(filters.maxFollowers)
      paramIndex++
    }

    // Engagement rate (from audience_ages table)
    if (filters.minEngagementRate !== undefined) {
      conditions.push(`aa."engagement_rate" >= $${paramIndex}`)
      params.push(filters.minEngagementRate)
      paramIndex++
    }
    if (filters.maxEngagementRate !== undefined) {
      conditions.push(`aa."engagement_rate" <= $${paramIndex}`)
      params.push(filters.maxEngagementRate)
      paramIndex++
    }

    // Credibility
    if (filters.minCredibility !== undefined) {
      conditions.push(`aa."followers_credibility" >= $${paramIndex}`)
      params.push(filters.minCredibility)
      paramIndex++
    }

    // Audience country with percentage
    if (filters.audienceCountry && filters.audienceCountry.length > 0) {
      conditions.push(`ac."country" = ANY($${paramIndex})`)
      params.push(filters.audienceCountry)
      paramIndex++

      if (filters.audienceCountryMinPercent !== undefined) {
        conditions.push(`ac."pct" >= $${paramIndex}`)
        params.push(filters.audienceCountryMinPercent)
        paramIndex++
      }
    }

    // Audience gender with percentage
    if (filters.audienceGender) {
      const genderCol = filters.audienceGender === 'male' ? 'pct_men' : 'pct_women'
      if (filters.audienceGenderMinPercent !== undefined) {
        conditions.push(`aa."${genderCol}" >= $${paramIndex}`)
        params.push(filters.audienceGenderMinPercent)
        paramIndex++
      }
    }

    // Audience age with percentage
    if (filters.audienceMinAge !== undefined || filters.audienceMaxAge !== undefined) {
      // Map age ranges to columns
      const ageColumns = this.getAgeColumns(
        filters.audienceMinAge ?? 18,
        filters.audienceMaxAge ?? 65
      )
      if (ageColumns.length > 0 && filters.audienceAgeMinPercent !== undefined) {
        const ageSum = ageColumns.map((col) => `COALESCE(aa."${col}", 0)`).join(' + ')
        conditions.push(`(${ageSum}) >= $${paramIndex}`)
        params.push(filters.audienceAgeMinPercent)
        paramIndex++
      }
    }

    // Reels plays (Instagram)
    if (filters.platform === 'instagram') {
      if (filters.minReelsPlays !== undefined) {
        conditions.push(`ir."avg_plays" >= $${paramIndex}`)
        params.push(filters.minReelsPlays)
        paramIndex++
      }
      if (filters.maxReelsPlays !== undefined) {
        conditions.push(`ir."avg_plays" <= $${paramIndex}`)
        params.push(filters.maxReelsPlays)
        paramIndex++
      }
    }

    // TikTok views
    if (filters.platform === 'tiktok') {
      if (filters.minTiktokViews !== undefined) {
        conditions.push(`tt."est_views" >= $${paramIndex}`)
        params.push(filters.minTiktokViews)
        paramIndex++
      }
      if (filters.maxTiktokViews !== undefined) {
        conditions.push(`tt."est_views" <= $${paramIndex}`)
        params.push(filters.maxTiktokViews)
        paramIndex++
      }
    }

    // Has worked with us (join through creator_socials since campaign_creators links via creator_social_id)
    if (filters.hasWorkedWithUs !== undefined) {
      if (filters.hasWorkedWithUs) {
        conditions.push(`EXISTS (
          SELECT 1 FROM "campaign_creators" cc
          JOIN "creator_socials" ccs ON cc."creator_social_id" = ccs."id"
          WHERE ccs."creator_id" = c."id" AND cc."deleted_at" IS NULL
        )`)
      } else {
        conditions.push(`NOT EXISTS (
          SELECT 1 FROM "campaign_creators" cc
          JOIN "creator_socials" ccs ON cc."creator_social_id" = ccs."id"
          WHERE ccs."creator_id" = c."id" AND cc."deleted_at" IS NULL
        )`)
      }
    }

    // Build the query
    const needsAudienceAges =
      filters.minEngagementRate !== undefined ||
      filters.maxEngagementRate !== undefined ||
      filters.minCredibility !== undefined ||
      filters.audienceGender !== undefined ||
      filters.audienceMinAge !== undefined ||
      filters.audienceMaxAge !== undefined

    const needsAudienceCountries = filters.audienceCountry && filters.audienceCountry.length > 0

    const needsReelsStats =
      filters.platform === 'instagram' &&
      (filters.minReelsPlays !== undefined || filters.maxReelsPlays !== undefined)

    const needsTiktokStats =
      filters.platform === 'tiktok' &&
      (filters.minTiktokViews !== undefined || filters.maxTiktokViews !== undefined)

    let query = `
      SELECT DISTINCT c.*
      FROM "creators" c
      JOIN "creator_socials" cs ON cs."creator_id" = c."id" AND cs."deleted_at" IS NULL
    `

    if (needsAudienceAges) {
      query += `LEFT JOIN "creator_social_audience_ages" aa ON aa."creator_social_id" = cs."id" AND aa."deleted_at" IS NULL\n`
    }

    if (needsAudienceCountries) {
      query += `LEFT JOIN "creator_social_audience_countries" ac ON ac."creator_social_id" = cs."id" AND ac."deleted_at" IS NULL\n`
    }

    if (needsReelsStats) {
      query += `LEFT JOIN "social_stats_ig_reels" ir ON ir."creator_social_id" = cs."id" AND ir."deleted_at" IS NULL\n`
    }

    if (needsTiktokStats) {
      query += `LEFT JOIN "social_stats_tt_videos" tt ON tt."creator_social_id" = cs."id" AND tt."deleted_at" IS NULL\n`
    }

    query += `WHERE ${conditions.join(' AND ')}\n`
    query += `ORDER BY c."full_name" ASC\n`

    if (limit) {
      query += `LIMIT $${paramIndex}\n`
      params.push(limit)
      paramIndex++
    }

    query += `OFFSET $${paramIndex}\n`
    params.push(offset)

    // Execute raw query to get creator IDs
    const creators = await this.prisma.$queryRawUnsafe<Creator[]>(query, ...params)

    if (creators.length === 0) {
      return []
    }

    // Fetch full creator data with socials using Prisma
    const creatorIds = creators.map((c) => c.id)
    return this.prisma.creator.findMany({
      where: {
        id: { in: creatorIds },
      },
      include: {
        creatorSocials: {
          where: {
            deletedAt: null,
            ...(filters.platform && { socialMedia: filters.platform }),
          },
          orderBy: {
            followers: 'desc',
          },
        },
      },
      orderBy: {
        fullName: 'asc',
      },
    })
  }

  /**
   * Map age range to audience age column names
   */
  private getAgeColumns(minAge: number, maxAge: number): string[] {
    const columns: string[] = []
    if (minAge <= 24 && maxAge >= 18) columns.push('pct_age_18_24')
    if (minAge <= 34 && maxAge >= 25) columns.push('pct_age_25_34')
    if (minAge <= 44 && maxAge >= 35) columns.push('pct_age_35_44')
    if (minAge <= 54 && maxAge >= 45) columns.push('pct_age_45_54')
    if (minAge <= 64 && maxAge >= 55) columns.push('pct_age_55_64')
    if (maxAge >= 65) columns.push('pct_age_65_plus')
    return columns
  }

  /**
   * Count creators matching filters
   */
  async countWithFilters(filters: CreatorFilters): Promise<number> {
    const { creatorWhere, socialWhere, needsComplexQuery } = this.buildFilterConditions(filters)

    if (needsComplexQuery) {
      return this.countWithComplexFilters(filters)
    }

    const hasAnySocialFilter =
      socialWhere.socialMedia || socialWhere.handle || socialWhere.followers

    if (hasAnySocialFilter) {
      creatorWhere.creatorSocials = {
        some: socialWhere,
      }
    }

    return this.prisma.creator.count({
      where: creatorWhere,
    })
  }

  /**
   * Count with complex filters using raw SQL
   */
  private async countWithComplexFilters(filters: CreatorFilters): Promise<number> {
    const params: unknown[] = []
    let paramIndex = 1

    const conditions: string[] = ['c."deleted_at" IS NULL']

    // Reuse same filter logic as findAllWithComplexFilters
    if (filters.excludeBlacklisted !== false) {
      conditions.push('c."is_blacklisted" = false')
    }

    if (filters.country && filters.country.length > 0) {
      conditions.push(`c."country" = ANY($${paramIndex})`)
      params.push(filters.country)
      paramIndex++
    }

    if (filters.gender) {
      conditions.push(`c."gender" = $${paramIndex}`)
      params.push(filters.gender)
      paramIndex++
    }

    if (filters.language) {
      conditions.push(`c."languages" ILIKE $${paramIndex}`)
      params.push(`%${filters.language}%`)
      paramIndex++
    }

    if (filters.categories && filters.categories.length > 0) {
      const categoryConditions = filters.categories.map(() => {
        const condition = `c."categories" ILIKE $${paramIndex}`
        paramIndex++
        return condition
      })
      conditions.push(`(${categoryConditions.join(' OR ')})`)
      params.push(...filters.categories.map((cat) => `%${cat}%`))
    }

    if (filters.minInternalRating !== undefined) {
      conditions.push(`c."internal_rating" >= $${paramIndex}`)
      params.push(filters.minInternalRating)
      paramIndex++
    }

    if (filters.platform) {
      conditions.push(`cs."social_media" = $${paramIndex}`)
      params.push(filters.platform)
      paramIndex++
    }

    if (filters.handle) {
      conditions.push(`cs."handle" ILIKE $${paramIndex}`)
      params.push(`%${filters.handle}%`)
      paramIndex++
    }

    if (filters.minFollowers !== undefined) {
      conditions.push(`cs."followers" >= $${paramIndex}`)
      params.push(filters.minFollowers)
      paramIndex++
    }
    if (filters.maxFollowers !== undefined) {
      conditions.push(`cs."followers" <= $${paramIndex}`)
      params.push(filters.maxFollowers)
      paramIndex++
    }

    if (filters.minEngagementRate !== undefined) {
      conditions.push(`aa."engagement_rate" >= $${paramIndex}`)
      params.push(filters.minEngagementRate)
      paramIndex++
    }

    if (filters.minCredibility !== undefined) {
      conditions.push(`aa."followers_credibility" >= $${paramIndex}`)
      params.push(filters.minCredibility)
      paramIndex++
    }

    if (filters.hasWorkedWithUs !== undefined) {
      if (filters.hasWorkedWithUs) {
        conditions.push(`EXISTS (
          SELECT 1 FROM "campaign_creators" cc
          JOIN "creator_socials" ccs ON cc."creator_social_id" = ccs."id"
          WHERE ccs."creator_id" = c."id" AND cc."deleted_at" IS NULL
        )`)
      } else {
        conditions.push(`NOT EXISTS (
          SELECT 1 FROM "campaign_creators" cc
          JOIN "creator_socials" ccs ON cc."creator_social_id" = ccs."id"
          WHERE ccs."creator_id" = c."id" AND cc."deleted_at" IS NULL
        )`)
      }
    }

    const needsAudienceAges =
      filters.minEngagementRate !== undefined || filters.minCredibility !== undefined

    let query = `
      SELECT COUNT(DISTINCT c."id")
      FROM "creators" c
      JOIN "creator_socials" cs ON cs."creator_id" = c."id" AND cs."deleted_at" IS NULL
    `

    if (needsAudienceAges) {
      query += `LEFT JOIN "creator_social_audience_ages" aa ON aa."creator_social_id" = cs."id" AND aa."deleted_at" IS NULL\n`
    }

    query += `WHERE ${conditions.join(' AND ')}`

    const result = await this.prisma.$queryRawUnsafe<[{ count: bigint }]>(query, ...params)
    return Number(result[0].count)
  }

  /**
   * Legacy findAll without filters (for backwards compatibility)
   */
  async findAll(limit?: number, offset = 0): Promise<CreatorWithSocials[]> {
    return this.findAllWithFilters({ excludeBlacklisted: false }, limit, offset)
  }

  /**
   * Legacy count without filters (for backwards compatibility)
   */
  async count(): Promise<number> {
    return this.countWithFilters({ excludeBlacklisted: false })
  }

  async findById(id: number): Promise<CreatorWithSocials | null> {
    return this.prisma.creator.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        creatorSocials: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            followers: 'desc',
          },
        },
      },
    })
  }
}
