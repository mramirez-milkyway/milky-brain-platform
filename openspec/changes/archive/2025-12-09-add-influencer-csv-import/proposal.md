# Change: Add Influencer CSV Import

## Why

The platform requires bulk import capability for influencers (creators) to efficiently populate the database without manual entry. Currently, adding influencers one-by-one via UI is time-consuming and not scalable for initial data loading or bulk updates from external sources.

## What Changes

- Add **CSV bulk import functionality for influencers/creators** leveraging the async job processing infrastructure
- Create Lambda handler for CSV parsing, validation, and database insertion
- Implement frontend UI for CSV upload with column mapping interface (using `react-spreadsheet-import` library)
- Add job history panel to track import status and view detailed logs
- Implement duplicate detection by `handle` field (configurable for future composite keys)
- Support user choice for duplicate handling: skip or update existing records
- Spread CSV data across multiple database tables: `creator`, `creator_social`, `customer`, `campaign`, `post`, `campaign_creator`
- Handle scenarios where same creator appears multiple times for different social media accounts
- Add `influencer:Import` permission for access control
- Enforce file size limit (10MB) and row limit (10,000 rows) with warnings (not rejection)

**User Flow:**
1. User uploads CSV file via frontend
2. Column mapping interface appears, auto-matching headers to DB fields
3. User confirms/adjusts mapping and selects duplicate handling (skip/update)
4. System creates job, uploads file to S3, returns job ID
5. Lambda processes CSV asynchronously, validating and inserting records
6. User views job history panel to see status (Created, In Progress, Completed, Error)
7. User clicks job to see detailed log with success count and row-level errors

**This change depends on:** `add-async-job-processing` (must be implemented first)

## Impact

**Affected specs:**
- NEW: `influencer-import` (this change creates the capability)
- MODIFIED: `async-job-processing` (adds InfluencerImportHandler to handler registry)

**Affected code:**
- Lambda: `lambdas/job-processor/src/handlers/influencer-import-handler.ts` (new handler)
- Lambda: `lambdas/job-processor/src/handlers/handler-registry.ts` (register new handler)
- Backend: `apps/api/src/jobs/jobs.controller.ts` (validate influencer:Import permission)
- Frontend: `apps/web-admin/src/app/(admin)/import-center/` (new import UI)
- Frontend: `apps/web-admin/src/components/import/` (CSV upload, column mapping, job history components)
- Database: No schema changes required (uses existing creator, creator_social, customer tables)
- RBAC: Add `influencer:Import` permission to Admin and Editor roles

**Breaking changes:** None (this is a new capability)

**Dependencies:**
- `react-spreadsheet-import` (frontend library for column mapping)
- `csv-parser` or `papaparse` (Lambda CSV parsing)
- Existing async job processing infrastructure

**Security considerations:**
- File upload size limit (10MB) enforced at API layer
- CSV content validation (prevent code injection, XSS)
- Permission check: `influencer:Import` required
- Jobs are user-scoped (users see only their own imports, admins see all)
- Audit trail: All import operations logged to audit table

**Data integrity:**
- Required fields validation per database schema (non-nullable fields)
- Duplicate detection by `handle` field (case-insensitive)
- Row-level error logging (continue processing on individual row failures)
- Transaction support for atomicity where applicable
- No data loss: Failed imports can be retried with corrected data
