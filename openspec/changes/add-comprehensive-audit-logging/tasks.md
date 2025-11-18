# Implementation Tasks

## 1. Backend - Environment Configuration
- [x] 1.1 Add `MAX_AUDIT_EXPORT_MONTHS=3` to `.env.example`
- [x] 1.2 Add `MAX_AUDIT_EXPORT_MONTHS=3` to `.env` (local development)
- [x] 1.3 Document environment variable in README or deployment docs

## 2. Backend - Automatic Request Logging
- [x] 2.1 Create `apps/api/src/common/interceptors/audit.interceptor.ts`
  - Implement `NestInterceptor` interface
  - Extract user from `request.user` (JWT context)
  - Extract IP from `X-Forwarded-For` header or `request.ip`
  - Extract user agent from `request.headers['user-agent']`
  - Map HTTP method + route to `action` field (e.g., "POST /users")
  - Extract entity type from route (e.g., "/users" → "user")
  - Capture request body in `afterState` for POST/PUT/PATCH
  - Call `auditService.log()` asynchronously
  - Handle errors without breaking request flow
- [x] 2.2 Add route exclusion logic for `/health`, `/metrics` endpoints
- [x] 2.3 Register `AuditInterceptor` globally in `apps/api/src/app.module.ts`
  - Add to `providers` array with `APP_INTERCEPTOR` token
- [x] 2.4 Test interceptor captures requests on 5+ different endpoints
- [x] 2.5 Verify audit events created with correct `actorId`, `action`, `ipAddress`, `userAgent`

## 3. Backend - Enhanced Filtering (Query Parameters)
- [x] 3.1 Create DTOs for validation: `apps/api/src/audit/dto/audit-query.dto.ts`
  - `@IsOptional() @IsDateString() startDate?: string`
  - `@IsOptional() @IsDateString() endDate?: string`
  - `@IsOptional() @IsInt() userId?: number`
  - `@IsOptional() @IsString() action?: string`
  - `@IsOptional() @IsInt() @Max(1000) limit?: number`
- [x] 3.2 Update `AuditController.findAll()` to use `AuditQueryDto` with `@Query()` decorator
- [x] 3.3 Update `AuditService.searchEvents()` to accept date range parameters
  - Add `startDate?: Date` and `endDate?: Date` to method signature
  - Add Prisma `where` clause: `createdAt: { gte: startDate, lte: endDate }`
  - Convert string dates to Date objects with timezone handling (UTC)
- [x] 3.4 Update `AuditService.searchEvents()` to support `userId` filter (already exists as `actorId`)
- [x] 3.5 Add maximum limit enforcement (cap at 1000 even if higher requested)
- [x] 3.6 Test filtering with various combinations:
  - Date range only
  - User only
  - Date range + user
  - Invalid date formats (expect 400 error)

## 4. Backend - CSV Export Service
- [x] 4.1 Create `apps/api/src/audit/audit-export.service.ts`
  - Inject `AuditService` and `ConfigService`
  - Implement `createCsvStream(filters)` method
  - Use Node.js `Readable` stream to yield CSV rows
  - Query audit events with filters
  - Format header row: `Timestamp,Actor ID,Actor Name,Actor Email,Action,Entity Type,Entity ID,IP Address,User Agent,Before State,After State,Hash`
  - Format data rows with proper CSV escaping (quotes, commas, newlines)
  - Encode as UTF-8
- [x] 4.2 Implement `validateExportRange(startDate, endDate)` helper
  - Calculate date difference in days
  - Get `MAX_AUDIT_EXPORT_MONTHS` from config
  - Throw `BadRequestException` if range exceeds limit
- [x] 4.3 Implement `generateFilename(filters)` helper
  - Include user ID if filtered: `audit-log-user-{id}-...`
  - Include date range if filtered: `audit-log-{start}-to-{end}.csv`
  - Default: `audit-log-{current-date}.csv`
- [x] 4.4 Add CSV escaping utility for special characters (quotes, commas, newlines)
- [x] 4.5 Test CSV generation with 1000+ events (verify streaming works)
- [x] 4.6 Test CSV escaping with special characters, Unicode, null values

## 5. Backend - Export Endpoint
- [x] 5.1 Add `@Get('export')` endpoint to `AuditController`
  - Use `@Query()` with `AuditQueryDto` for filters
  - Apply `@RequirePermission('audit:Export')` decorator
  - Use `@Res()` to access response object for streaming
- [x] 5.2 Validate export date range (call `validateExportRange()`)
- [x] 5.3 Generate filename based on filters
- [x] 5.4 Set response headers:
  - `Content-Type: text/csv; charset=utf-8`
  - `Content-Disposition: attachment; filename="{generated-filename}"`
- [x] 5.5 Stream CSV to response using `auditExportService.createCsvStream()`
- [x] 5.6 Test export endpoint:
  - With Admin user (should succeed)
  - With ReadOnly user (should return 403)
  - With date range exceeding limit (should return 400)
  - With valid filters (should download CSV)

