## 1. Backend: Permission & Job Type Setup

- [ ] 1.1 Add `client:Import` permission to the Policy seed data
- [ ] 1.2 Assign `client:Import` permission to Admin and Editor roles in seed
- [ ] 1.3 Update `jobs.controller.ts` to check `client:Import` permission for `client_import` job type
- [ ] 1.4 Run seed to add new permission (no schema migration needed - uses existing Customer model)

## 2. Lambda: Client Import Handler

- [ ] 2.1 Create `client-import-handler.ts` in `lambdas/job-processor/src/handlers/`
- [ ] 2.2 Implement CSV parsing with PapaParse (reuse pattern from creator-import-handler)
- [ ] 2.3 Implement field mapping for Customer model fields (name, industry, country, contact_name, contact_email, contact_phone, notes)
- [ ] 2.4 Implement duplicate detection by `name` field (case-insensitive)
- [ ] 2.5 Implement skip/update duplicate handling modes
- [ ] 2.6 Implement row-level validation (required fields, email format)
- [ ] 2.7 Implement batch inserts using Prisma's `createMany()`
- [ ] 2.8 Implement result summary (totalRows, successCount, errorCount, duplicateCount, createdClients, updatedClients)
- [ ] 2.9 Register handler in `handler-registry.ts` for `client_import` job type

## 3. Frontend: Import Center Extension

- [ ] 3.1 Add `client_import` to import type enum/constants
- [ ] 3.2 Extend `CsvUpload.tsx` to support Client field mappings
  - [ ] 3.2.1 Define client field definitions (name*, industry, country, contact_name, contact_email, contact_phone, notes)
  - [ ] 3.2.2 Add auto-match mappings for common Client CSV headers
  - [ ] 3.2.3 Add required field validation for `name`
- [ ] 3.3 Add import type selector to Import Center page (Influencer Import / Client Import)
- [ ] 3.4 Update JobHistoryPanel to show job type column and filter by job type
- [ ] 3.5 Add `client:Import` permission check to conditionally show Client Import option
- [ ] 3.6 Create client import CSV template file for download

## 4. Testing

- [ ] 4.1 Write unit tests for `ClientImportHandler` (success, validation errors, duplicates, batch processing)
- [ ] 4.2 Write unit tests for frontend Client field mapping logic
- [ ] 4.3 Write unit tests for permission checks on client_import job type

## 5. Validation & Documentation

- [ ] 5.1 Test end-to-end flow: upload CSV -> mapping -> job creation -> processing -> results
- [ ] 5.2 Verify audit events are created for client import jobs
- [ ] 5.3 Verify job logs are correctly recorded with row-level errors
