import 'reflect-metadata'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { CreateCreatorDto, UpdateCreatorDto, CreateCreatorSocialDto } from '../../../src/creators/dto'

describe('CreateCreatorSocialDto', () => {
  it('should accept valid social account data', async () => {
    const dto = plainToInstance(CreateCreatorSocialDto, {
      handle: 'testuser',
      platform: 'instagram',
      followers: 10000,
    })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should require handle', async () => {
    const dto = plainToInstance(CreateCreatorSocialDto, {
      platform: 'instagram',
    })
    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'handle')).toBe(true)
  })

  it('should reject empty handle', async () => {
    const dto = plainToInstance(CreateCreatorSocialDto, {
      handle: '',
      platform: 'instagram',
    })
    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'handle')).toBe(true)
  })

  it('should accept valid platforms', async () => {
    for (const platform of ['instagram', 'tiktok', 'youtube']) {
      const dto = plainToInstance(CreateCreatorSocialDto, {
        handle: 'testuser',
        platform,
      })
      const errors = await validate(dto)
      expect(errors.filter((e) => e.property === 'platform')).toHaveLength(0)
    }
  })

  it('should reject invalid platform', async () => {
    const dto = plainToInstance(CreateCreatorSocialDto, {
      handle: 'testuser',
      platform: 'facebook',
    })
    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'platform')).toBe(true)
  })

  it('should accept optional followers', async () => {
    const dto = plainToInstance(CreateCreatorSocialDto, {
      handle: 'testuser',
      platform: 'instagram',
    })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
    expect(dto.followers).toBeUndefined()
  })

  it('should reject negative followers', async () => {
    const dto = plainToInstance(CreateCreatorSocialDto, {
      handle: 'testuser',
      platform: 'instagram',
      followers: -100,
    })
    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'followers')).toBe(true)
  })
})

describe('CreateCreatorDto', () => {
  const validSocialAccount = {
    handle: 'testuser',
    platform: 'instagram',
    followers: 10000,
  }

  describe('required fields', () => {
    it('should accept valid creator data', async () => {
      const dto = plainToInstance(CreateCreatorDto, {
        fullName: 'Test User',
        socialAccounts: [validSocialAccount],
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should require fullName', async () => {
      const dto = plainToInstance(CreateCreatorDto, {
        socialAccounts: [validSocialAccount],
      })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'fullName')).toBe(true)
    })

    it('should reject empty fullName', async () => {
      const dto = plainToInstance(CreateCreatorDto, {
        fullName: '',
        socialAccounts: [validSocialAccount],
      })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'fullName')).toBe(true)
    })

    it('should require socialAccounts array', async () => {
      const dto = plainToInstance(CreateCreatorDto, {
        fullName: 'Test User',
      })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'socialAccounts')).toBe(true)
    })
  })

  describe('socialAccounts validation', () => {
    it('should validate nested social accounts', async () => {
      const dto = plainToInstance(CreateCreatorDto, {
        fullName: 'Test User',
        socialAccounts: [{ handle: '', platform: 'invalid' }],
      })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'socialAccounts')).toBe(true)
    })

    it('should reject more than 10 social accounts', async () => {
      const accounts = Array(11).fill(null).map((_, i) => ({
        handle: `user${i}`,
        platform: 'instagram',
      }))
      const dto = plainToInstance(CreateCreatorDto, {
        fullName: 'Test User',
        socialAccounts: accounts,
      })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'socialAccounts')).toBe(true)
    })

    it('should accept exactly 10 social accounts', async () => {
      const accounts = Array(10).fill(null).map((_, i) => ({
        handle: `user${i}`,
        platform: 'instagram',
      }))
      const dto = plainToInstance(CreateCreatorDto, {
        fullName: 'Test User',
        socialAccounts: accounts,
      })
      const errors = await validate(dto)
      expect(errors.filter((e) => e.property === 'socialAccounts')).toHaveLength(0)
    })
  })

  describe('optional fields', () => {
    it('should accept valid gender', async () => {
      for (const gender of ['male', 'female', 'organization']) {
        const dto = plainToInstance(CreateCreatorDto, {
          fullName: 'Test User',
          socialAccounts: [validSocialAccount],
          gender,
        })
        const errors = await validate(dto)
        expect(errors.filter((e) => e.property === 'gender')).toHaveLength(0)
      }
    })

    it('should reject invalid gender', async () => {
      const dto = plainToInstance(CreateCreatorDto, {
        fullName: 'Test User',
        socialAccounts: [validSocialAccount],
        gender: 'other',
      })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'gender')).toBe(true)
    })

    it('should accept valid email', async () => {
      const dto = plainToInstance(CreateCreatorDto, {
        fullName: 'Test User',
        socialAccounts: [validSocialAccount],
        email: 'test@example.com',
      })
      const errors = await validate(dto)
      expect(errors.filter((e) => e.property === 'email')).toHaveLength(0)
    })

    it('should reject invalid email', async () => {
      const dto = plainToInstance(CreateCreatorDto, {
        fullName: 'Test User',
        socialAccounts: [validSocialAccount],
        email: 'invalid-email',
      })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'email')).toBe(true)
    })

    it('should accept internalRating between 0 and 100', async () => {
      const dto = plainToInstance(CreateCreatorDto, {
        fullName: 'Test User',
        socialAccounts: [validSocialAccount],
        internalRating: 85,
      })
      const errors = await validate(dto)
      expect(errors.filter((e) => e.property === 'internalRating')).toHaveLength(0)
    })

    it('should reject internalRating over 100', async () => {
      const dto = plainToInstance(CreateCreatorDto, {
        fullName: 'Test User',
        socialAccounts: [validSocialAccount],
        internalRating: 101,
      })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'internalRating')).toBe(true)
    })

    it('should reject negative internalRating', async () => {
      const dto = plainToInstance(CreateCreatorDto, {
        fullName: 'Test User',
        socialAccounts: [validSocialAccount],
        internalRating: -1,
      })
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'internalRating')).toBe(true)
    })

    it('should accept optional string fields', async () => {
      const dto = plainToInstance(CreateCreatorDto, {
        fullName: 'Test User',
        socialAccounts: [validSocialAccount],
        country: 'United States',
        city: 'Los Angeles',
        phoneNumber: '+1234567890',
        characteristics: 'Fashion influencer',
        pastClients: 'Nike, Adidas',
        pastCampaigns: 'Summer 2024',
        comments: 'Great to work with',
        languages: 'English, Spanish',
        categories: 'fashion, beauty',
        internalTags: 'vip, priority',
        agencyName: 'Top Agency',
        managerName: 'John Manager',
        billingInfo: 'NET 30',
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })
})

