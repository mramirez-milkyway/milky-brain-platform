# Design: Comprehensive Audit Logging System

## Context

The Milky Way Admin Panel currently has basic audit logging infrastructure:
- Tamper-evident hash chain for immutability (SHA-256 linked hashes)
- Manual logging via `AuditService.log()` method
- Simple read-only UI showing recent events

This change extends the system to automatically capture all API activity and provide advanced filtering and export capabilities for compliance and security monitoring.

**Constraints:**
- Must maintain tamper-evident hash chain integrity
- Must not impact API response times significantly (<50ms overhead)
- Export functionality must handle large datasets (100k+ events)
- Must integrate seamlessly with existing RBAC permission system

**Stakeholders:**
- Admins: Need comprehensive activity visibility for security and compliance
- Compliance team: Require exportable audit trails
- Engineering: Need minimal maintenance overhead

## Goals / Non-Goals

**Goals:**
- ✅ Automatically log all API requests without manual instrumentation
- ✅ Enable filtering by date range and user for targeted investigations
- ✅ Provide CSV export for compliance reporting and external analysis
- ✅ Enforce export limits to prevent system overload (max 3 months configurable)
- ✅ Maintain existing immutability guarantees

**Non-Goals:**
- ❌ Real-time alerting or anomaly detection
- ❌ Log retention policy management or automatic archival
- ❌ Configurable export formats beyond CSV
- ❌ Low-level database query logging (application events only)
- ❌ Audit log UI configuration interface

## Decisions

### 1. Automatic Logging Strategy: NestJS Interceptor

**Decision:** Use NestJS `ExecutionContext` interceptor bound globally to capture all HTTP requests.

**Rationale:**
- Intercepts all controller methods automatically
- Access to request/response objects and user context
- Clean separation from business logic
- NestJS idiomatic pattern

**Alternative Considered:** Middleware
- ❌ Runs before guards, so user context not available
- ❌ Harder to exclude specific routes

**Implementation:**
```typescript
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // From JwtAuthGuard
    
    return next.handle().pipe(
      tap(() => {
        // Log successful requests
        this.auditService.log({...});
      }),
      catchError((error) => {
        // Log failed requests
        this.auditService.log({...});
        throw error;
      })
    );
  }
}
```

### 2. Data Model: Extend Existing AuditEvent

**Decision:** Use existing `AuditEvent` model with current schema.

**Rationale:**
- Schema already captures required fields: actorId, action, entityType, ipAddress, userAgent, timestamps
- Hash chain depends on sequential inserts
- Avoids data fragmentation

**Fields Mapping:**
- **Who**: `actorId` (from JWT token)
- **What**: `action` (HTTP method + route, e.g., "POST /users")
- **When**: `createdAt` (automatic timestamp)
- **From Where**: `ipAddress` (from `X-Forwarded-For` or `request.ip`)
- **What Changed**: `beforeState` / `afterState` (request body for POST/PUT/PATCH)

**Alternative Considered:** Separate `ApiRequestLog` table
- ❌ Breaks hash chain continuity
- ❌ Adds complexity to search/export

### 3. Filtering Implementation: Query Parameters + Prisma

**Decision:** Add query parameters to existing `/audit` endpoint with Prisma `where` clauses.

**API Design:**
```
GET /audit?startDate=2025-11-01&endDate=2025-11-17&userId=5&limit=100
```

**Prisma Query:**
```typescript
this.prisma.auditEvent.findMany({
  where: {
    actorId: userId,
    createdAt: {
      gte: new Date(startDate),
      lte: new Date(endDate),
    },
  },
  orderBy: { createdAt: 'desc' },
  take: limit,
});
```

**Rationale:**
- Simple, stateless filtering
- Leverages database indexes (already exist on `actorId`, `createdAt`)
- Frontend can build query strings easily

### 4. CSV Export: Streaming Response

**Decision:** Stream CSV using Node.js streams, not in-memory buffering.

