import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { ExportControlsRepository } from './export-controls.repository'
import { CreateExportControlDto } from './dto/create-export-control.dto'
import { UpdateExportControlDto } from './dto/update-export-control.dto'
import { ExportControlResponseDto, UserQuotaResponseDto } from './dto/export-control-response.dto'

@Injectable()
export class ExportControlsService {
  constructor(private readonly repository: ExportControlsRepository) {}

  async findAll(): Promise<ExportControlResponseDto[]> {
    const settings = await this.repository.findAll()
    return settings.map((setting) => ({
      id: setting.id,
      roleId: setting.roleId,
      roleName: setting.role.name,
      exportType: setting.exportType,
      rowLimit: setting.rowLimit,
      enableWatermark: setting.enableWatermark,
      dailyLimit: setting.dailyLimit,
      monthlyLimit: setting.monthlyLimit,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    }))
  }

  async findById(id: number): Promise<ExportControlResponseDto> {
    const setting = await this.repository.findById(id)

    if (!setting) {
      throw new NotFoundException(`Export control setting with ID ${id} not found`)
    }

    return {
      id: setting.id,
      roleId: setting.roleId,
      roleName: setting.role.name,
      exportType: setting.exportType,
      rowLimit: setting.rowLimit,
      enableWatermark: setting.enableWatermark,
      dailyLimit: setting.dailyLimit,
      monthlyLimit: setting.monthlyLimit,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    }
  }

  async create(dto: CreateExportControlDto): Promise<ExportControlResponseDto> {
    // Check if setting already exists for this role and export type
    const existing = await this.repository.findByRoleAndType(dto.roleId, dto.exportType)

    if (existing) {
      throw new ConflictException(
        `Export control setting already exists for this role and export type`
      )
    }

    // Validate daily limit doesn't exceed monthly limit
    if (dto.dailyLimit && dto.monthlyLimit && dto.dailyLimit > dto.monthlyLimit) {
      throw new BadRequestException('Daily limit cannot exceed monthly limit')
    }

    const setting = await this.repository.create({
      role: { connect: { id: dto.roleId } },
      exportType: dto.exportType,
      rowLimit: dto.rowLimit,
      enableWatermark: dto.enableWatermark,
      dailyLimit: dto.dailyLimit ?? null,
      monthlyLimit: dto.monthlyLimit ?? null,
    })

    return this.findById(setting.id)
  }

  async update(id: number, dto: UpdateExportControlDto): Promise<ExportControlResponseDto> {
    const existing = await this.repository.findById(id)

    if (!existing) {
      throw new NotFoundException(`Export control setting with ID ${id} not found`)
    }

    // Validate daily limit doesn't exceed monthly limit
    const newDailyLimit = dto.dailyLimit !== undefined ? dto.dailyLimit : existing.dailyLimit
    const newMonthlyLimit =
      dto.monthlyLimit !== undefined ? dto.monthlyLimit : existing.monthlyLimit

    if (newDailyLimit && newMonthlyLimit && newDailyLimit > newMonthlyLimit) {
      throw new BadRequestException('Daily limit cannot exceed monthly limit')
    }

    const updated = await this.repository.update(id, {
      ...(dto.roleId && { role: { connect: { id: dto.roleId } } }),
      ...(dto.exportType && { exportType: dto.exportType }),
      ...(dto.rowLimit !== undefined && { rowLimit: dto.rowLimit }),
      ...(dto.enableWatermark !== undefined && { enableWatermark: dto.enableWatermark }),
      ...(dto.dailyLimit !== undefined && { dailyLimit: dto.dailyLimit }),
      ...(dto.monthlyLimit !== undefined && { monthlyLimit: dto.monthlyLimit }),
    })

    return this.findById(updated.id)
  }

  async delete(id: number): Promise<void> {
    const existing = await this.repository.findById(id)

    if (!existing) {
      throw new NotFoundException(`Export control setting with ID ${id} not found`)
    }

    await this.repository.delete(id)
  }

  async getUserQuota(
    userId: number,
    roleIds: number[],
    exportType: string
  ): Promise<UserQuotaResponseDto> {
    console.log(
      '[DEBUG] getUserQuota service - userId:',
      userId,
      'roleIds:',
      roleIds,
      'exportType:',
      exportType
    )

    // Get export control settings for user's roles
    const settings = await this.repository.findByRoleIds(roleIds, exportType)

    console.log('[DEBUG] Found settings:', settings)

    if (settings.length === 0) {
      throw new NotFoundException(`No export control settings found for the user's roles`)
    }

    // Apply most permissive settings (OR logic)
    const mostPermissive = settings.reduce((prev, curr) => {
      const prevLimit = prev.rowLimit === -1 ? Infinity : prev.rowLimit
      const currLimit = curr.rowLimit === -1 ? Infinity : curr.rowLimit

      return {
        ...prev,
        rowLimit:
          Math.max(prevLimit, currLimit) === Infinity ? -1 : Math.max(prev.rowLimit, curr.rowLimit),
        enableWatermark: prev.enableWatermark && curr.enableWatermark, // Only watermark if ALL roles require it
        dailyLimit: Math.max(prev.dailyLimit ?? 0, curr.dailyLimit ?? 0) || null,
        monthlyLimit: Math.max(prev.monthlyLimit ?? 0, curr.monthlyLimit ?? 0) || null,
      }
    })

    // Count usage
    const dailyUsed = await this.repository.countExportsToday(userId, exportType)
    const monthlyUsed = await this.repository.countExportsThisMonth(userId, exportType)

    const dailyRemaining = mostPermissive.dailyLimit ? mostPermissive.dailyLimit - dailyUsed : null
    const monthlyRemaining = mostPermissive.monthlyLimit
      ? mostPermissive.monthlyLimit - monthlyUsed
      : null

    return {
      userId,
      exportType,
      rowLimit: mostPermissive.rowLimit,
      enableWatermark: mostPermissive.enableWatermark,
      dailyLimit: mostPermissive.dailyLimit,
      monthlyLimit: mostPermissive.monthlyLimit,
      dailyUsed,
      monthlyUsed,
      dailyRemaining,
      monthlyRemaining,
    }
  }

  async checkQuotaAvailable(
    userId: number,
    roleIds: number[],
    exportType: string
  ): Promise<boolean> {
    const quota = await this.getUserQuota(userId, roleIds, exportType)

    // Check daily limit
    if (quota.dailyLimit !== null && quota.dailyRemaining !== null && quota.dailyRemaining <= 0) {
      return false
    }

    // Check monthly limit
    if (
      quota.monthlyLimit !== null &&
      quota.monthlyRemaining !== null &&
      quota.monthlyRemaining <= 0
    ) {
      return false
    }

    return true
  }
}
