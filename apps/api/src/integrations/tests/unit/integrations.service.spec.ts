import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { IntegrationsService } from '../../integrations.service'

describe('IntegrationsService', () => {
  let service: IntegrationsService
  let configService: ConfigService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'IMAI_API_KEY') return 'test-api-key'
              if (key === 'IMAI_API_BASE_URL') return 'https://test.imai.co/api'
              return null
            }),
          },
        },
      ],
    }).compile()

    service = module.get<IntegrationsService>(IntegrationsService)
    configService = module.get<ConfigService>(ConfigService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getAllIntegrationsUsage', () => {
    it('should return integrations array with IMAI', async () => {
      // Mock fetch for IMAI API
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, credits: 5000 }),
        })
      ) as jest.Mock

      const result = await service.getAllIntegrationsUsage()

      expect(result).toHaveProperty('integrations')
      expect(Array.isArray(result.integrations)).toBe(true)
      expect(result.integrations.length).toBeGreaterThan(0)
    })
  })

  describe('getImaiUsage - not configured', () => {
    it('should return inactive status when IMAI is not configured', async () => {
      // Mock missing config
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'IMAI_API_KEY') return null
        if (key === 'IMAI_API_BASE_URL') return null
        return null
      })

      const result = await service.getAllIntegrationsUsage()
      const imaiIntegration = result.integrations.find((i) => i.provider === 'IMAI')

      expect(imaiIntegration).toBeDefined()
      expect(imaiIntegration?.status).toBe('inactive')
      expect(imaiIntegration?.errorMessage).toContain('not configured')
    })
  })

  describe('getImaiUsage - API success', () => {
    it('should return active status with quota data on API success', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, credits: 7500 }),
        })
      ) as jest.Mock

      const result = await service.getAllIntegrationsUsage()
      const imaiIntegration = result.integrations.find((i) => i.provider === 'IMAI')

      expect(imaiIntegration).toBeDefined()
      expect(imaiIntegration?.status).toBe('active')
      expect(imaiIntegration?.remainingQuota).toBe(7500)
      expect(imaiIntegration?.reloadInfo).toContain('27th at 3am UTC')
    })
  })

  describe('getImaiUsage - API error', () => {
    it('should return error status when API call fails', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
      ) as jest.Mock

      const result = await service.getAllIntegrationsUsage()
      const imaiIntegration = result.integrations.find((i) => i.provider === 'IMAI')

      expect(imaiIntegration).toBeDefined()
      expect(imaiIntegration?.status).toBe('error')
      expect(imaiIntegration?.errorMessage).toBeDefined()
    })
  })
})
