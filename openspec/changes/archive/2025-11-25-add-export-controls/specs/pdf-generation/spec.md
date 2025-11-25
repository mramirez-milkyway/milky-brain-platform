## ADDED Requirements

### Requirement: PDF Generation Infrastructure
The system SHALL provide server-side PDF generation capabilities with support for watermarking and streaming.

#### Scenario: Generate PDF with content
- **WHEN** the system generates a PDF export for influencer list
- **AND** the data contains 50 influencer records
- **THEN** the system creates a PDF document with a table displaying all records
- **AND** includes headers: Name, Platform, Followers, Engagement, Category
- **AND** uses appropriate font sizes and spacing for readability

#### Scenario: Multi-page PDF generation
- **WHEN** the system generates a PDF with 100 records
- **AND** each page fits approximately 20 records
- **THEN** the system creates a 5-page PDF document
- **AND** each page includes page numbers in the footer
- **AND** page breaks occur at appropriate row boundaries

#### Scenario: PDF streaming for large exports
- **WHEN** the system generates a PDF with 500 records
- **THEN** the PDF is streamed to the response in chunks
- **AND** the download begins within 1 second
- **AND** memory usage remains under 100MB during generation

#### Scenario: PDF returned with correct headers
- **WHEN** a PDF export is generated
- **THEN** the HTTP response includes:
  - Content-Type: application/pdf
  - Content-Disposition: attachment; filename="influencer-list-YYYY-MM-DD.pdf"
- **AND** the filename includes the current date in ISO format

#### Scenario: PDF generation error handling
- **WHEN** PDF generation fails due to an error (e.g., invalid data)
- **THEN** the system logs the error with full context
- **AND** returns HTTP 500 Internal Server Error
- **AND** displays user-friendly error: "Failed to generate PDF. Please try again."
- **AND** does NOT create an ExportLog entry

### Requirement: PDF Watermarking
The system SHALL apply configurable watermarks to PDF documents based on role-based export control settings.

#### Scenario: PDF generated with watermark for Editor
- **WHEN** a user with Editor role exports an influencer list
- **AND** the export control setting has enableWatermark = true
- **THEN** the system generates a PDF with a watermark on every page
- **AND** the watermark text is "Milky Way Agency - Confidential"
- **AND** the watermark is rendered diagonally at 45 degrees
- **AND** uses gray color (#cccccc) with 30% opacity
- **AND** font size is 60pt
- **AND** positioned centered across the page

#### Scenario: PDF generated without watermark for Admin
- **WHEN** a user with Admin role exports an influencer list
- **AND** the export control setting has enableWatermark = false
- **THEN** the system generates a PDF with NO watermark
- **AND** the document appears clean without any overlay text

#### Scenario: Watermark applied to all pages
- **WHEN** generating a 10-page PDF with watermark enabled
- **THEN** the watermark appears on all 10 pages
- **AND** each page has identical watermark placement and styling
- **AND** watermark does not interfere with content readability

#### Scenario: Watermark rendered behind content
- **WHEN** applying a watermark to a PDF page
- **THEN** the watermark is rendered in a separate layer behind the content
- **AND** content text is fully readable over the watermark
- **AND** watermark does not obscure critical information

#### Scenario: Watermark configuration retrieved from settings
- **WHEN** generating a PDF export
- **AND** the user's role is determined
- **THEN** the system queries ExportControlSettings for the role and export type
- **AND** checks the enableWatermark field
- **AND** applies or omits watermark accordingly

### Requirement: PDF Generation Library Abstraction
The system SHALL abstract PDF generation behind an interface to allow future library replacement.

#### Scenario: PDF generator interface defined
- **WHEN** the system implements PDF generation
- **THEN** a TypeScript interface IPdfGenerator is defined with methods:
  - `createDocument(): IPdfDocument`
  - `addPage(document: IPdfDocument): void`
  - `addText(document: IPdfDocument, text: string, options: TextOptions): void`
  - `addTable(document: IPdfDocument, data: TableData, options: TableOptions): void`
  - `addWatermark(document: IPdfDocument, text: string, options: WatermarkOptions): void`
  - `finalize(document: IPdfDocument): ReadableStream`

#### Scenario: PDFKit implementation registered
- **WHEN** the application initializes the PdfModule
- **THEN** the module registers PdfKitGenerator as the implementation of IPdfGenerator
- **AND** uses NestJS dependency injection to provide the implementation
- **AND** all consumers depend on IPdfGenerator interface, not concrete class

#### Scenario: Library can be swapped without changing consumers
- **WHEN** a developer needs to replace PDFKit with another library
- **THEN** they create a new class implementing IPdfGenerator interface
- **AND** update the provider binding in PdfModule
- **AND** NO changes are required in controllers or services consuming IPdfGenerator

### Requirement: PDF Generation Performance
The system SHALL generate PDFs efficiently without blocking API responsiveness.

#### Scenario: Small PDF generated quickly
- **WHEN** generating a PDF with 20 records
- **THEN** the PDF is fully generated and streamed within 500ms
- **AND** the user receives the download prompt within 1 second

#### Scenario: Large PDF does not block API
- **WHEN** generating a PDF with 500 records (near maximum row limit)
- **AND** other API requests are being processed concurrently
- **THEN** the PDF generation does not block the Node.js event loop
- **AND** other endpoints maintain p95 latency under 200ms

#### Scenario: PDF generation timeout protection
- **WHEN** PDF generation takes longer than 30 seconds
- **THEN** the system terminates the generation process
- **AND** returns HTTP 504 Gateway Timeout
- **AND** displays error: "PDF generation timed out. Please try exporting fewer rows."

#### Scenario: Concurrent PDF generation supported
- **WHEN** 5 users simultaneously request PDF exports
- **THEN** all 5 PDFs are generated concurrently without errors
- **AND** each user receives their correctly formatted PDF
- **AND** system memory usage remains under 500MB total

### Requirement: PDF Content Formatting
The system SHALL format PDF content with appropriate styling, layout, and readability.

#### Scenario: Table headers styled distinctly
- **WHEN** generating a PDF with tabular data
- **THEN** the table header row has:
  - Bold font weight
  - Slightly larger font size (12pt vs 10pt for data)
  - Light gray background (#f3f4f6)
  - Bottom border separator

#### Scenario: Alternating row colors for readability
- **WHEN** rendering table rows in the PDF
- **THEN** odd rows have white background (#ffffff)
- **AND** even rows have light gray background (#f9fafb)
- **AND** alternating pattern improves visual scanning

#### Scenario: Column widths optimized for content
- **WHEN** generating a PDF table
- **THEN** column widths are proportional to content:
  - Name: 25%
  - Platform: 15%
  - Followers: 15%
  - Engagement: 15%
  - Category: 20%
  - Remaining: 10% padding
- **AND** text wraps within column boundaries if too long

#### Scenario: PDF includes header and footer
- **WHEN** generating each page of the PDF
- **THEN** the page includes:
  - Header: "Influencer List Export" title and export date
  - Footer: Page number (e.g., "Page 1 of 5") and generation timestamp
- **AND** header/footer use smaller font (8pt) and gray color

#### Scenario: PDF metadata included
- **WHEN** generating a PDF document
- **THEN** the PDF metadata includes:
  - Title: "Influencer List Export"
  - Author: "Milky Way Agency"
  - Creator: "Milky Way Admin Panel"
  - Creation Date: current timestamp
  - Subject: "Export of influencer data"
