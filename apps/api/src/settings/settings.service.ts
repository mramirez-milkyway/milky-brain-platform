import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrgSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getOrgSettings() {
    let workspace = await this.prisma.workspace.findFirst();

    if (!workspace) {
      workspace = await this.prisma.workspace.create({
        data: {
          name: 'My Organization',
          timezone: 'UTC',
          currency: 'USD',
        },
      });
    }

    return workspace;
  }

  async updateOrgSettings(updateDto: UpdateOrgSettingsDto) {
    const workspace = await this.prisma.workspace.findFirst();

    if (workspace) {
      return this.prisma.workspace.update({
        where: { id: workspace.id },
        data: updateDto,
      });
    }

    return this.prisma.workspace.create({
      data: {
        name: updateDto.name || 'My Organization',
        timezone: updateDto.timezone || 'UTC',
        currency: updateDto.currency || 'USD',
        logoUrl: updateDto.logoUrl,
      },
    });
  }
}
