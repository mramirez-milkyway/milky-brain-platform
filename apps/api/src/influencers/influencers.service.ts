import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { Readable } from 'stream'
import { InfluencersRepository } from './influencers.repository'
import { ExportControlsService } from '../export-controls/export-controls.service'
import { PdfKitGeneratorService } from '../pdf/pdfkit-generator.service'
import { InfluencerResponseDto, PaginatedInfluencersResponseDto } from './dto/influencer-response.dto'

@Injectable()
export class InfluencersService {
  constructor(
    private readonly repository: InfluencersRepository,
    private readonly exportControlsService: ExportControlsService,
    @Inject('IPdfGenerator')
    private readonly pdfGenerator: PdfKitGeneratorService,
    private readonly prisma: PrismaClient,
  ) {}

  async findAll(page = 1, pageSize = 20): Promise<PaginatedInfluencersResponseDto> {
    const offset = (page - 1) * pageSize
    const [data, total] = await Promise.all([
      this.repository.findAll(pageSize, offset),
      this.repository.count(),
    ])

    return {
      data: data.map((influencer) => ({
        id: influencer.id,
        name: influencer.name,
        platform: influencer.platform,
        followers: influencer.followers,
        engagement: influencer.engagement,
        category: influencer.category,
        createdAt: influencer.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  async exportToPdf(
    userId: number,
    roleIds: number[],
  ): Promise<{ stream: Readable; filename: string; rowCount: number; watermarked: boolean }> {
    const exportType = 'influencer_list'

    // Check quota availability
    const quotaAvailable = await this.exportControlsService.checkQuotaAvailable(
      userId,
      roleIds,
      exportType,
    )

    if (!quotaAvailable) {
      const quota = await this.exportControlsService.getUserQuota(userId, roleIds, exportType)

      if (quota.dailyRemaining !== null && quota.dailyRemaining <= 0) {
        throw new ForbiddenException(
          `Daily export limit reached (${quota.dailyLimit}/${quota.dailyLimit}). Resets at midnight UTC.`,
        )
      }

      if (quota.monthlyRemaining !== null && quota.monthlyRemaining <= 0) {
        throw new ForbiddenException(
          `Monthly export limit reached (${quota.monthlyLimit}/${quota.monthlyLimit}). Resets on the 1st of next month.`,
        )
      }
    }

    // Get quota to determine row limit and watermark settings
    const quota = await this.exportControlsService.getUserQuota(userId, roleIds, exportType)

    // Fetch data with row limit applied
    const limit = quota.rowLimit === -1 ? undefined : quota.rowLimit
    const influencers = await this.repository.findAll(limit)

    // Generate PDF
    const doc = this.pdfGenerator.createDocument({
      title: 'Influencer List Export',
      author: 'Milky Way Agency',
      subject: 'Export of influencer data',
    })

    // Add title
    this.pdfGenerator.addText(doc, 'Influencer List Export', undefined, undefined, {
      fontSize: 18,
      bold: true,
      align: 'center',
    })

    this.pdfGenerator.addText(doc, `Generated: ${new Date().toLocaleDateString()}`, undefined, undefined, {
      fontSize: 10,
      color: '#6b7280',
      align: 'center',
    })

    // Add watermark if enabled
    if (quota.enableWatermark) {
      this.pdfGenerator.addWatermark(doc, {
        text: 'Milky Way Agency - Confidential',
      })
    }

    // Add table
    this.pdfGenerator.addTable(doc, influencers, {
      columns: [
        { header: 'Name', field: 'name' },
        { header: 'Platform', field: 'platform' },
        { header: 'Followers', field: 'followers' },
        { header: 'Engagement %', field: 'engagement' },
        { header: 'Category', field: 'category' },
      ],
      alternateRowColors: true,
    })

    // Log export
    await this.prisma.exportLog.create({
      data: {
        userId,
        exportType,
        rowCount: influencers.length,
        watermark: quota.enableWatermark ? 'Milky Way Agency - Confidential' : null,
      },
    })

    const stream = this.pdfGenerator.finalize(doc)
    const filename = `influencer-list-${new Date().toISOString().split('T')[0]}.pdf`

    return {
      stream,
      filename,
      rowCount: influencers.length,
      watermarked: quota.enableWatermark,
    }
  }
}
