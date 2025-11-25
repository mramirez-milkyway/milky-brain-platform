# Implementation Tasks

## 1. Database Schema & Migrations

- [ ] 1.1 Add ExportControlSettings model to Prisma schema
- [ ] 1.2 Add ExportLog model to Prisma schema
- [ ] 1.3 Add Influencer mock model to Prisma schema
- [ ] 1.4 Update Role model to include exportControlSettings relation
- [ ] 1.5 Update User model to include exportLogs relation
- [ ] 1.6 Generate Prisma migration: `npx prisma migrate dev --name=add-export-controls`
- [ ] 1.7 Verify migration SQL for data safety (no data loss)
- [ ] 1.8 Create seed script for default export control settings (Admin, Editor, Viewer)
- [ ] 1.9 Create seed script for mock influencer data (50-100 records)
- [ ] 1.10 Test migration rollback plan

## 2. Backend - Export Controls Module

- [ ] 2.1 Create `apps/api/src/export-controls/` module directory
- [ ] 2.2 Create `export-controls.module.ts` with NestJS module definition
- [ ] 2.3 Create `export-controls.controller.ts` with CRUD endpoints
  - `GET /api/export-controls` - List all settings
  - `POST /api/export-controls` - Create setting
  - `PATCH /api/export-controls/:id` - Update setting
  - `DELETE /api/export-controls/:id` - Delete setting
  - `GET /api/export-controls/quota/:userId` - Get user's current quota
- [ ] 2.4 Create `export-controls.service.ts` with business logic
- [ ] 2.5 Create `export-controls.repository.ts` for database access
- [ ] 2.6 Create DTOs: `CreateExportControlDto`, `UpdateExportControlDto`, `ExportControlResponseDto`
- [ ] 2.7 Add validation decorators to DTOs (class-validator)
- [ ] 2.8 Implement permission guards: `@RequirePermission('exportControl:Manage')`
- [ ] 2.9 Add custom validation: daily limit ≤ monthly limit
- [ ] 2.10 Implement quota calculation logic (count from ExportLog)
- [ ] 2.11 Add audit logging for create/update/delete operations
- [ ] 2.12 Write unit tests for ExportControlsService (`export-controls.service.spec.ts`)
- [ ] 2.13 Write integration tests for ExportControlsController

## 3. Backend - PDF Generation Module

- [ ] 3.1 Install PDFKit: `npm install pdfkit @types/pdfkit`
- [ ] 3.2 Create `apps/api/src/pdf/` module directory
- [ ] 3.3 Create `pdf.module.ts` with NestJS module definition
- [ ] 3.4 Define `IPdfGenerator` interface in `interfaces/pdf-generator.interface.ts`
- [ ] 3.5 Create `pdfkit-generator.service.ts` implementing IPdfGenerator
- [ ] 3.6 Implement `createDocument()` method
- [ ] 3.7 Implement `addWatermark()` method with configurable text, rotation, opacity
- [ ] 3.8 Implement `addTable()` method for tabular data rendering
- [ ] 3.9 Implement `addPage()` method with header/footer support
- [ ] 3.10 Implement `finalize()` method returning ReadableStream
- [ ] 3.11 Add page numbering and metadata (title, author, creation date)
- [ ] 3.12 Implement alternating row colors and header styling
- [ ] 3.13 Add timeout protection (30s max generation time)
- [ ] 3.14 Write unit tests for PdfKitGeneratorService
- [ ] 3.15 Register IPdfGenerator provider in PdfModule

## 4. Backend - Mock Influencers Module

- [ ] 4.1 Create `apps/api/src/influencers/` module directory
- [ ] 4.2 Create `influencers.module.ts` with NestJS module definition
- [ ] 4.3 Create `influencers.controller.ts` with endpoints:
  - `GET /api/influencers` - List influencers (paginated)
  - `GET /api/influencers/export/pdf` - Export PDF
- [ ] 4.4 Create `influencers.service.ts` with mock data logic
- [ ] 4.5 Create `influencers.repository.ts` for database access
- [ ] 4.6 Implement row limit enforcement in export endpoint
- [ ] 4.7 Integrate with ExportControlsService to get user's limits
- [ ] 4.8 Integrate with PdfModule to generate watermarked PDFs
- [ ] 4.9 Create ExportLog entry after successful export
- [ ] 4.10 Check daily/monthly quotas before export, return 429 if exceeded
- [ ] 4.11 Add audit logging for export events (success, denied, quota exceeded)
- [ ] 4.12 Implement streaming response for PDF download
- [ ] 4.13 Set correct Content-Type and Content-Disposition headers
- [ ] 4.14 Add permission check: `@RequirePermission('influencer:Export')`
- [ ] 4.15 Write unit tests for InfluencersService
- [ ] 4.16 Write integration tests for export endpoint

