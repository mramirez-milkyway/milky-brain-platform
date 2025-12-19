import Papa from 'papaparse'
import { BaseJobHandler } from './base-handler'
import { JobContext } from '../types'

/**
 * Creator data from CSV (before DB insertion)
 */
interface CreatorData {
  // Temporary field for grouping (not stored in DB)
  creatorId: string

  // Creator fields
  fullName: string
  gender?: string
  country?: string
  city?: string
  email?: string
  phoneNumber?: string
  characteristics?: string
  pastClients?: string
  pastCampaigns?: string
  comments?: string
  languages?: string // JSON string
  categories?: string // JSON string
  internalTags?: string // JSON string
  isBlacklisted?: boolean
  blacklistReason?: string
  agencyName?: string
  managerName?: string
  billingInfo?: string

  // CreatorSocial fields
  handle: string
  socialMedia: string
  followers?: number
  tier?: string
  socialLink?: string
}

/**
 * Handler for bulk CSV import of creators and their social media accounts
 *
 * Payload schema:
 * {
 *   columnMapping: { [csvColumn: string]: string }, // e.g., {"Creator ID": "creatorId", "Full Name": "fullName"}
 * }
 *
 * Features:
 * - Groups rows by creator_id (temporary field, not stored)
 * - Upserts creators and social accounts
 * - Protects non-null values from being overwritten by null
 * - Row-level error logging
 */
export class CreatorImportHandler extends BaseJobHandler {
  async execute(context: JobContext): Promise<unknown> {
    const { payload, fileBuffer, fileName } = context

    // Validate payload
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid payload: expected object with columnMapping')
    }

    const { columnMapping } = payload as {
      columnMapping?: Record<string, string>
    }

    if (!columnMapping) {
      throw new Error('Missing required field: columnMapping')
    }

    if (!fileBuffer) {
      throw new Error('No file uploaded for import')
    }

    await this.logInfo(context, `Starting creator CSV import from ${fileName || 'uploaded file'}`)

    // Parse CSV from buffer
    await this.logInfo(context, 'Parsing CSV file...')
    const csvContent = fileBuffer.toString('utf-8')