describe('UpdateCreatorDto', () => {
  it('should accept empty update (all fields optional)', async () => {
    const dto = plainToInstance(UpdateCreatorDto, {})
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should accept partial update with fullName', async () => {
    const dto = plainToInstance(UpdateCreatorDto, {
      fullName: 'Updated Name',
    })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject empty fullName if provided', async () => {
    const dto = plainToInstance(UpdateCreatorDto, {
      fullName: '',
    })
    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'fullName')).toBe(true)
  })

  it('should accept isActive boolean', async () => {
    const dto = plainToInstance(UpdateCreatorDto, {
      isActive: false,
    })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
    expect(dto.isActive).toBe(false)
  })

  it('should accept isBlacklisted with reason', async () => {
    const dto = plainToInstance(UpdateCreatorDto, {
      isBlacklisted: true,
      blacklistReason: 'Policy violation',
    })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should accept valid email', async () => {
    const dto = plainToInstance(UpdateCreatorDto, {
      email: 'updated@example.com',
    })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject invalid email', async () => {
    const dto = plainToInstance(UpdateCreatorDto, {
      email: 'not-an-email',
    })
    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'email')).toBe(true)
  })

  it('should accept valid gender', async () => {
    for (const gender of ['male', 'female', 'organization']) {
      const dto = plainToInstance(UpdateCreatorDto, { gender })
      const errors = await validate(dto)
      expect(errors.filter((e) => e.property === 'gender')).toHaveLength(0)
    }
  })

  it('should reject invalid gender', async () => {
    const dto = plainToInstance(UpdateCreatorDto, { gender: 'invalid' })
    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'gender')).toBe(true)
  })

  it('should accept internalRating between 0 and 100', async () => {
    const dto = plainToInstance(UpdateCreatorDto, { internalRating: 50 })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject internalRating outside valid range', async () => {
    const dtoOver = plainToInstance(UpdateCreatorDto, { internalRating: 101 })
    const errorsOver = await validate(dtoOver)
    expect(errorsOver.some((e) => e.property === 'internalRating')).toBe(true)

    const dtoUnder = plainToInstance(UpdateCreatorDto, { internalRating: -1 })
    const errorsUnder = await validate(dtoUnder)
    expect(errorsUnder.some((e) => e.property === 'internalRating')).toBe(true)
  })
})
