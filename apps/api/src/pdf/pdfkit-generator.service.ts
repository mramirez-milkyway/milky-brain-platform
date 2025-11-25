import { Injectable } from '@nestjs/common'
import PDFDocument from 'pdfkit'
import { Readable } from 'stream'
import {
  IPdfGenerator,
  WatermarkOptions,
  TextOptions,
  TableOptions,
  PageOptions,
  DocumentMetadata,
} from './interfaces/pdf-generator.interface'

type PDFDoc = InstanceType<typeof PDFDocument>

@Injectable()
export class PdfKitGeneratorService implements IPdfGenerator {
  createDocument(metadata?: DocumentMetadata): PDFDoc {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: metadata?.title || 'Export Document',
        Author: metadata?.author || 'Milky Way Agency',
        Subject: metadata?.subject || 'Data Export',
        Creator: metadata?.creator || 'Milky Way Admin Panel',
      },
    })

    return doc
  }

  addWatermark(document: unknown, options: WatermarkOptions): void {
    const doc = document as PDFDoc
    const { text, opacity = 0.3, fontSize = 60, color = '#cccccc', rotation = 45 } = options

    const pageWidth = doc.page.width
    const pageHeight = doc.page.height

    // Save current position and state
    const currentY = doc.y

    doc.save()

    // Position watermark in the center without affecting document flow
    doc.rotate(rotation, { origin: [pageWidth / 2, pageHeight / 2] })
    doc
      .fontSize(fontSize)
      .fillColor(color)
      .opacity(opacity)
      .text(text, 0, pageHeight / 2 - fontSize / 2, {
        align: 'center',
        width: pageWidth,
        lineBreak: false,
      })

    doc.restore()

    // Restore the Y position so content continues from where it was
    doc.y = currentY
  }

  addTable(document: unknown, data: unknown[], options: TableOptions): void {
    const doc = document as PDFDoc
    const {
      columns,
      alternateRowColors = true,
      headerBackgroundColor = '#f3f4f6',
      evenRowColor = '#ffffff',
      oddRowColor = '#f9fafb',
    } = options

    const startY = doc.y
    const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const columnWidth = tableWidth / columns.length
    const rowHeight = 25

    // Draw header row
    doc.save()
    doc.fillColor('#000000').opacity(0.05)
    doc.rect(doc.page.margins.left, startY, tableWidth, rowHeight).fill()
    doc.restore()

    doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold')

    columns.forEach((column, i) => {
      const x = doc.page.margins.left + i * columnWidth
      doc.text(column.header, x + 5, startY + 7, {
        width: columnWidth - 10,
        align: 'left',
      })
    })

    doc
      .moveTo(doc.page.margins.left, startY + rowHeight)
      .lineTo(doc.page.margins.left + tableWidth, startY + rowHeight)
      .stroke('#d1d5db')

    // Draw data rows
    doc.font('Helvetica').fontSize(10)

    data.forEach((row: any, rowIndex) => {
      const y = startY + rowHeight * (rowIndex + 1)

      // Check if we need a new page
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage()
        // Re-add header on new page
        this.addTable(doc, data.slice(rowIndex), options)
        return
      }

      // Alternating row colors
      if (alternateRowColors) {
        const bgColor = rowIndex % 2 === 0 ? evenRowColor : oddRowColor
        doc.save()
        doc.fillColor(bgColor).opacity(1)
        doc.rect(doc.page.margins.left, y, tableWidth, rowHeight).fill()
        doc.restore()
      }

      // Draw cell data
      columns.forEach((column, i) => {
        const x = doc.page.margins.left + i * columnWidth
        const value = row[column.field]
        const displayValue = value !== null && value !== undefined ? String(value) : ''

        doc.fillColor('#374151').text(displayValue, x + 5, y + 7, {
          width: columnWidth - 10,
          align: 'left',
        })
      })

      // Row border
      doc
        .moveTo(doc.page.margins.left, y + rowHeight)
        .lineTo(doc.page.margins.left + tableWidth, y + rowHeight)
        .stroke('#e5e7eb')
    })

    doc.moveDown(2)
  }

  addPage(document: unknown, options?: PageOptions): void {
    const doc = document as PDFDoc
    doc.addPage()

    // Add header if title provided
    if (options?.title) {
      doc.fontSize(16).font('Helvetica-Bold').text(options.title, {
        align: 'center',
      })
      doc.moveDown(0.5)
    }

    // Add page number in footer
    if (options?.pageNumber && options?.totalPages) {
      const pageText = `Page ${options.pageNumber} of ${options.totalPages}`
      doc.fontSize(8).fillColor('#6b7280').text(pageText, {
        align: 'center',
      })
    }
  }

  addText(document: unknown, text: string, x?: number, y?: number, options?: TextOptions): void {
    const doc = document as PDFDoc
    const { fontSize = 12, color = '#000000', bold = false, align = 'left' } = options || {}

    doc
      .fontSize(fontSize)
      .fillColor(color)
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')

    if (x !== undefined && y !== undefined) {
      doc.text(text, x, y, { align })
    } else {
      doc.text(text, { align })
    }
  }

  finalize(document: unknown): Readable {
    const doc = document as PDFDoc
    doc.end()
    return doc as unknown as Readable
  }
}
