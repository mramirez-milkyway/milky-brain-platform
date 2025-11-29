import { Controller, Get } from '@nestjs/common'
import { SkipCsrf } from '../common/decorators/skip-csrf.decorator'

@Controller()
export class HealthController {
  @SkipCsrf()
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    }
  }
}