## 5. Backend - RBAC Updates

- [ ] 5.1 Update `apps/api/src/common/services/rbac.service.ts` to include new permissions
- [ ] 5.2 Add `exportControl:Read` and `exportControl:Manage` to Admin policy
- [ ] 5.3 Add `influencer:Read` and `influencer:Export` to all roles
- [ ] 5.4 Update seed script with new permissions
- [ ] 5.5 Test permission checks for export controls endpoints
- [ ] 5.6 Test permission checks for influencer export endpoint

## 6. Backend - Audit Integration

- [ ] 6.1 Update audit event types enum to include:
  - `ExportControlSettingsCreated`
  - `ExportControlSettingsUpdated`
  - `ExportControlSettingsDeleted`
  - `DataExported`
  - `ExportFailed`
  - `ExportDenied`
- [ ] 6.2 Ensure export control CRUD operations emit audit events
- [ ] 6.3 Ensure export operations emit audit events with metadata
- [ ] 6.4 Test audit event creation for all new event types
- [ ] 6.5 Verify hash chain integrity with new events

## 7. Frontend - Settings Page Refactor

- [ ] 7.1 Refactor `apps/web-admin/src/app/settings/page.tsx` to use tabs layout
- [ ] 7.2 Move existing settings content to `GeneralSettings` component
- [ ] 7.3 Create `apps/web-admin/src/app/settings/components/GeneralSettings.tsx`
- [ ] 7.4 Implement Tabs component structure in settings page
- [ ] 7.5 Add "General" and "Export Controls" tabs
- [ ] 7.6 Implement tab state management (URL query param or local state)
- [ ] 7.7 Add permission check to hide "Export Controls" tab for non-Admin
- [ ] 7.8 Test tab navigation and content switching
- [ ] 7.9 Ensure existing settings functionality works in new tab layout
- [ ] 7.10 Update navigation breadcrumbs if needed

## 8. Frontend - Export Controls Settings UI

- [ ] 8.1 Create `apps/web-admin/src/app/settings/components/ExportControlsSettings.tsx`
- [ ] 8.2 Create API client methods in `apps/web-admin/src/lib/api-client.ts`:
  - `fetchExportControls()`
  - `createExportControl(data)`
  - `updateExportControl(id, data)`
  - `deleteExportControl(id)`
- [ ] 8.3 Implement TanStack Query hooks: `useExportControls`, `useCreateExportControl`, etc.
- [ ] 8.4 Create table component displaying all export control settings
- [ ] 8.5 Add table columns: Role, Export Type, Row Limit, Watermark, Daily/Monthly Limits, Actions
- [ ] 8.6 Implement "Add Setting" button and modal
- [ ] 8.7 Create `ExportControlForm` component with validation
- [ ] 8.8 Implement form fields: Role dropdown, Export Type dropdown, number inputs, toggle switch
- [ ] 8.9 Add client-side validation (daily ≤ monthly, row limit -1 or positive)
- [ ] 8.10 Implement Edit functionality (modal with pre-filled form)
- [ ] 8.11 Implement Delete functionality (confirmation dialog)
- [ ] 8.12 Implement "Reset to Default" functionality
- [ ] 8.13 Add success/error toast notifications
- [ ] 8.14 Format display values (unlimited, badges for watermark on/off)
- [ ] 8.15 Add loading states and error handling
- [ ] 8.16 Write React tests for ExportControlsSettings component

## 9. Frontend - Export Quota Indicator

- [ ] 9.1 Create `apps/web-admin/src/components/ExportQuotaIndicator.tsx`
- [ ] 9.2 Create API client method: `fetchUserQuota(userId)`
- [ ] 9.3 Implement TanStack Query hook: `useUserQuota`
- [ ] 9.4 Display row limit information
- [ ] 9.5 Display daily quota (remaining/total)
- [ ] 9.6 Display monthly quota (remaining/total)
- [ ] 9.7 Handle unlimited quota display
- [ ] 9.8 Implement warning styling for near-limit (≤ 2 remaining)
- [ ] 9.9 Implement error styling for exhausted quota (0 remaining)
- [ ] 9.10 Add icon and tooltip for additional information
- [ ] 9.11 Implement auto-refresh after export completion
- [ ] 9.12 Write React tests for ExportQuotaIndicator

## 10. Frontend - Mock Influencers Page

