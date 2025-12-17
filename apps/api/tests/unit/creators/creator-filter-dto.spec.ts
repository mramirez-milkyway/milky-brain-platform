import 'reflect-metadata'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { CreatorQueryDto, PLATFORMS, GENDERS } from '../../../src/creators/dto'

describe('CreatorQueryDto', () => {
  describe('pagination', () => {
    it('should accept valid page and pageSize', async () => {
      const dto = plainToInstance(CreatorQueryDto, { page: 1, pageSize: 20 })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should default page to 1', async () => {
      const dto = plainToInstance(CreatorQueryDto, {})
      expect(dto.page).toBe(1)
    })

    it('should default pageSize to 20', async () => {
      const dto = plainToInstance(CreatorQueryDto, {})
      expect(dto.pageSize).toBe(20)
    })

    it('should reject page less than 1', async () => {
      const dto = plainToInstance(CreatorQueryDto, { page: 0 })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'page')).toBe(true)
    })

    it('should reject pageSize greater than 100', async () => {
      const dto = plainToInstance(CreatorQueryDto, { pageSize: 101 })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'pageSize')).toBe(true)
    })
  })

  describe('platform filter', () => {
    it('should default platform to instagram', async () => {
      const dto = plainToInstance(CreatorQueryDto, {})
      expect(dto.platform).toBe('instagram')
    })

    it('should accept valid platforms', async () => {
      for (const platform of PLATFORMS) {
        const dto = plainToInstance(CreatorQueryDto, { platform })
        const errors = await validate(dto)
        expect(errors.filter((e) => e.property === 'platform')).toHaveLength(0)
      }
    })

    it('should reject invalid platform', async () => {
      const dto = plainToInstance(CreatorQueryDto, { platform: 'facebook' })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'platform')).toBe(true)
    })
  })

  describe('handle filter', () => {
    it('should accept handle string', async () => {
      const dto = plainToInstance(CreatorQueryDto, { handle: '@testuser' })
      const errors = await validate(dto)
      expect(errors.filter((e) => e.property === 'handle')).toHaveLength(0)
      expect(dto.handle).toBe('@testuser')
    })

    it('should accept undefined handle', async () => {
      const dto = plainToInstance(CreatorQueryDto, {})
      expect(dto.handle).toBeUndefined()
    })
  })

  describe('country filter', () => {
    it('should transform comma-separated string to array', async () => {
      const dto = plainToInstance(CreatorQueryDto, { country: 'US,ES,MX' })
      expect(dto.country).toEqual(['US', 'ES', 'MX'])
    })

    it('should accept array directly', async () => {
      const dto = plainToInstance(CreatorQueryDto, { country: ['US', 'ES'] })
      expect(dto.country).toEqual(['US', 'ES'])
    })

    it('should reject more than 5 countries', async () => {
      const dto = plainToInstance(CreatorQueryDto, {
        country: ['US', 'ES', 'MX', 'AR', 'CO', 'BR'],
      })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'country')).toBe(true)
    })

    it('should accept exactly 5 countries', async () => {
      const dto = plainToInstance(CreatorQueryDto, {
        country: ['US', 'ES', 'MX', 'AR', 'CO'],
      })
      const errors = await validate(dto)
      expect(errors.filter((e) => e.property === 'country')).toHaveLength(0)
    })
  })

  describe('gender filter', () => {
    it('should accept valid genders', async () => {
      for (const gender of GENDERS) {
        const dto = plainToInstance(CreatorQueryDto, { gender })
        const errors = await validate(dto)
        expect(errors.filter((e) => e.property === 'gender')).toHaveLength(0)
      }
    })

    it('should reject invalid gender', async () => {
      const dto = plainToInstance(CreatorQueryDto, { gender: 'other' })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'gender')).toBe(true)
    })
  })

  describe('followers filter', () => {
    it('should accept minFollowers', async () => {
      const dto = plainToInstance(CreatorQueryDto, { minFollowers: '10000' })
      expect(dto.minFollowers).toBe(10000)
    })

    it('should accept maxFollowers', async () => {
      const dto = plainToInstance(CreatorQueryDto, { maxFollowers: '1000000' })
      expect(dto.maxFollowers).toBe(1000000)
    })

    it('should reject negative minFollowers', async () => {
      const dto = plainToInstance(CreatorQueryDto, { minFollowers: -1 })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'minFollowers')).toBe(true)
    })
  })

  describe('categories filter', () => {
    it('should transform comma-separated string to array', async () => {
      const dto = plainToInstance(CreatorQueryDto, { categories: 'beauty,fashion,gaming' })
      expect(dto.categories).toEqual(['beauty', 'fashion', 'gaming'])
    })

    it('should trim whitespace', async () => {
      const dto = plainToInstance(CreatorQueryDto, { categories: ' beauty , fashion ' })
      expect(dto.categories).toEqual(['beauty', 'fashion'])
    })
  })

  describe('excludeBlacklisted filter', () => {
    it('should default to true', async () => {
      const dto = plainToInstance(CreatorQueryDto, {})
      expect(dto.excludeBlacklisted).toBe(true)
    })

    it('should parse "false" string to false', async () => {
      const dto = plainToInstance(CreatorQueryDto, { excludeBlacklisted: 'false' })
      expect(dto.excludeBlacklisted).toBe(false)
    })

    it('should parse "true" string to true', async () => {
      const dto = plainToInstance(CreatorQueryDto, { excludeBlacklisted: 'true' })
      expect(dto.excludeBlacklisted).toBe(true)
    })

    it('should keep true for empty/undefined', async () => {
      const dto = plainToInstance(CreatorQueryDto, { excludeBlacklisted: '' })
      expect(dto.excludeBlacklisted).toBe(true)
    })
  })

  describe('engagement rate filter', () => {
    it('should accept valid percentage', async () => {
      const dto = plainToInstance(CreatorQueryDto, { minEngagementRate: '3.5' })
      expect(dto.minEngagementRate).toBe(3.5)
      const errors = await validate(dto)
      expect(errors.filter((e) => e.property === 'minEngagementRate')).toHaveLength(0)
    })

    it('should reject values over 100', async () => {
      const dto = plainToInstance(CreatorQueryDto, { minEngagementRate: 101 })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'minEngagementRate')).toBe(true)
    })

    it('should reject negative values', async () => {
      const dto = plainToInstance(CreatorQueryDto, { minEngagementRate: -1 })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'minEngagementRate')).toBe(true)
    })
  })

  describe('internal rating filter', () => {
    it('should accept valid rating', async () => {
      const dto = plainToInstance(CreatorQueryDto, { minInternalRating: '80' })
      expect(dto.minInternalRating).toBe(80)
    })

    it('should reject values over 100', async () => {
      const dto = plainToInstance(CreatorQueryDto, { minInternalRating: 101 })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'minInternalRating')).toBe(true)
    })
  })

  describe('hasWorkedWithUs filter', () => {
    it('should parse "true" to true', async () => {
      const dto = plainToInstance(CreatorQueryDto, { hasWorkedWithUs: 'true' })
      expect(dto.hasWorkedWithUs).toBe(true)
    })

    it('should parse "false" to false', async () => {
      const dto = plainToInstance(CreatorQueryDto, { hasWorkedWithUs: 'false' })
      expect(dto.hasWorkedWithUs).toBe(false)
    })

    it('should keep undefined for empty', async () => {
      const dto = plainToInstance(CreatorQueryDto, { hasWorkedWithUs: '' })
      expect(dto.hasWorkedWithUs).toBeUndefined()
    })
  })

  describe('audience filters', () => {
    it('should accept audienceGender with valid values', async () => {
      const dto = plainToInstance(CreatorQueryDto, { audienceGender: 'male' })
      const errors = await validate(dto)
      expect(errors.filter((e) => e.property === 'audienceGender')).toHaveLength(0)
    })

    it('should reject invalid audienceGender', async () => {
      const dto = plainToInstance(CreatorQueryDto, { audienceGender: 'organization' })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'audienceGender')).toBe(true)
    })

    it('should accept audienceCountryMinPercent', async () => {
      const dto = plainToInstance(CreatorQueryDto, { audienceCountryMinPercent: '20' })
      expect(dto.audienceCountryMinPercent).toBe(20)
    })
  })
})
