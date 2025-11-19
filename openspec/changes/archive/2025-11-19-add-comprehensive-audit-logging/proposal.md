# Change: Comprehensive Audit Logging System

## Why

The current audit logging system requires manual instrumentation of each action and lacks essential features for security monitoring, compliance, and troubleshooting. Admins need:

- **Automatic capture** of all API activity without manual logging calls
- **Filtering capabilities** to search logs by date range and specific users
- **Export functionality** to generate compliance reports and support security audits
- **Access controls** to ensure only authorized admins can export sensitive audit data

These capabilities are critical for meeting compliance requirements (SOC 2, GDPR, HIPAA), investigating security incidents, and troubleshooting user-reported issues.

## What Changes

### Backend Enhancements
- **Automatic Request Logging**: Implement NestJS interceptor to capture all API requests with user, action, IP address, and user agent
- **Enhanced Filtering**: Add date range and user filters to audit search endpoint
- **CSV Export Endpoint**: Create new `/audit/export` endpoint with streaming response for large datasets
- **Export Constraints**: Enforce configurable maximum export window (default: 3 months) via environment configuration
- **Permission-Based Access**: Add `audit:Export` permission check for export functionality

### Frontend Enhancements
- **Date Range Filter**: Add date picker component for filtering audit events by time period
- **User Filter**: Add user selection dropdown to filter events by specific user
- **Export Button**: Add CSV export button visible only to users with Admin role
- **Combined Filters**: Support simultaneous date range and user filtering

### Configuration
- Add `MAX_AUDIT_EXPORT_MONTHS` environment variable (default: 3)

## Impact

### Affected Specifications
- **Modified**: `specs/audit/spec.md` - Enhanced with automatic logging and filtering requirements
- **Added**: `specs/audit-export/spec.md` - New capability for CSV export functionality

### Affected Code Areas

**Backend** (`apps/api/src/`):
- `common/interceptors/` - New audit interceptor for automatic logging
- `common/services/audit.service.ts` - Enhanced search with date/user filters
- `audit/audit.controller.ts` - New export endpoint, enhanced query parameters
- `audit/audit-export.service.ts` - New service for CSV generation
- `app.module.ts` - Global interceptor registration
- `.env.example` - Add MAX_AUDIT_EXPORT_MONTHS

**Frontend** (`apps/web/src/`):
- `app/(dashboard)/audit/page.tsx` - Add filters and export button
- `components/` - New date range picker component

**Database**:
- No schema changes required (uses existing `AuditEvent` model)

### Breaking Changes
None - This is purely additive functionality.

### Dependencies
- Existing: `@nestjs/common`, `@prisma/client`, `class-validator`
- No new dependencies required

### Migration Path
1. Deploy backend changes (interceptor registers automatically)
2. Deploy frontend changes (new filters appear for all admins)
3. Existing audit logs remain accessible and queryable
4. No data migration required
