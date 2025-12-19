import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ConflictException } from '@nestjs/common'
import { CreatorsService } from '../../../src/creators/creators.service'
import { CreatorsRepository } from '../../../src/creators/creators.repository'
import { CreateCreatorDto, UpdateCreatorDto } from '../../../src/creators/dto'

describe('CreatorsService', () => {
  let service: CreatorsService
  let repository: jest.Mocked<CreatorsRepository>

  const mockCreator = {
    id: 1,
    fullName: 'Test Creator',
    gender: 'female',
    country: 'United States',
    city: 'Los Angeles',
    email: 'test@example.com',
    phoneNumber: '+1234567890',
    characteristics: 'Fashion influencer',
    pastClients: 'Nike',
    pastCampaigns: 'Summer 2024',
    comments: 'Great to work with',
    isActive: true,
    languages: 'English',
    categories: 'fashion, beauty',
    internalTags: 'vip',
    isBlacklisted: false,
    blacklistReason: null,
    agencyName: null,
    managerName: null,
    billingInfo: null,
    lastBrand: null,
    campaignsActive: null,
    lastCampaignCompleted: null,
    lastFee: null,
    lastFeeDate: null,
    lastFeeContentType: null,
    lastCpv: null,
    lastCpm: null,
    last3CampaignsPerf: null,
    rateSource: null,
    internalRating: 85,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    creatorSocials: [
      {
        id: 1,
        creatorId: 1,
        socialMedia: 'instagram',
        handle: 'testcreator',
        followers: 100000,
        tier: 'macro',
        socialLink: 'https://instagram.com/testcreator',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatorsService,
        {
          provide: CreatorsRepository,
          useValue: {
            findById: jest.fn(),
            findActiveByHandleAndPlatform: jest.fn(),
            findSoftDeletedByHandleAndPlatform: jest.fn(),
            create: jest.fn(),
            restore: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            findAllWithFilters: jest.fn(),
            countWithFilters: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<CreatorsService>(CreatorsService)
    repository = module.get(CreatorsRepository) as jest.Mocked<CreatorsRepository>
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('findById', () => {
    it('should return creator by ID', async () => {
      repository.findById.mockResolvedValue(mockCreator)

      const result = await service.findById(1)

      expect(repository.findById).toHaveBeenCalledWith(1)
      expect(result.id).toBe(1)
      expect(result.fullName).toBe('Test Creator')
    })

    it('should throw NotFoundException when creator not found', async () => {
      repository.findById.mockResolvedValue(null)

      await expect(service.findById(999)).rejects.toThrow(NotFoundException)
      await expect(service.findById(999)).rejects.toThrow('Creator with ID 999 not found')
    })
  })

  describe('create', () => {
    const createDto: CreateCreatorDto = {
      fullName: 'New Creator',
      socialAccounts: [
        {
          handle: 'newcreator',
          platform: 'instagram',
          followers: 50000,
        },
      ],
      country: 'Spain',
      email: 'new@example.com',
    }

    it('should create a new creator', async () => {
      repository.findActiveByHandleAndPlatform.mockResolvedValue(null)
      repository.findSoftDeletedByHandleAndPlatform.mockResolvedValue(null)
      repository.create.mockResolvedValue({
        ...mockCreator,
        id: 2,
        fullName: 'New Creator',
        country: 'Spain',
        email: 'new@example.com',
        creatorSocials: [
          {
            ...mockCreator.creatorSocials[0],
            id: 2,
            handle: 'newcreator',
            followers: 50000,
          },
        ],
      })

      const result = await service.create(createDto)

      expect(repository.findActiveByHandleAndPlatform).toHaveBeenCalledWith(
        'newcreator',
        'instagram'
      )
      expect(repository.findSoftDeletedByHandleAndPlatform).toHaveBeenCalledWith(
        'newcreator',
        'instagram'
      )
      expect(repository.create).toHaveBeenCalled()
      expect(result.fullName).toBe('New Creator')
      expect(result.restored).toBe(false)
    })

    it('should throw ConflictException when active creator with same handle exists', async () => {
      repository.findActiveByHandleAndPlatform.mockResolvedValue(mockCreator)

      await expect(service.create(createDto)).rejects.toThrow(ConflictException)
      await expect(service.create(createDto)).rejects.toThrow(
        'An influencer with handle "newcreator" already exists on instagram.'
      )
    })

    it('should restore soft-deleted creator when handle matches', async () => {
      const softDeletedCreator = { ...mockCreator, deletedAt: new Date() }
      repository.findActiveByHandleAndPlatform.mockResolvedValue(null)
      repository.findSoftDeletedByHandleAndPlatform.mockResolvedValue(softDeletedCreator)
      repository.restore.mockResolvedValue({
        ...mockCreator,
        fullName: 'New Creator',
        deletedAt: null,
      })

      const result = await service.create(createDto)

      expect(repository.restore).toHaveBeenCalledWith(
        mockCreator.id,
        expect.objectContaining({
          fullName: 'New Creator',
          country: 'Spain',
          email: 'new@example.com',
        })
      )
      expect(result.restored).toBe(true)
    })
  })

  describe('update', () => {
    const updateDto: UpdateCreatorDto = {
      fullName: 'Updated Creator',
      country: 'Mexico',
      isActive: false,
    }

    it('should update an existing creator', async () => {
      repository.findById.mockResolvedValue(mockCreator)
      repository.update.mockResolvedValue({
        ...mockCreator,
        fullName: 'Updated Creator',
        country: 'Mexico',
        isActive: false,
      })

      const result = await service.update(1, updateDto)

      expect(repository.findById).toHaveBeenCalledWith(1)
      expect(repository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          fullName: 'Updated Creator',
          country: 'Mexico',
          isActive: false,
        })
      )
      expect(result.fullName).toBe('Updated Creator')
      expect(result.country).toBe('Mexico')
      expect(result.isActive).toBe(false)
    })

    it('should throw NotFoundException when creator not found', async () => {
      repository.findById.mockResolvedValue(null)

      await expect(service.update(999, updateDto)).rejects.toThrow(NotFoundException)
      await expect(service.update(999, updateDto)).rejects.toThrow(
        'Influencer with ID 999 not found'
      )
    })

    it('should update blacklist status with reason', async () => {
      repository.findById.mockResolvedValue(mockCreator)
      repository.update.mockResolvedValue({
        ...mockCreator,
        isBlacklisted: true,
        blacklistReason: 'Policy violation',
      })

      const result = await service.update(1, {
        isBlacklisted: true,
        blacklistReason: 'Policy violation',
      })

      expect(repository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          isBlacklisted: true,
          blacklistReason: 'Policy violation',
        })
      )
      expect(result.isBlacklisted).toBe(true)
      expect(result.blacklistReason).toBe('Policy violation')
    })
  })

  describe('delete', () => {
    it('should soft delete an existing creator', async () => {
      repository.findById.mockResolvedValue(mockCreator)
      repository.softDelete.mockResolvedValue(undefined)

      const result = await service.delete(1)

      expect(repository.findById).toHaveBeenCalledWith(1)
      expect(repository.softDelete).toHaveBeenCalledWith(1)
      expect(result.message).toBe('Influencer deleted successfully')
    })

    it('should throw NotFoundException when creator not found', async () => {
      repository.findById.mockResolvedValue(null)

      await expect(service.delete(999)).rejects.toThrow(NotFoundException)
      await expect(service.delete(999)).rejects.toThrow('Influencer with ID 999 not found')
    })
  })

  describe('findAll', () => {
    it('should return paginated list of creators', async () => {
      repository.findAllWithFilters.mockResolvedValue([mockCreator])
      repository.countWithFilters.mockResolvedValue(1)

      const result = await service.findAll({ page: 1, pageSize: 20, platform: 'instagram' })

      expect(repository.findAllWithFilters).toHaveBeenCalled()
      expect(repository.countWithFilters).toHaveBeenCalled()
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
      expect(result.totalPages).toBe(1)
    })

    it('should apply filters correctly', async () => {
      repository.findAllWithFilters.mockResolvedValue([])
      repository.countWithFilters.mockResolvedValue(0)

      await service.findAll({
        page: 1,
        pageSize: 20,
        platform: 'tiktok',
        country: ['US', 'ES'],
        gender: 'female',
        minFollowers: 10000,
        excludeBlacklisted: true,
      })

      expect(repository.findAllWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: 'tiktok',
          country: ['US', 'ES'],
          gender: 'female',
          minFollowers: 10000,
          excludeBlacklisted: true,
        }),
        20,
        0
      )
    })

    it('should calculate pagination correctly', async () => {
      repository.findAllWithFilters.mockResolvedValue([mockCreator])
      repository.countWithFilters.mockResolvedValue(45)

      const result = await service.findAll({ page: 2, pageSize: 20, platform: 'instagram' })

      expect(repository.findAllWithFilters).toHaveBeenCalledWith(expect.anything(), 20, 20)
      expect(result.totalPages).toBe(3)
      expect(result.page).toBe(2)
    })
  })
})
