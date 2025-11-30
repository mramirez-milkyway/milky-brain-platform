import { Test, TestingModule } from '@nestjs/testing'
import { IntegrationsController } from '../../integrations.controller'
import { IntegrationsService } from '../../integrations.service'

describe('IntegrationsController', () => {
  let controller: IntegrationsController
  let service: IntegrationsService

  const mockIntegrationsService = {
    getAllIntegrationsUsage: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntegrationsController],
      providers: [
        {
          provide: IntegrationsService,
          useValue: mockIntegrationsService,
        },
      ],
    }).compile()

    controller = module.get<IntegrationsController>(IntegrationsController)
    service = module.get<IntegrationsService>(IntegrationsService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getUsage', () => {
    it('should call service.getAllIntegrationsUsage and return result', async () => {
      const mockResponse = {
        integrations: [
          {
            provider: 'IMAI',
            totalQuota: 10000,
            remainingQuota: 7500,
            usedQuota: 2500,
            usagePercentage: 25,
            status: 'active' as const,
            reloadInfo: 'Tokens reload every month on the 27th at 3am UTC',
          },
        ],
      }

      mockIntegrationsService.getAllIntegrationsUsage.mockResolvedValue(mockResponse)

      const result = await controller.getUsage()

      expect(service.getAllIntegrationsUsage).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })
  })
})
