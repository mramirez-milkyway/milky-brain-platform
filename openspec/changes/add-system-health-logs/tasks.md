## 1. Database Layer
- [x] 1.1 Add `SystemLog` model to Prisma schema with fields: id, context, errorMessage, stackTrace, metadata (Json), createdAt
- [x] 1.2 Run `npx prisma migrate dev --name=add_system_logs` to generate migration
- [x] 1.3 Add `systemHealth:Read` permission to seed data
- [x] 1.4 Assign `systemHealth:Read` permission to Admin role in seed

## 2. API - Global Exception Filter
- [x] 2.1 Create `apps/api/src/common/filters/all-exceptions.filter.ts` implementing ExceptionFilter
- [x] 2.2 Inject PrismaService to write SystemLog records
- [x] 2.3 Detect 5xx vs 4xx status codes and only log 5xx errors
- [x] 2.4 Capture request path, method, user ID in metadata
- [x] 2.5 Register filter globally in `apps/api/src/main.ts`
- [x] 2.6 Write unit tests for the exception filter

## 3. API - System Health Module
- [x] 3.1 Create `apps/api/src/system-health/system-health.module.ts`
- [x] 3.2 Create `apps/api/src/system-health/system-health.repository.ts` with Prisma queries
- [x] 3.3 Create `apps/api/src/system-health/system-health.service.ts` with business logic
- [x] 3.4 Create `apps/api/src/system-health/system-health.controller.ts` with endpoints
- [x] 3.5 Create DTOs: `SystemLogResponseDto`, `SystemLogListQueryDto`
- [x] 3.6 Implement `GET /api/system-health/logs` with pagination (page, pageSize) and filters (context, startDate, endDate)
- [x] 3.7 Implement `GET /api/system-health/logs/:id` for single log detail
- [x] 3.8 Add `systemHealth:Read` permission check using RbacService
- [x] 3.9 Import SystemHealthModule in AppModule
- [x] 3.10 Write unit tests for service and controller

## 4. Lambda - Error Wrapper
- [x] 4.1 Modify `lambdas/job-processor/src/index.ts` to wrap handler in try/catch
- [x] 4.2 Create utility function to write SystemLog via Prisma
- [x] 4.3 Capture Lambda function name, job context in metadata
- [x] 4.4 Re-throw exception after logging for AWS error handling
- [x] 4.5 Write unit tests for error wrapper

## 5. Frontend - System Health Panel
- [x] 5.1 Create `apps/web-admin/src/app/(admin)/system-health/page.tsx` with PermissionGuard
- [x] 5.2 Create `apps/web-admin/src/components/system-health/SystemLogTable.tsx` with columns: Context, Error Summary, Timestamp
- [x] 5.3 Add TanStack Query hook for fetching logs with pagination
- [x] 5.4 Implement row click navigation to detail view
- [x] 5.5 Create `apps/web-admin/src/app/(admin)/system-health/[logId]/page.tsx` for detail view
- [x] 5.6 Create `apps/web-admin/src/components/system-health/SystemLogDetail.tsx` with monospace stack trace display
- [x] 5.7 Display metadata as formatted JSON
- [x] 5.8 Add back button to return to list
- [x] 5.9 Add filtering controls (context dropdown, date range picker)

## 6. Frontend - Navigation
- [x] 6.1 Add System Health nav item to `apps/web-admin/src/layout/AppSidebar.tsx`
- [x] 6.2 Configure permission check for `systemHealth:Read`
- [x] 6.3 Add appropriate icon (e.g., AlertTriangle or Activity)

## 7. Testing & Validation
- [x] 7.1 Verify exception filter logs 5xx errors correctly
- [x] 7.2 Verify exception filter does NOT log 4xx errors
- [x] 7.3 Verify Lambda wrapper captures unhandled exceptions
- [x] 7.4 Verify UI displays logs correctly with pagination
- [x] 7.5 Verify permission restrictions work correctly
