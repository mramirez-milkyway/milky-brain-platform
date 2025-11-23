import { Injectable } from '@nestjs/common'
import { PrismaClient, ExportControlSettings, Prisma } from '@prisma/client'

@Injectable()
export class ExportControlsRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<(ExportControlSettings & { role: { name: string } })[]> {
    return this.prisma.exportControlSettings.findMany({
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { role: { name: 'asc' } },
        { exportType: 'asc' },
      ],
    })
  }

  async findById(id: number): Promise<(ExportControlSettings & { role: { name: string } }) | null> {
    return this.prisma.exportControlSettings.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    })
  }

  async findByRoleAndType(roleId: number, exportType: string): Promise<ExportControlSettings | null> {
    return this.prisma.exportControlSettings.findUnique({
      where: {
        unique_role_export_type: {
          roleId,
          exportType,
        },
      },
    })
  }

  async findByRoleIds(roleIds: number[], exportType: string): Promise<ExportControlSettings[]> {
    // Try to find specific export type first
    const specific = await this.prisma.exportControlSettings.findMany({
      where: {
        roleId: { in: roleIds },
        exportType,
      },
    })

    // If no specific settings found, try 'all' as fallback
    if (specific.length === 0) {
      return this.prisma.exportControlSettings.findMany({
        where: {
          roleId: { in: roleIds },
          exportType: 'all',
        },
      })
    }

    return specific
  }

  async create(data: Prisma.ExportControlSettingsCreateInput): Promise<ExportControlSettings> {
    return this.prisma.exportControlSettings.create({
      data,
    })
  }

  async update(id: number, data: Prisma.ExportControlSettingsUpdateInput): Promise<ExportControlSettings> {
    return this.prisma.exportControlSettings.update({
      where: { id },
      data,
    })
  }

  async delete(id: number): Promise<ExportControlSettings> {
    return this.prisma.exportControlSettings.delete({
      where: { id },
    })
  }

  async countExportsToday(userId: number, exportType?: string): Promise<number> {
    const startOfDay = new Date()
    startOfDay.setUTCHours(0, 0, 0, 0)

    return this.prisma.exportLog.count({
      where: {
        userId,
        exportedAt: {
          gte: startOfDay,
        },
        ...(exportType && { exportType }),
      },
    })
  }

  async countExportsThisMonth(userId: number, exportType?: string): Promise<number> {
    const startOfMonth = new Date()
    startOfMonth.setUTCDate(1)
    startOfMonth.setUTCHours(0, 0, 0, 0)

    return this.prisma.exportLog.count({
      where: {
        userId,
        exportedAt: {
          gte: startOfMonth,
        },
        ...(exportType && { exportType }),
      },
    })
  }
}
