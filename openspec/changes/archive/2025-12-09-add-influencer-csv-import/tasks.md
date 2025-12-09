# Implementation Tasks

## 1. Lambda Handler
- [x] 1.1 Install CSV parsing library: `cd lambdas/job-processor && npm install papaparse`
- [x] 1.2 Create `lambdas/job-processor/src/handlers/influencer-import-handler.ts` with IJobHandler implementation
- [x] 1.3 Implement CSV parsing with papaparse
- [x] 1.4 Implement column mapping logic (map CSV columns to DB fields based on payload.columnMapping)
- [x] 1.5 Implement duplicate detection by name + platform (case-insensitive query)
- [x] 1.6 Implement skip vs update logic based on payload.duplicateHandling
- [~] 1.7 Implemented for Influencer table (creator/creator_social not used per design decision)
- [x] 1.8 Implement row-level validation (required fields per schema)
- [x] 1.9 Implement error logging with rowNumber for failed rows
- [x] 1.10 Implement success/failure summary in job result
- [x] 1.11 Register handler in `handler-registry.ts`: `this.register('influencer_import', new InfluencerImportHandler())`
- [x] 1.12 Rebuild and deploy Lambda

## 2. Backend API
- [x] 2.1 Update `apps/api/src/jobs/jobs.controller.ts` to validate `influencer:Import` permission for jobType="influencer_import"
- [x] 2.2 Add file type validation (accept only .csv, .txt)
- [x] 2.3 Add file size validation (10MB max) with HTTP 413 response
- [x] 2.4 Document job payload schema for influencer_import in DTOs

## 3. RBAC Permissions
- [x] 3.1 Add `influencer:Import` permission to database seed/migration
- [x] 3.2 Assign `influencer:Import` to Admin role
- [x] 3.3 Assign `influencer:Import` to Editor role
- [ ] 3.4 Update frontend permission checks to use `influencer:Import`

## 4. Frontend: Import Center UI
- [ ] 4.1 Install react-spreadsheet-import: `cd apps/web-admin && npm install react-spreadsheet-import`
- [ ] 4.2 Create route: `apps/web-admin/src/app/(admin)/import-center/page.tsx`
- [ ] 4.3 Create `apps/web-admin/src/components/import/CsvUpload.tsx` (file upload component)
- [ ] 4.4 Integrate react-spreadsheet-import for column mapping interface
- [ ] 4.5 Configure auto-matching logic (match CSV headers to DB fields)
- [ ] 4.6 Add duplicate handling selector (radio buttons: Skip / Update)
- [ ] 4.7 Implement job creation API call: `POST /api/jobs` with file upload
- [ ] 4.8 Handle success response (show job ID, redirect to history)

## 5. Frontend: Job History Panel
- [ ] 5.1 Create `apps/web-admin/src/components/import/JobHistoryPanel.tsx`
- [ ] 5.2 Fetch jobs via TanStack Query: `GET /api/jobs?jobType=influencer_import`
- [ ] 5.3 Display job list with columns: ID, Status, File Name, Created At, Completed At
- [ ] 5.4 Implement status badges (Created, In Progress, Completed, Error) with color coding
- [ ] 5.5 Add polling mechanism for in-progress jobs (refetch every 5 seconds)
- [ ] 5.6 Implement row click to navigate to job detail view

## 6. Frontend: Job Detail & Log View
- [ ] 6.1 Create `apps/web-admin/src/app/(admin)/import-center/[jobId]/page.tsx`
- [ ] 6.2 Fetch job details: `GET /api/jobs/:id`
- [ ] 6.3 Fetch job logs: `GET /api/jobs/:id/logs`
- [ ] 6.4 Display job summary: Total Records, Success Count, Error Count (from job.result)
- [ ] 6.5 Display detailed log table with columns: Timestamp, Level, Message, Row Number
- [ ] 6.6 Filter logs by level (INFO, WARNING, ERROR)
- [ ] 6.7 Highlight errors in red, warnings in yellow
- [ ] 6.8 Add "Export Logs" button to download logs as CSV

## 7. Frontend: Navigation & Permissions
- [ ] 7.1 Add "Import Center" link to sidebar navigation
- [ ] 7.2 Protect route with PermissionGuard: `requiredPermission="influencer:Import"`
- [ ] 7.3 Hide navigation link if user lacks `influencer:Import` permission

## 8. Testing
- [ ] 8.1 Create test CSV files (valid, invalid, duplicates, large file >10MB, 10k+ rows)
- [ ] 8.2 Test Lambda handler with mock data (unit tests)
- [ ] 8.3 Test duplicate detection (skip mode)
- [ ] 8.4 Test duplicate detection (update mode)
- [ ] 8.5 Test data spreading across tables (creator + creator_social)
- [ ] 8.6 Test handling of same creator with multiple social media accounts
- [ ] 8.7 Test required field validation (missing non-nullable fields)
- [ ] 8.8 Test CSV with malformed data (invalid dates, numbers, etc.)
- [ ] 8.9 Test file size limit (10MB)
- [ ] 8.10 Test row limit warning (10k rows)
- [ ] 8.11 Test permission enforcement (influencer:Import)
- [ ] 8.12 Test frontend UI: upload, mapping, history, detail views
- [ ] 8.13 Test polling mechanism for in-progress jobs

## 9. Documentation
- [ ] 9.1 Create CSV template with all supported columns
- [ ] 9.2 Document column mapping (CSV header → DB field mapping)
- [ ] 9.3 Document required vs optional fields
- [ ] 9.4 Document duplicate handling behavior (skip vs update)
- [ ] 9.5 Document error messages and troubleshooting guide
- [ ] 9.6 Update user guide with import workflow instructions

## 10. Validation
- [ ] 10.1 Import 100 valid records successfully
- [ ] 10.2 Import CSV with duplicates (skip mode) - verify skipped count
- [ ] 10.3 Import CSV with duplicates (update mode) - verify updated records
- [ ] 10.4 Import CSV with errors - verify row-level error logging
- [ ] 10.5 Import CSV with same creator + different social media - verify multiple creator_social entries
- [ ] 10.6 Verify data in database tables after import (creator, creator_social, customer)
- [ ] 10.7 Verify job history shows correct status
- [ ] 10.8 Verify job detail shows success/error counts
- [ ] 10.9 Verify logs show detailed row-level errors
- [ ] 10.10 Verify permission enforcement (non-authorized user cannot access)
- [ ] 10.11 Verify audit log captures import operations
