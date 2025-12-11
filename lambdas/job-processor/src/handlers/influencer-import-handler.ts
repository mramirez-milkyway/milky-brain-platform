import Papa from 'papaparse'
import { BaseJobHandler } from './base-handler'
import { JobContext } from '../types'

/**
 * Influencer data structure matching the database schema
 */
interface InfluencerData {
  name: string
  platform: string
  followers: number
  engagement: number
  category: string
}

/**
 * Handler for bulk CSV import of influencers
 *
 * Payload schema:
 * {
 *   columnMapping: { [csvColumn: string]: string }, // e.g., {"Name": "name", "Platform": "platform"}
 *   duplicateHandling: "skip" | "update" // How to handle duplicates (default: skip)
 * }
 */
export class InfluencerImportHandler extends BaseJobHandler {
  async execute(context: JobContext): Promise<unknown> {
    const { payload, fileBuffer, fileName } = context

    // Validate payload
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid payload: expected object with columnMapping')
    }

    // Test trigger for unhandled exception (dev only)
    if ((payload as Record<string, unknown>)._testUnhandledException === true) {
      throw new Error(
        'Test unhandled exception in InfluencerImportHandler - triggered via _testUnhandledException flag'
      )
    }

    const { columnMapping, duplicateHandling = 'skip' } = payload as {
      columnMapping?: Record<string, string>
      duplicateHandling?: 'skip' | 'update'
    }

    if (!columnMapping) {
      throw new Error('Missing required field: columnMapping')
    }

    if (!fileBuffer) {
      throw new Error('No file uploaded for import')
    }

    await this.logInfo(
      context,
      `Starting influencer CSV import from ${fileName || 'uploaded file'}`
    )
    await this.logInfo(context, `Duplicate handling mode: ${duplicateHandling}`)

    // Parse CSV from buffer
    await this.logInfo(context, 'Parsing CSV file...')
    const csvContent = fileBuffer.toString('utf-8')

    // Parse CSV
    await this.logInfo(context, 'Parsing CSV file...')
    const parseResult = Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    })

    if (parseResult.errors.length > 0) {
      const error = parseResult.errors[0]
      throw new Error(`CSV parsing error at row ${error.row}: ${error.message}`)
    }

    const rows = parseResult.data
    await this.logInfo(context, `Parsed ${rows.length} rows from CSV`)

    // Process rows
    let successCount = 0
    let errorCount = 0
    let duplicateCount = 0
    let skippedCount = 0

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2 // +1 for 0-index, +1 for header row
      const row = rows[i]

      try {
        // Skip empty rows
        if (this.isEmptyRow(row)) {
          await this.logWarning(
            context,
            `Row ${rowNumber}: Empty row - skipped`,
            undefined,
            rowNumber
          )
          skippedCount++
          continue
        }

        // Map CSV columns to database fields
        const mappedData = this.mapRowData(row, columnMapping)

        // Validate required fields
        const validationError = this.validateInfluencer(mappedData)
        if (validationError) {
          await this.logError(context, `Row ${rowNumber}: ${validationError}`, undefined, rowNumber)
          errorCount++
          continue
        }

        // Check for duplicates by name (case-insensitive)
        const existing = await context.prisma.influencer.findFirst({
          where: {
            name: {
              equals: mappedData.name,
              mode: 'insensitive',
            },
            platform: mappedData.platform,
          },
        })

        if (existing) {
          duplicateCount++

          if (duplicateHandling === 'skip') {
            await this.logInfo(
              context,
              `Row ${rowNumber}: Duplicate influencer '${mappedData.name}' on ${mappedData.platform} - skipped`,
              undefined,
              rowNumber
            )
            continue
          } else if (duplicateHandling === 'update') {
            // Update existing record
            await context.prisma.influencer.update({
              where: { id: existing.id },
              data: {
                followers: mappedData.followers,
                engagement: mappedData.engagement,
                category: mappedData.category,
              },
            })

            await this.logInfo(
              context,
              `Row ${rowNumber}: Updated existing influencer '${mappedData.name}' on ${mappedData.platform}`,
              undefined,
              rowNumber
            )
            successCount++
            continue
          }
        }

        // Create new influencer
        await context.prisma.influencer.create({
          data: mappedData as InfluencerData,
        })

        successCount++

        // Log every 100 successful records
        if (successCount % 100 === 0) {
          await this.logInfo(context, `Processed ${successCount} records successfully...`)
        }
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

    // Final summary
    const summary = {
      totalRows: rows.length,
      successCount,
      errorCount,
      duplicateCount,
      skippedCount: skippedCount + (duplicateHandling === 'skip' ? duplicateCount : 0),
    }

    await this.logInfo(
      context,
      `Import complete: ${successCount} created, ${errorCount} errors, ${duplicateCount} duplicates, ${skippedCount} skipped`
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
   * Map CSV row data to database fields using column mapping
   */
  private mapRowData(
    row: Record<string, string>,
    columnMapping: Record<string, string>
  ): Partial<InfluencerData> {
    const mappedData: Partial<InfluencerData> = {}

    for (const [csvColumn, dbField] of Object.entries(columnMapping)) {
      const value = row[csvColumn]

      if (value === undefined || value === null || value.trim() === '') {
        continue // Skip empty values
      }

      // Type conversion based on field
      if (dbField === 'followers') {
        const parsed = parseInt(value.replace(/,/g, ''), 10) // Remove commas
        if (!isNaN(parsed)) {
          mappedData.followers = parsed
        }
      } else if (dbField === 'engagement') {
        const parsed = parseFloat(value.replace('%', '')) // Remove % sign
        if (!isNaN(parsed)) {
          mappedData.engagement = parsed
        }
      } else if (dbField === 'name') {
        mappedData.name = value.trim()
      } else if (dbField === 'platform') {
        mappedData.platform = value.trim()
      } else if (dbField === 'category') {
        mappedData.category = value.trim()
      }
    }

    return mappedData
  }

  /**
   * Validate required fields for Influencer model
   */
  private validateInfluencer(data: Partial<InfluencerData>): string | null {
    // Check required fields (based on schema: name, platform, followers, engagement, category)
    if (!data.name || typeof data.name !== 'string') {
      return "Missing required field 'name'"
    }

    if (!data.platform || typeof data.platform !== 'string') {
      return "Missing required field 'platform'"
    }

    if (data.followers === undefined || typeof data.followers !== 'number') {
      return "Missing or invalid required field 'followers' (expected number)"
    }

    if (data.engagement === undefined || typeof data.engagement !== 'number') {
      return "Missing or invalid required field 'engagement' (expected number)"
    }

    if (!data.category || typeof data.category !== 'string') {
      return "Missing required field 'category'"
    }

    // Validate data types
    if (data.followers < 0) {
      return "Invalid value for 'followers' (must be >= 0)"
    }

    if (data.engagement < 0 || data.engagement > 100) {
      return "Invalid value for 'engagement' (must be between 0 and 100)"
    }

    return null
  }
}