- [ ] 10.1 Create `apps/web-admin/src/app/influencers/page.tsx`
- [ ] 10.2 Create `apps/web-admin/src/app/influencers/layout.tsx`
- [ ] 10.3 Add "Influencers (Mock)" navigation item to sidebar (if needed)
- [ ] 10.4 Create API client methods: `fetchInfluencers()`, `exportInfluencersPdf()`
- [ ] 10.5 Implement TanStack Query hooks: `useInfluencers`, `useExportInfluencersPdf`
- [ ] 10.6 Create table component for displaying influencer data
- [ ] 10.7 Add prominent "Mock Data - For Testing Only" badge at top of page
- [ ] 10.8 Implement pagination for influencer list (if applicable)
- [ ] 10.9 Add ExportQuotaIndicator above export button
- [ ] 10.10 Create "Export PDF" button with loading state
- [ ] 10.11 Implement PDF download trigger (blob download)
- [ ] 10.12 Handle export errors (quota exceeded, permission denied)
- [ ] 10.13 Show success toast on successful export
- [ ] 10.14 Disable export button when quota exhausted
- [ ] 10.15 Add error toast with specific messages (429, 403, etc.)
- [ ] 10.16 Trigger quota refresh after successful export
- [ ] 10.17 Write React tests for influencers page

## 11. Frontend - Permission Integration

- [ ] 11.1 Update `apps/web-admin/src/lib/auth-store.ts` to include new permissions:
  - Admin: `exportControl:Read`, `exportControl:Manage`, `influencer:Export`
  - Editor: `influencer:Export`
  - Viewer: `influencer:Export`
- [ ] 11.2 Test permission checks for Export Controls tab visibility
- [ ] 11.3 Test permission checks for export control API calls
- [ ] 11.4 Test permission checks for influencer export button

## 12. Testing & Validation

- [ ] 12.1 Test Admin can create/edit/delete export control settings
- [ ] 12.2 Test Editor/Viewer cannot access export control settings
- [ ] 12.3 Test row limiting for Editor role (e.g., 70 row limit applied)
- [ ] 12.4 Test unlimited rows for Admin role (rowLimit = -1)
- [ ] 12.5 Test watermark appears on Editor PDFs, not on Admin PDFs
- [ ] 12.6 Test watermark on multi-page PDFs (appears on all pages)
- [ ] 12.7 Test daily quota enforcement (block after limit reached)
- [ ] 12.8 Test monthly quota enforcement
- [ ] 12.9 Test quota reset at UTC midnight (daily)
- [ ] 12.10 Test quota reset on first of month (monthly)
- [ ] 12.11 Test export with multiple roles (most permissive applied)
- [ ] 12.12 Test fallback to "all" export type when specific type not configured
- [ ] 12.13 Test audit events created for settings changes
- [ ] 12.14 Test audit events created for export operations
- [ ] 12.15 Test ExportLog entries created after exports
- [ ] 12.16 Test PDF generation performance (500 rows < 5 seconds)
- [ ] 12.17 Test concurrent PDF exports (5 simultaneous users)
- [ ] 12.18 Test PDF download in different browsers (Chrome, Firefox, Safari)
- [ ] 12.19 Test settings page tabs UI on mobile/tablet
- [ ] 12.20 Test form validation (daily ≤ monthly, row limit -1 or positive)
- [ ] 12.21 Run all unit tests: `npm test`
- [ ] 12.22 Run all integration tests
- [ ] 12.23 Run linter and fix issues: `npm run lint`
- [ ] 12.24 Test with existing data (no breaking changes)

## 13. Documentation & Cleanup

- [ ] 13.1 Add JSDoc comments to all new services and controllers
- [ ] 13.2 Document IPdfGenerator interface contract
- [ ] 13.3 Add README in `apps/api/src/export-controls/` explaining module
- [ ] 13.4 Add README in `apps/api/src/pdf/` explaining PDF generation
- [ ] 13.5 Document export control settings model in schema comments
- [ ] 13.6 Add API endpoint documentation (OpenAPI/Swagger if used)
- [ ] 13.7 Update project documentation with new features
- [ ] 13.8 Remove any console.log debugging statements
- [ ] 13.9 Clean up unused imports and variables
- [ ] 13.10 Verify no `any` types used (use `unknown` and parse)

## 14. Deployment Preparation

- [ ] 14.1 Review migration SQL for production safety
- [ ] 14.2 Prepare rollback plan documentation
- [ ] 14.3 Add ENABLE_EXPORT_CONTROLS feature flag to .env.example
- [ ] 14.4 Test with feature flag disabled (graceful degradation)
- [ ] 14.5 Verify all environment variables documented
- [ ] 14.6 Create deployment checklist
- [ ] 14.7 Plan for seeding default settings on production deployment
- [ ] 14.8 Verify backward compatibility with existing settings page
