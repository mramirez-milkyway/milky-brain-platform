# Change: Add Client CSV Import

## Why
Admins need to bulk import Clients via CSV to efficiently populate the database without manual entry. The existing Import Center already supports Influencer imports; extending it to support Clients allows reuse of the same infrastructure (Lambda, SQS, S3) and UI patterns.

## What Changes
- Add new `client_import` job type to the Import Center
- Extend the `CsvUpload` component to support Client field mappings
- Add new `ClientImportHandler` in the Lambda job processor
- Add `client:Import` permission for access control
- Reuse existing Job, JobLog, S3, and SQS infrastructure (no new infrastructure)
- Uses existing `Customer` model (`customers` table) - no schema changes or migrations needed

## Impact
- Affected specs: Creates new `client-import` capability (mirrors `influencer-import` structure)
- Affected code:
  - `apps/web-admin/src/components/import/CsvUpload.tsx` - Add client field mappings
  - `apps/web-admin/src/app/(admin)/import-center/page.tsx` - Add client import option
  - `lambdas/job-processor/src/handlers/` - Add `client-import-handler.ts`
  - `lambdas/job-processor/src/handlers/handler-registry.ts` - Register new handler
  - `apps/api/src/jobs/jobs.controller.ts` - Add permission check for `client:Import`
  - Database seed/migration for `client:Import` permission