    const parseResult = Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    })

    if (parseResult.errors.length > 0) {
      await this.logWarning(
        context,
        `CSV parsing warnings: ${parseResult.errors.map((e: Papa.ParseError) => e.message).join(', ')}`
      )
    }

    const rows = parseResult.data
    await this.logInfo(context, `Parsed ${rows.length} rows from CSV`)

    let successCount = 0
    let errorCount = 0
    let skippedCount = 0
    let createdCreators = 0
    let restoredCreators = 0
    let updatedSocialAccounts = 0
    let createdSocialAccounts = 0
    let restoredSocialAccounts = 0

    // Group rows by creator_id
    const creatorGroups = new Map<string, CreatorData[]>()

    for (let rowNumber = 1; rowNumber <= rows.length; rowNumber++) {
      const row = rows[rowNumber - 1]

      // Skip completely empty rows
      if (this.isEmptyRow(row)) {
        skippedCount++
        continue
      }

      try {
        // Map row data
        const mappedData = this.mapRowData(row, columnMapping)

        // Validate required fields
        const validationError = this.validateCreatorRow(mappedData)
        if (validationError) {
          throw new Error(validationError)
        }

        // At this point, validation ensures creatorId exists
        const creatorId = mappedData.creatorId!
        if (!creatorGroups.has(creatorId)) {
          creatorGroups.set(creatorId, [])
        }
        creatorGroups.get(creatorId)!.push(mappedData as CreatorData)
      } catch (error) {
        errorCount++
        const errorMessage = error instanceof Error ? error.message : String(error)
        await this.logError(
          context,
          `Row ${rowNumber}: ${errorMessage}`,
          { originalData: row },
          rowNumber
        )
      }
    }

    await this.logInfo(context, `Grouped into ${creatorGroups.size} unique creators`)

    // Process each creator group
    for (const [creatorId, socialAccounts] of creatorGroups.entries()) {
      try {
        // Get creator data from first row (all rows should have same creator data)
        const firstRow = socialAccounts[0]

        // Find or create creator (check both active and soft-deleted)
        let creator = await context.prisma.creator.findFirst({
          where: {
            fullName: {
              equals: firstRow.fullName,
              mode: 'insensitive',
            },
            deletedAt: null, // First check active creators
          },
        })

        // If not found, check for soft-deleted creator
        if (!creator) {
          const softDeletedCreator = await context.prisma.creator.findFirst({
            where: {
              fullName: {
                equals: firstRow.fullName,
                mode: 'insensitive',
              },
              deletedAt: { not: null },
            },
          })

          if (softDeletedCreator) {
            // Restore the soft-deleted creator
            creator = await context.prisma.creator.update({
              where: { id: softDeletedCreator.id },
              data: {
                deletedAt: null,
                gender: firstRow.gender ?? softDeletedCreator.gender,
                country: firstRow.country ?? softDeletedCreator.country,
                city: firstRow.city ?? softDeletedCreator.city,
                email: firstRow.email ?? softDeletedCreator.email,
                phoneNumber: firstRow.phoneNumber ?? softDeletedCreator.phoneNumber,
                characteristics: firstRow.characteristics ?? softDeletedCreator.characteristics,
                pastClients: firstRow.pastClients ?? softDeletedCreator.pastClients,
                pastCampaigns: firstRow.pastCampaigns ?? softDeletedCreator.pastCampaigns,
                comments: firstRow.comments ?? softDeletedCreator.comments,
                languages: firstRow.languages ?? softDeletedCreator.languages,
                categories: firstRow.categories ?? softDeletedCreator.categories,
                internalTags: firstRow.internalTags ?? softDeletedCreator.internalTags,
                isBlacklisted: firstRow.isBlacklisted ?? softDeletedCreator.isBlacklisted,
                blacklistReason: firstRow.blacklistReason ?? softDeletedCreator.blacklistReason,
                agencyName: firstRow.agencyName ?? softDeletedCreator.agencyName,
                managerName: firstRow.managerName ?? softDeletedCreator.managerName,
                billingInfo: firstRow.billingInfo ?? softDeletedCreator.billingInfo,
              },
            })

            restoredCreators++
            await this.logInfo(
              context,
              `Restored soft-deleted creator: ${creator.fullName} (ID: ${creator.id})`
            )
          }
        }

        if (!creator) {
          // Create new creator
          creator = await context.prisma.creator.create({
            data: {
              fullName: firstRow.fullName,
              gender: firstRow.gender,
              country: firstRow.country,
              city: firstRow.city,
              email: firstRow.email,
              phoneNumber: firstRow.phoneNumber,
              characteristics: firstRow.characteristics,
              pastClients: firstRow.pastClients,
              pastCampaigns: firstRow.pastCampaigns,
              comments: firstRow.comments,
              languages: firstRow.languages,
              categories: firstRow.categories,
              internalTags: firstRow.internalTags,
              isBlacklisted: firstRow.isBlacklisted || false,
              blacklistReason: firstRow.blacklistReason,
              agencyName: firstRow.agencyName,
              managerName: firstRow.managerName,
              billingInfo: firstRow.billingInfo,
            },
          })

          createdCreators++
          await this.logInfo(
            context,
            `Created new creator: ${creator.fullName} (ID: ${creator.id})`
          )
        } else {
          // Update creator (only non-null values)
          const updateData: Record<string, unknown> = {}

          if (firstRow.gender !== null && firstRow.gender !== undefined)
            updateData.gender = firstRow.gender
          if (firstRow.country !== null && firstRow.country !== undefined)
            updateData.country = firstRow.country
          if (firstRow.city !== null && firstRow.city !== undefined) updateData.city = firstRow.city
          if (firstRow.email !== null && firstRow.email !== undefined)
            updateData.email = firstRow.email
          if (firstRow.phoneNumber !== null && firstRow.phoneNumber !== undefined)
            updateData.phoneNumber = firstRow.phoneNumber
          if (firstRow.characteristics !== null && firstRow.characteristics !== undefined)
            updateData.characteristics = firstRow.characteristics
          if (firstRow.pastClients !== null && firstRow.pastClients !== undefined)
            updateData.pastClients = firstRow.pastClients
          if (firstRow.pastCampaigns !== null && firstRow.pastCampaigns !== undefined)
            updateData.pastCampaigns = firstRow.pastCampaigns
          if (firstRow.comments !== null && firstRow.comments !== undefined)
            updateData.comments = firstRow.comments
          if (firstRow.languages !== null && firstRow.languages !== undefined)
            updateData.languages = firstRow.languages
          if (firstRow.categories !== null && firstRow.categories !== undefined)
            updateData.categories = firstRow.categories
          if (firstRow.internalTags !== null && firstRow.internalTags !== undefined)
            updateData.internalTags = firstRow.internalTags
          if (firstRow.isBlacklisted !== null && firstRow.isBlacklisted !== undefined)
            updateData.isBlacklisted = firstRow.isBlacklisted
          if (firstRow.blacklistReason !== null && firstRow.blacklistReason !== undefined)
            updateData.blacklistReason = firstRow.blacklistReason
          if (firstRow.agencyName !== null && firstRow.agencyName !== undefined)
            updateData.agencyName = firstRow.agencyName
          if (firstRow.managerName !== null && firstRow.managerName !== undefined)
            updateData.managerName = firstRow.managerName
          if (firstRow.billingInfo !== null && firstRow.billingInfo !== undefined)
            updateData.billingInfo = firstRow.billingInfo

          if (Object.keys(updateData).length > 0) {
            await context.prisma.creator.update({
              where: { id: creator.id },
              data: updateData,
            })
          }

          await this.logInfo(
            context,
            `Found existing creator: ${creator.fullName} (ID: ${creator.id})`
          )
        }

        // Process social media accounts for this creator
        for (const socialData of socialAccounts) {
          try {
            // Check if social account exists
            const existingSocial = await context.prisma.creatorSocial.findUnique({
              where: {
                unique_handle_social_media: {
                  handle: socialData.handle,
                  socialMedia: socialData.socialMedia,
                },
              },
            })

            if (existingSocial) {
              // Check if it's soft-deleted - if so, restore it
              if (existingSocial.deletedAt !== null) {
                // Restore soft-deleted social account
                const socialUpdateData: Record<string, unknown> = {
                  deletedAt: null, // Clear the soft-delete marker
                  creatorId: creator.id, // Link to current creator
                }

                if (socialData.followers !== null && socialData.followers !== undefined)
                  socialUpdateData.followers = socialData.followers
                if (socialData.tier !== null && socialData.tier !== undefined)
                  socialUpdateData.tier = socialData.tier
                if (socialData.socialLink !== null && socialData.socialLink !== undefined)
                  socialUpdateData.socialLink = socialData.socialLink

                await context.prisma.creatorSocial.update({
                  where: { id: existingSocial.id },
                  data: socialUpdateData,
                })

                restoredSocialAccounts++
                await this.logInfo(
                  context,
                  `Restored soft-deleted social account: ${socialData.handle} (${socialData.socialMedia})`
                )
              } else {
                // Update existing active social account (only non-null values)
                const socialUpdateData: Record<string, unknown> = {}

                if (socialData.followers !== null && socialData.followers !== undefined)
                  socialUpdateData.followers = socialData.followers
                if (socialData.tier !== null && socialData.tier !== undefined)
                  socialUpdateData.tier = socialData.tier
                if (socialData.socialLink !== null && socialData.socialLink !== undefined)
                  socialUpdateData.socialLink = socialData.socialLink

                if (Object.keys(socialUpdateData).length > 0) {
                  await context.prisma.creatorSocial.update({
                    where: { id: existingSocial.id },
                    data: socialUpdateData,
                  })
                }

                updatedSocialAccounts++
                await this.logInfo(
                  context,
                  `Updated social account: ${socialData.handle} (${socialData.socialMedia})`
                )
              }
            } else {
              // Create new social account
              await context.prisma.creatorSocial.create({
                data: {
                  creatorId: creator.id,
                  handle: socialData.handle,
                  socialMedia: socialData.socialMedia,
                  followers: socialData.followers,
                  tier: socialData.tier,
                  socialLink: socialData.socialLink,
                },
              })

              createdSocialAccounts++
              await this.logInfo(
                context,
                `Created social account: ${socialData.handle} (${socialData.socialMedia})`
              )
            }

            successCount++
          } catch (socialError) {
            errorCount++
            const errorMessage =
              socialError instanceof Error ? socialError.message : String(socialError)
            await this.logError(
              context,
              `Failed to process social account ${socialData.handle} (${socialData.socialMedia}): ${errorMessage}`
            )
          }
        }
      } catch (creatorError) {
        errorCount++
        const errorMessage =
          creatorError instanceof Error ? creatorError.message : String(creatorError)
        await this.logError(
          context,
          `Failed to process creator group ${creatorId}: ${errorMessage}`
        )
      }
    }

    // Final summary
    const summary = {
      totalRows: rows.length,
      successCount,
      errorCount,
      skippedCount,
      createdCreators,
      restoredCreators,
      createdSocialAccounts,
      restoredSocialAccounts,
      updatedSocialAccounts,
    }

    await this.logInfo(
      context,
      `Import complete: ${createdCreators} creators created, ${restoredCreators} restored, ${createdSocialAccounts} social accounts created, ${restoredSocialAccounts} social accounts restored, ${updatedSocialAccounts} social accounts updated, ${errorCount} errors, ${skippedCount} skipped`
    )

    return summary
  }

  /**
   * Check if a row is empty (all values are empty strings or null)
   */
  private isEmptyRow(row: Record<string, string>): boolean {
    return Object.values(row).every((value) => !value || value.trim() === '')
  }

  /**
   * Map CSV row data to CreatorData fields using column mapping
   */
  private mapRowData(
    row: Record<string, string>,
    columnMapping: Record<string, string>
  ): Partial<CreatorData> {
    const mappedData: Partial<CreatorData> = {}

    for (const [csvColumn, dbField] of Object.entries(columnMapping)) {
      const value = row[csvColumn]

      if (value === undefined || value === null || value.trim() === '') {
        continue // Skip empty values
      }

      const trimmedValue = value.trim()

      // Type conversion based on field
      switch (dbField) {
        case 'creatorId':
        case 'fullName':
        case 'handle':
        case 'socialMedia':
        case 'gender':
        case 'country':
        case 'city':
        case 'email':
        case 'phoneNumber':
        case 'characteristics':
        case 'pastClients':
        case 'pastCampaigns':
        case 'comments':
        case 'languages':
        case 'categories':
        case 'internalTags':
        case 'blacklistReason':
        case 'agencyName':
        case 'managerName':
        case 'billingInfo':
        case 'tier':
        case 'socialLink':
          mappedData[dbField as keyof CreatorData] = trimmedValue as never
          break

        case 'followers':
          const followers = parseInt(trimmedValue.replace(/,/g, ''), 10)
          if (!isNaN(followers)) {
            mappedData.followers = followers
          }
          break

        case 'isBlacklisted':
          const boolValue = trimmedValue.toLowerCase()
          if (boolValue === 'true' || boolValue === '1' || boolValue === 'yes') {
            mappedData.isBlacklisted = true
          } else if (boolValue === 'false' || boolValue === '0' || boolValue === 'no') {
            mappedData.isBlacklisted = false
          }
          break

        default:
          // Unknown field, skip
          break
      }
    }

    return mappedData
  }

  /**
   * Validate required fields for creator row
   */
  private validateCreatorRow(data: Partial<CreatorData>): string | null {
    // Check required fields
    if (!data.creatorId || typeof data.creatorId !== 'string') {
      return "Missing required field 'creator_id'"
    }

    if (!data.fullName || typeof data.fullName !== 'string') {
      return "Missing required field 'full_name'"
    }

    if (!data.handle || typeof data.handle !== 'string') {
      return "Missing required field 'handle'"
    }

    if (!data.socialMedia || typeof data.socialMedia !== 'string') {
      return "Missing required field 'social_media'"
    }

    // Validate follower count if provided
    if (
      data.followers !== undefined &&
      (typeof data.followers !== 'number' || data.followers < 0)
    ) {
      return "Invalid value for 'followers': must be a positive number"
    }

    return null
  }
}