**Rationale:**
- Handles large datasets (100k+ rows) without memory issues
- Provides immediate download start (better UX)
- NestJS supports `StreamableFile` for efficient transfer

**Implementation Pattern:**
```typescript
@Get('export')
async exportCsv(@Query() filters, @Res() response) {
  const stream = this.auditExportService.createCsvStream(filters);
  
  response.set({
    'Content-Type': 'text/csv',
    'Content-Disposition': 'attachment; filename="audit-log.csv"',
  });
  
  stream.pipe(response);
}
```

**Alternative Considered:** Background job + download link
- ❌ Adds complexity (job queue, storage)
- ❌ Worse UX for small/medium exports
- ✅ Consider for future if exports routinely exceed 1M rows

### 5. Export Limits: Environment-Based Configuration

**Decision:** Use `MAX_AUDIT_EXPORT_MONTHS` env variable validated at request time.

**Rationale:**
- Prevents accidental large exports that could impact database
- Configurable per environment (3 months prod, unlimited dev)
- Simple validation logic

**Validation:**
```typescript
const maxMonths = parseInt(process.env.MAX_AUDIT_EXPORT_MONTHS || '3');
const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);

if (daysDiff > maxMonths * 30) {
  throw new BadRequestException(`Export range cannot exceed ${maxMonths} months`);
}
```

### 6. Permission Model: New `audit:Export` Permission

**Decision:** Create separate `audit:Export` permission, grant to `AdminFullAccess` policy.

**Rationale:**
- Separates read vs export permissions (defense in depth)
- Allows future granular control (e.g., read-only auditor role)
- Follows existing RBAC pattern

**Migration:**
```typescript
// In RBAC initialization
const adminPolicy = await prisma.policy.findUnique({ 
  where: { name: 'AdminFullAccess' } 
});

await prisma.policy.update({
  where: { id: adminPolicy.id },
  data: {
    statements: [
      { Effect: 'Allow', Actions: ['*'], Resources: ['*'] }
    ]
  }
});
```

## Risks / Trade-offs

### Risk: Interceptor Performance Impact
- **Mitigation**: Async logging (fire-and-forget), no blocking I/O in hot path
- **Monitoring**: Add metrics for audit log insertion time

### Risk: Database Growth
- **Trade-off**: Comprehensive logging vs storage costs
- **Mitigation**: 
  - Document retention policy (recommend 1-year retention)
  - PostgreSQL partitioning on `createdAt` (future optimization)
  - Current hash chain prevents simple deletion; consider append-only archival

### Risk: Export Abuse
- **Mitigation**: 
  - 3-month limit enforced by default
  - `audit:Export` permission required
  - Rate limiting on export endpoint (future: add throttling)

### Trade-off: Automatic Logging Noise
- **Concern**: Health checks, metrics endpoints logged unnecessarily
- **Mitigation**: Add route exclusion list in interceptor (e.g., `/health`, `/metrics`)

## Migration Plan

### Phase 1: Backend Deployment
1. Add `MAX_AUDIT_EXPORT_MONTHS=3` to `.env` files
2. Deploy audit interceptor (registers globally)
3. Deploy enhanced audit service with filters
4. Deploy export endpoint
5. Verify automatic logging in staging (check 100 requests logged)

### Phase 2: Frontend Deployment
1. Deploy updated audit page with filters
2. Deploy export button (Admin-only)
3. Test end-to-end flow

### Rollback Plan
- Disable interceptor by removing from `app.module.ts` providers
- Frontend gracefully handles missing filters (existing API still works)
- No database changes to roll back

## Open Questions

1. **Should we log GET requests?** 
   - Pro: Complete audit trail
   - Con: High volume (90% of requests)
   - **Recommendation**: Yes, but add route exclusion for `/health`, `/metrics`

2. **What about request/response body size limits?**
   - **Recommendation**: Truncate `beforeState`/`afterState` to 10KB to prevent bloat

3. **Should export include sensitive fields like `beforeState`?**
   - **Recommendation**: Include by default (admins need full context), but consider redaction for future enhancement
