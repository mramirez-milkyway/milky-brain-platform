import Papa from 'papaparse'
import { BaseJobHandler } from './base-handler'
import { JobContext } from '../types'

/**
 * Client data from CSV (before DB insertion)
 */
interface ClientData {
  name: string
  industry?: string
  country?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  notes?: string
}

/**
 * Handler for bulk CSV import of clients (customers)
 *
 * Payload schema:
 * {
 *   columnMapping: { [csvColumn: string]: string }, // e.g., {"Company Name": "name", "Industry": "industry"}
 *   duplicateHandling: "skip" | "update" // Default: "skip"
 * }
 *
 * Features:
 * - Imports data into Customer table
 * - Duplicate detection by name (case-insensitive)
 * - Skip or update duplicate handling modes
 * - Row-level error logging
 * - Batch processing for performance
 */
export class ClientImportHandler extends BaseJobHandler {
  async execute(context: JobContext): Promise<unknown> {
    const { payload, fileBuffer, fileName } = context

    // Validate payload
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid payload: expected object with columnMapping')
    }

    // Test trigger for unhandled exception (dev only)
    if ((payload as Record<string, unknown>)._testUnhandledException === true) {
      throw new Error(
        'Test unhandled exception in ClientImportHandler - triggered via _testUnhandledException flag'
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

    await this.logInfo(context, `Starting client CSV import from ${fileName || 'uploaded file'}`)
    await this.logInfo(context, `Duplicate handling mode: ${duplicateHandling}`)

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
    let duplicateCount = 0
    let createdClients = 0
    let updatedClients = 0

    // Process rows
    for (let rowNumber = 1; rowNumber <= rows.length; rowNumber++) {
      const row = rows[rowNumber - 1]

      // Skip completely empty rows
      if (this.isEmptyRow(row)) {
        skippedCount++
        await this.logWarning(
          context,
          `Row ${rowNumber}: Empty row - skipped`,
          undefined,
          rowNumber
        )
        continue
      }

      try {
        // Map row data
        const mappedData = this.mapRowData(row, columnMapping)

        // Validate required fields
        const validationError = this.validateClientRow(mappedData)
        if (validationError) {
          throw new Error(validationError)
        }

        const clientData = mappedData as ClientData

        // Check for duplicate by name (case-insensitive)
        const existingClient = await context.prisma.customer.findFirst({
          where: {
            name: {
              equals: clientData.name,
              mode: 'insensitive',
            },
            deletedAt: null,
          },
        })

        if (existingClient) {
          duplicateCount++

          if (duplicateHandling === 'skip') {
            await this.logInfo(
              context,
              `Row ${rowNumber}: Duplicate client '${clientData.name}' - skipped`,
              undefined,
              rowNumber
            )
            continue
          } else {
            // Update existing client (only non-null values)
            const updateData: Record<string, unknown> = {}

            if (clientData.industry !== undefined && clientData.industry !== null) {
              updateData.industry = clientData.industry
            }
            if (clientData.country !== undefined && clientData.country !== null) {
              updateData.country = clientData.country
            }
            if (clientData.contactName !== undefined && clientData.contactName !== null) {
              updateData.contactName = clientData.contactName
            }
            if (clientData.contactEmail !== undefined && clientData.contactEmail !== null) {
              updateData.contactEmail = clientData.contactEmail
            }
            if (clientData.contactPhone !== undefined && clientData.contactPhone !== null) {
              updateData.contactPhone = clientData.contactPhone
            }
            if (clientData.notes !== undefined && clientData.notes !== null) {
              updateData.notes = clientData.notes
            }

            if (Object.keys(updateData).length > 0) {
              await context.prisma.customer.update({
                where: { id: existingClient.id },
                data: updateData,
              })
            }

            updatedClients++
            successCount++
            await this.logInfo(
              context,
              `Row ${rowNumber}: Updated existing client '${clientData.name}'`,
              undefined,
              rowNumber
            )
          }
        } else {
          // Create new client
          await context.prisma.customer.create({
            data: {
              name: clientData.name,
              industry: clientData.industry,
              country: clientData.country,
              contactName: clientData.contactName,
              contactEmail: clientData.contactEmail,
              contactPhone: clientData.contactPhone,
              notes: clientData.notes,
            },
          })

          createdClients++
          successCount++
          await this.logInfo(
            context,
            `Row ${rowNumber}: Created new client '${clientData.name}'`,
            undefined,
            rowNumber
          )
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
      skippedCount,
      duplicateCount,
      createdClients,
      updatedClients,
    }

    await this.logInfo(
      context,
      `Import complete: ${createdClients} clients created, ${updatedClients} clients updated, ${duplicateCount} duplicates found, ${errorCount} errors, ${skippedCount} empty rows skipped`
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
   * Map CSV row data to ClientData fields using column mapping
   */
  private mapRowData(
    row: Record<string, string>,
    columnMapping: Record<string, string>
  ): Partial<ClientData> {
    const mappedData: Partial<ClientData> = {}

    for (const [csvColumn, dbField] of Object.entries(columnMapping)) {
      const value = row[csvColumn]

      if (value === undefined || value === null || value.trim() === '') {
        continue // Skip empty values
      }

      const trimmedValue = value.trim()

      // Map to ClientData fields
      switch (dbField) {
        case 'name':
        case 'industry':
        case 'country':
        case 'contactName':
        case 'contactEmail':
        case 'contactPhone':
        case 'notes':
          mappedData[dbField as keyof ClientData] = trimmedValue
          break

        default:
          // Unknown field, skip
          break
      }
    }

    return mappedData
  }

  /**
   * Validate required fields for client row
   */
  private validateClientRow(data: Partial<ClientData>): string | null {
    // Check required fields
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      return "Missing required field 'name'"
    }

    // Validate email format if provided
    if (data.contactEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.contactEmail)) {
        return `Invalid email format for 'contactEmail': ${data.contactEmail}`
      }
    }

    return null
  }
}
