import { Controller, Get, UseGuards } from '@nestjs/common';
import { NavigationService } from './navigation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('navigation')
@UseGuards(JwtAuthGuard)
export class NavigationController {
  constructor(private navigationService: NavigationService) {}

  @Get()
  async getNavigation(@CurrentUser() user: any) {
    return {
      navigation: await this.navigationService.getNavigationForUser(user.userId),
    };
  }
}
