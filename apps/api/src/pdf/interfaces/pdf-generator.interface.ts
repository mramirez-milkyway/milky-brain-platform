import { Readable } from 'stream'

export interface WatermarkOptions {
  text: string
  opacity?: number
  fontSize?: number
  color?: string
  rotation?: number
}

export interface TextOptions {
  fontSize?: number
  color?: string
  bold?: boolean
  align?: 'left' | 'center' | 'right'
}

export interface TableColumn {
  header: string
  field: string
  width?: number
}

export interface TableOptions {
  columns: TableColumn[]
  alternateRowColors?: boolean
  headerBackgroundColor?: string
  evenRowColor?: string
  oddRowColor?: string
}

export interface PageOptions {
  title?: string
  pageNumber?: number
  totalPages?: number
  date?: string
}

export interface DocumentMetadata {
  title: string
  author?: string
  subject?: string
  creator?: string
}

/**
 * Interface for PDF generation
 * Abstracts the underlying PDF library to allow easy replacement
 */
export interface IPdfGenerator {
  /**
   * Create a new PDF document
   */
  createDocument(metadata?: DocumentMetadata): unknown

  /**
   * Add a watermark to the current page
   */
  addWatermark(document: unknown, options: WatermarkOptions): void

  /**
   * Add a table with data to the document
   */
  addTable(document: unknown, data: unknown[], options: TableOptions): void

  /**
   * Add a new page with optional header/footer
   */
  addPage(document: unknown, options?: PageOptions): void

  /**
   * Add text to the document
   */
  addText(document: unknown, text: string, x?: number, y?: number, options?: TextOptions): void

  /**
   * Finalize the document and return a readable stream
   */
  finalize(document: unknown): Readable
}
