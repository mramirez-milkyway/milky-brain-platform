# Design: Manage Influencers

## Context

The system currently supports bulk influencer import via CSV but lacks individual CRUD operations. Users need to:
- Verify influencer identity before adding (to prevent errors)
- Edit and delete records individually
- Handle soft-deleted records gracefully when re-adding

The existing infrastructure includes:
- IMAI API integration (currently used for quota/credits check only)
- Soft delete pattern (`deleted_at` field) on Creator and CreatorSocial models
- RBAC system with policy-based permissions
- TanStack Query for frontend data fetching

## Goals

- Enable single-influencer add with IMAI verification
- Provide edit and soft-delete capabilities
- Automatically restore soft-deleted records when re-adding
- Maintain audit trail for all operations
- Integrate with existing permission system

## Non-Goals

- Auto-enriching all fields from IMAI (only basic identity info for verification)
- Manual override if IMAI is unavailable (blocking for strict verification)
- Hard delete functionality (soft delete only)

## Decisions

### 1. IMAI Profile Lookup Endpoint

**Decision:** Create a new proxy endpoint `GET /api/integrations/imai/profile?handle={handle}&platform={platform}` that fetches profile data from IMAI.

**Rationale:**
- Keeps IMAI API key server-side
- Allows caching to save API credits
- Provides consistent error handling

**Response shape:**
```typescript
{
  found: boolean
  profile?: {
    handle: string
    platform: string
    fullName: string
    bio: string
    profilePicUrl: string
    followers: number
    engagementRate?: number
  }
  cached: boolean
}
```

### 2. Caching Strategy

**Decision:** Cache IMAI lookup results in Redis for 5 minutes using key pattern `imai:profile:{platform}:{handle}`.

**Rationale:**
- User may close/reopen modal accidentally
- Saves API credits on repeated lookups
- 5-minute TTL balances freshness vs. cost

### 3. Soft Delete Restoration Flow

**Decision:** When creating a new influencer, the service layer checks for existing soft-deleted records by `handle + platform` combination. If found, it clears `deleted_at` and updates with new data.

**Rationale:**
- Maintains data integrity (no duplicate handles)
- Preserves historical relationships (campaigns, posts)
- Consistent with current import duplicate handling pattern

### 4. Permission Model

**Decision:** Add three new permissions to RBAC:
- `creator:Create` - Create new influencers
- `creator:Update` - Edit existing influencers
- `creator:Delete` - Soft delete influencers

**Rationale:**
- Follows existing naming convention (creator vs influencer)
- Granular control matches current RBAC architecture
- Admin has all by default; Editor gets Create/Update; Viewer gets none

### 5. API Endpoint Design

**Endpoints:**
- `POST /api/creators` - Create (with restore logic)
- `PATCH /api/creators/:id` - Update
- `DELETE /api/creators/:id` - Soft delete
- `POST /api/creators/:id/restore` - Explicit restore (optional, for admin)

**Rationale:**
- RESTful conventions
- PATCH for partial updates (not PUT)
- DELETE performs soft delete (idiomatic)

### 6. Frontend State Management

**Decision:** Use TanStack Query mutations with optimistic updates for edit/delete operations.

**Rationale:**
- Consistent with existing patterns
- Provides good UX with immediate feedback
- Handles error rollback automatically

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| IMAI API rate limits | 5-minute Redis cache reduces calls |
| IMAI unavailable | Show error, block add (strict verification per requirements) |
| Concurrent restore attempts | Database transaction with FOR UPDATE lock on creator record |
| Large form complexity | Progressive disclosure (verify first, then full form) |

## Migration Plan

No data migration required. Changes are additive:
1. Add new API endpoints
2. Update Lambda import handler
3. Add UI components
4. Update RBAC policies

Rollback: Disable new endpoints via feature flag or remove UI routes.

## Open Questions

1. **Permission names:** Should we use `creator:*` or `influencer:*` for new permissions? The codebase uses both terms. Current code uses `creator:Read` in controllers.
   - **Recommendation:** Use `creator:*` for consistency with existing controller decorators.

2. **Restore endpoint:** Is an explicit `/restore` endpoint needed, or is restore-on-create sufficient?
   - **Recommendation:** Start with restore-on-create only; add explicit restore if users request it.
