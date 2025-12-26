import { Test, TestingModule } from '@nestjs/testing'
import { SettingsService } from '../../../src/settings/settings.service'
import { PrismaService } from '../../../src/prisma/prisma.service'
import { DEFAULT_THRESHOLDS } from '../../../src/settings/dto/data-refresh-settings.dto'

describe('SettingsService', () => {
  let service: SettingsService
  let prisma: {
    setting: {
      findMany: jest.Mock
      upsert: jest.Mock
    }
    workspace: {
      findFirst: jest.Mock
      create: jest.Mock
      update: jest.Mock
    }
  }

  beforeEach(async () => {
    prisma = {
      setting: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
      workspace: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile()

    service = module.get<SettingsService>(SettingsService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getDataRefreshSettings', () => {
    it('should return default values when no settings exist', async () => {
      prisma.setting.findMany.mockResolvedValue([])

      const result = await service.getDataRefreshSettings()

      expect(result).toEqual({
        instagram: { basicDataDays: 30, audienceDataDays: 180 },
        tiktok: { basicDataDays: 30, audienceDataDays: 180 },
        youtube: { basicDataDays: 30, audienceDataDays: 180 },
      })

      expect(prisma.setting.findMany).toHaveBeenCalledWith({
        where: {
          key: {
            in: ['dataRefresh.instagram', 'dataRefresh.tiktok', 'dataRefresh.youtube'],
          },
        },
      })
    })

    it('should return stored values for existing settings', async () => {
      prisma.setting.findMany.mockResolvedValue([
        {
          key: 'dataRefresh.instagram',
          value: { basicDataDays: 14, audienceDataDays: 90 },
        },
        {
          key: 'dataRefresh.tiktok',
          value: { basicDataDays: 7, audienceDataDays: 60 },
        },
      ])

      const result = await service.getDataRefreshSettings()

      expect(result).toEqual({
        instagram: { basicDataDays: 14, audienceDataDays: 90 },
        tiktok: { basicDataDays: 7, audienceDataDays: 60 },
        youtube: { basicDataDays: 30, audienceDataDays: 180 },
      })
    })

    it('should handle partial stored values with defaults', async () => {
      prisma.setting.findMany.mockResolvedValue([
        {
          key: 'dataRefresh.instagram',
          value: { basicDataDays: 14 },
        },
      ])

      const result = await service.getDataRefreshSettings()

      expect(result.instagram).toEqual({
        basicDataDays: 14,
        audienceDataDays: 180,
      })
    })
  })

  describe('updateDataRefreshSettings', () => {
    it('should upsert settings for specified networks', async () => {
      prisma.setting.upsert.mockResolvedValue({})
      prisma.setting.findMany.mockResolvedValue([
        {
          key: 'dataRefresh.instagram',
          value: { basicDataDays: 14, audienceDataDays: 90 },
        },
      ])

      const updateDto = {
        instagram: { basicDataDays: 14, audienceDataDays: 90 },
      }

      await service.updateDataRefreshSettings(updateDto, 1)

      expect(prisma.setting.upsert).toHaveBeenCalledWith({
        where: { key: 'dataRefresh.instagram' },
        create: {
          key: 'dataRefresh.instagram',
          value: { basicDataDays: 14, audienceDataDays: 90 },
          version: 1,
          updatedBy: 1,
          description: 'Data refresh thresholds for instagram',
        },
        update: {
          value: { basicDataDays: 14, audienceDataDays: 90 },
          version: { increment: 1 },
          updatedBy: 1,
        },
      })
    })

    it('should update multiple networks at once', async () => {
      prisma.setting.upsert.mockResolvedValue({})
      prisma.setting.findMany.mockResolvedValue([])

      const updateDto = {
        instagram: { basicDataDays: 14, audienceDataDays: 90 },
        tiktok: { basicDataDays: 7, audienceDataDays: 60 },
      }

      await service.updateDataRefreshSettings(updateDto, 1)

      expect(prisma.setting.upsert).toHaveBeenCalledTimes(2)
    })

    it('should skip undefined network values', async () => {
      prisma.setting.upsert.mockResolvedValue({})
      prisma.setting.findMany.mockResolvedValue([])

      const updateDto = {
        instagram: { basicDataDays: 14, audienceDataDays: 90 },
        tiktok: undefined,
      }

      await service.updateDataRefreshSettings(updateDto as any, 1)

      expect(prisma.setting.upsert).toHaveBeenCalledTimes(1)
      expect(prisma.setting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'dataRefresh.instagram' },
        }),
      )
    })

    it('should return complete settings after update', async () => {
      prisma.setting.upsert.mockResolvedValue({})
      prisma.setting.findMany.mockResolvedValue([
        {
          key: 'dataRefresh.instagram',
          value: { basicDataDays: 14, audienceDataDays: 90 },
        },
      ])

      const result = await service.updateDataRefreshSettings(
        { instagram: { basicDataDays: 14, audienceDataDays: 90 } },
        1,
      )

      expect(result).toEqual({
        instagram: { basicDataDays: 14, audienceDataDays: 90 },
        tiktok: { basicDataDays: 30, audienceDataDays: 180 },
        youtube: { basicDataDays: 30, audienceDataDays: 180 },
      })
    })

    it('should work without userId', async () => {
      prisma.setting.upsert.mockResolvedValue({})
      prisma.setting.findMany.mockResolvedValue([])

      await service.updateDataRefreshSettings({
        instagram: { basicDataDays: 14, audienceDataDays: 90 },
      })

      expect(prisma.setting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            updatedBy: undefined,
          }),
          update: expect.objectContaining({
            updatedBy: undefined,
          }),
        }),
      )
    })
  })
})
