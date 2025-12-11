# Change: Add System Health & Error Logs

## Why
Technical admins need visibility into system failures without accessing server logs directly. Currently, unhandled exceptions in the API and Lambda layers are only visible in CloudWatch logs, making troubleshooting difficult for maintainers. This feature centralizes critical error logging in the database with a dedicated UI panel for quick diagnosis.

## What Changes
- Add new `SystemLog` database entity to capture unhandled exceptions
- Implement global exception filter in NestJS API to log 5xx errors
- Add error wrapper in Lambda job processor to capture unhandled exceptions
- Create System Health UI panel for admins to view error logs
- Add `systemHealth:Read` permission for access control

## Impact
- Affected specs: Creates new `system-health` capability
- Affected code:
  - `apps/api/prisma/schema.prisma` - Add SystemLog model
  - `apps/api/src/common/filters/all-exceptions.filter.ts` - Global exception filter
  - `apps/api/src/system-health/` - New module with controller, service, repository
  - `apps/api/src/main.ts` - Register global filter
  - `apps/api/src/app.module.ts` - Import SystemHealthModule
  - `lambdas/job-processor/src/index.ts` - Add error wrapper
  - `apps/web-admin/src/app/(admin)/system-health/` - New UI pages
  - `apps/web-admin/src/layout/AppSidebar.tsx` - Add navigation item
  - Database seed for `systemHealth:Read` permission
