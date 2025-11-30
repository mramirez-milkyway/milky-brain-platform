# Design: Integrations Usage Panel

## Context
The admin panel needs to display quota and usage information for external integrations, starting with IMAI. This is a read-only monitoring feature that helps admins track consumption and avoid service disruptions when quotas are exhausted.

**Constraints:**
- IMAI API base URL already configured in environment (`IMAI_API_BASE_URL`)
- IMAI authentication requires API key
- Must follow existing NestJS/NextJS architecture patterns
- Must use existing permission system for access control

## Goals / Non-Goals

**Goals:**
- Display IMAI quota information (total credits, remaining credits)
- Provide clear visual indication of quota consumption (progress bars)
- Design for extensibility to support multiple providers
- Follow existing codebase patterns and conventions
- Admin-only access via permission system

**Non-Goals:**
- Historical usage data or charts over time
- Alerts/notifications for low quota
- Ability to modify or purchase quotas from the panel
- Real-time updates (polling acceptable, WebSocket not required)
- Support for providers other than IMAI in initial release

## Decisions

### Decision: Environment Variables for API Credentials
**Choice:** Store IMAI API key in environment variables (`IMAI_API_KEY`)

**Rationale:**
- Simple implementation with no database schema changes
- Follows existing pattern (IMAI_API_BASE_URL already in env)
- API credentials are deployment-level configuration, not runtime data
- Single IMAI account per deployment (no multi-tenant requirement)

**Alternatives Considered:**
- Database storage in `Integration` table: More complex, better for multi-tenant or dynamic credential management, but overkill for current needs

### Decision: Backend API Structure
**Choice:** Create dedicated `/integrations/usage` endpoint returning array of provider data

**Response Format:**
```typescript
{
  "integrations": [
    {
      "provider": "IMAI",
      "totalQuota": 10000,
      "remainingQuota": 7500,
      "usedQuota": 2500,
      "usagePercentage": 25,
      "status": "active"
    }
  ]
}
```

**Rationale:**
- Array structure supports multiple providers in future
- Backend calculates `usedQuota` and `usagePercentage` to keep frontend simple
- Consistent with existing API patterns in codebase
- Status field allows for error states (e.g., "error", "unavailable")

**Implementation:**
- `IntegrationsService.getImaiUsage()` - calls IMAI API, transforms response
- `IntegrationsService.getAllIntegrationsUsage()` - aggregates all providers
- Controller protected with `@RequirePermission('integration:Read')`

### Decision: Frontend Architecture
**Choice:** Standard Next.js App Router page with TanStack Query

**File Structure:**
```
apps/web-admin/src/app/integrations/
├── layout.tsx          # Page layout with sidebar
├── page.tsx            # Main integrations list
└── components/
    └── IntegrationCard.tsx  # Reusable card for each provider
```

**Rationale:**
- Follows existing pattern from `/users`, `/settings`, etc.
- TanStack Query provides caching and error handling
- PermissionGuard enforces access control
- Reusable card component enables easy addition of new providers

### Decision: UI Design Pattern
**Choice:** Card-based layout with progress bars (similar to Export Controls quota display)

**Components:**
- Use existing `ProgressBar` component from `/components/progress-bar/`
- Card layout with TailwindCSS (no inline styles)
- Each provider gets its own card showing:
  - Provider name and logo/icon
  - Total quota and remaining quota as numbers
  - Progress bar showing consumption percentage
  - Status indicator (success/warning/error colors)

**Visual Hierarchy:**
```
┌─────────────────────────────────────┐
│ Integrations                        │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🔌 IMAI                         │ │
│ │                                 │ │
│ │ Used: 2,500 / 10,000 credits   │ │
│ │ ████████░░░░░░░░░░░░ 25%       │ │
│ │                                 │ │
│ │ Remaining: 7,500 credits       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Rationale:**
- Progress bars provide immediate visual understanding
- Card-based layout is familiar pattern in the codebase
- Scalable to multiple providers (vertical stack of cards)
- Matches design decision from user story

### Decision: Permission Model
**Choice:** Use `integration:Read` permission for access control

**Rationale:**
- Follows existing permission naming convention (resource:action)
- Read-only permission appropriate for monitoring dashboard
- Future `integration:Write` can be added for configuration features
- Admin role gets wildcard `*` permission (already has access)

**Implementation:**
- Add to permission seeder for admin role
- Frontend: `<PermissionGuard permission="integration:Read">`
- Backend: `@RequirePermission('integration:Read')`
- Sidebar: `{ permission: 'integration:Read', ... }`

### Decision: Error Handling Strategy
**Choice:** Graceful degradation with retry capability

**Backend:**
- Catch IMAI API errors, return status: "error" with error message
- Don't expose sensitive error details to frontend
- Log errors server-side for debugging
- Return 200 with error status (not 500) to allow partial success

**Frontend:**
- Display provider card even if API fails (show error state)
- Provide "Retry" button to re-fetch data
- TanStack Query handles retry logic automatically
- Show user-friendly messages ("Unable to fetch quota. Please try again.")

**Rationale:**
- Better UX than complete page failure
- Allows other providers to succeed even if one fails
- Provides actionable feedback to users
- Follows existing error handling patterns in codebase

## Risks / Trade-offs

### Risk: IMAI API Rate Limiting
**Mitigation:** 
- TanStack Query caches responses (default 5 minutes)
- Manual refresh button instead of auto-polling
- Consider adding stale time configuration if needed

### Risk: API Key Security
**Mitigation:**
- API key stored in environment variables (never exposed to frontend)
- Backend-only API calls
- HTTPS for all communications
- Follow existing secret management patterns

### Trade-off: Static vs Dynamic Provider Configuration
**Decision:** Hardcode IMAI provider initially, design for extensibility

**Rationale:**
- Simpler initial implementation
- User story only requires IMAI support
- Architecture supports adding providers without refactoring
- Future: Can add provider registry or database-driven config

## Migration Plan

### Phase 1: Backend Setup
1. Add environment variables to `.env.example`
2. Create `IntegrationsModule`, service, controller
3. Test IMAI API integration manually

### Phase 2: Frontend Implementation
4. Create integrations page and components
5. Add navigation menu item
6. Test with PermissionGuard

### Phase 3: Permissions & Access Control
7. Add `integration:Read` to permission seeder
8. Update existing admin role with new permission
9. Test access control scenarios

### Rollback Plan
- Feature is read-only and isolated
- No database migrations required
- Can remove route and navigation item
- No data loss risk

## Open Questions

**Q: Should we cache IMAI responses in the database for historical tracking?**
**A:** Out of scope for initial release. User story explicitly excludes historical data. Can be added later if needed.

**Q: What should happen if IMAI_API_KEY is not configured?**
**A:** Display error state in card: "IMAI not configured. Please add IMAI_API_KEY to environment variables."

**Q: Should non-admin users see integrations page?**
**A:** No. Use `integration:Read` permission, which only admins will have. Future: could expose limited view to other roles if needed.