## 6. Backend - RBAC Permission Update
- [x] 6.1 Update `AdminFullAccess` policy to ensure `audit:Export` permission included
  - Policy already grants `*` actions, so no code change needed
  - Verify in `RbacService.initializeDefaultRolesAndPolicies()`
- [x] 6.2 Test permission check: Admin can export, ReadOnly cannot
- [x] 6.3 Document new `audit:Export` permission in policy documentation

## 7. Frontend - Date Range Filter Component
- [x] 7.1 Create `apps/web/src/components/DateRangePicker.tsx` component (or use library like `react-day-picker`)
  - Accept `startDate`, `endDate`, `onStartDateChange`, `onEndDateChange` props
  - Render two date input fields (or calendar picker)
  - Format dates as YYYY-MM-DD
  - Validate end date >= start date
- [x] 7.2 Style component to match existing UI (Tailwind CSS)
- [x] 7.3 Test component in isolation (valid/invalid ranges)

## 8. Frontend - User Filter Component
- [x] 8.1 Create user selector dropdown component or use existing patterns
  - Fetch user list from `/users` API
  - Display user name + email in dropdown
  - Support "All Users" option (no filter)
- [x] 8.2 Integrate into audit page
- [x] 8.3 Test user selection triggers API call with `userId` parameter

## 9. Frontend - Audit Page Enhancements
- [x] 9.1 Update `apps/web/src/app/(dashboard)/audit/page.tsx`:
  - Add state for `startDate`, `endDate`, `userId` filters
  - Add `DateRangePicker` component above table
  - Add user filter dropdown above table
  - Add "Clear Filters" button to reset all filters
- [x] 9.2 Update `useQuery` to include filter parameters in API call:
  - `queryKey: ['auditLog', { startDate, endDate, userId }]`
  - `queryFn: () => apiClient.get('/audit', { params: { startDate, endDate, userId } })`
- [x] 9.3 Test filtering:
  - Select date range → verify table updates
  - Select user → verify table updates
  - Combine filters → verify correct results
  - Clear filters → verify shows all recent events

## 10. Frontend - Export Button
- [x] 10.1 Add "Export CSV" button to audit page header
  - Position: top-right above table
  - Style: Primary button (blue/green per design system)
  - Icon: Download icon
- [x] 10.2 Implement export click handler:
  - Build export URL with current filters: `/audit/export?startDate=...&endDate=...&userId=...`
  - Trigger download using `window.location.href` or `fetch` + blob download
  - Show loading state during export ("Exporting...")
  - Handle errors (403, 400) with user-friendly messages
- [x] 10.3 Hide export button for users without Admin role
  - Check user's role from auth context/state
  - Conditionally render button: `{isAdmin && <ExportButton />}`
- [x] 10.4 Test export:
  - Admin user sees button and can export
  - ReadOnly user does not see button
  - Export with filters generates correct filename
  - Large export shows loading state

## 11. Frontend - Error Handling
- [x] 11.1 Display error message if export fails (403, 400, 500)
- [x] 11.2 Display message if export exceeds time range limit: "Export range cannot exceed 3 months. Please adjust your date filters."
- [x] 11.3 Display message if no events match filters: "No audit events found for the selected filters."

## 12. Testing & Validation
- [ ] 12.1 Write integration test for automatic logging:
  - Make authenticated request to `/users`
  - Verify audit event created in database
  - Verify event contains correct `actorId`, `action`, `ipAddress`
- [ ] 12.2 Write integration test for filtering:
  - Create 20 audit events with different dates and users
  - Query with date range filter
  - Verify only events in range returned
- [ ] 12.3 Write integration test for export:
  - Create 100 audit events
  - Call export endpoint
  - Parse CSV response
  - Verify all events present with correct columns
- [ ] 12.4 Write unit test for CSV escaping logic
- [ ] 12.5 Manual test: Export 10,000+ events and verify performance (download starts <1 sec)

## 13. Documentation
- [ ] 13.1 Update API documentation with new query parameters and export endpoint
- [ ] 13.2 Document `MAX_AUDIT_EXPORT_MONTHS` configuration variable
- [ ] 13.3 Add audit logging feature to admin user guide
- [ ] 13.4 Document route exclusion list for audit interceptor

## Dependencies & Parallelization Notes
- Tasks 2.x (interceptor) can start immediately
- Tasks 3.x (filtering) can start immediately (independent of interceptor)
- Tasks 4.x and 5.x (export) depend on 3.3 (enhanced searchEvents method)
- Tasks 7.x-10.x (frontend) can start in parallel with backend tasks
- Task 11.x (frontend errors) depends on 10.x (export button)
- Task 12.x (testing) should be done after implementation complete

## Estimated Effort
- Backend: ~8-10 hours
- Frontend: ~4-6 hours
- Testing: ~3-4 hours
- **Total: ~15-20 hours**
