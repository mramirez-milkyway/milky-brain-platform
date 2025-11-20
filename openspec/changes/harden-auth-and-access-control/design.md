# Design: Harden Authentication & Access Control

## Context
The authentication system is functional but has critical security gaps:
- Google OAuth accepts any Google account (no domain filtering)
- No CSRF protection on mutation endpoints
- No refresh token mechanism (12h JWT only)
- Users auto-created without invitation requirement
- Frontend shows all features regardless of role

This change closes these gaps while maintaining compatibility with the existing invitation and RBAC systems.

## Goals / Non-Goals

### Goals
- Enforce domain restriction at Google OAuth level using `ALLOWED_INVITE_DOMAINS`
- Implement invitation-only authentication (no auto-user-creation)
- Add refresh token mechanism for seamless 1-month sessions
- Protect all mutations with CSRF tokens
- Hide UI features based on user role and permissions
- Maintain existing invitation and session management functionality

### Non-Goals
- Changing invitation flow or token generation
- Modifying existing RBAC permission model
- Adding MFA or additional auth factors
- Supporting non-Google OAuth providers
- Implementing "remember me" functionality beyond refresh tokens

## Decisions

### 1. Google OAuth Domain Restriction
**Decision:** Add `hd` (hosted domain) parameter to Google OAuth strategy and validate against `ALLOWED_INVITE_DOMAINS`

**Implementation:**
```typescript
// apps/api/src/auth/strategies/google.strategy.ts
new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.API_URL}/auth/google/callback`,
  scope: ['email', 'profile'],
  hd: process.env.ALLOWED_INVITE_DOMAINS?.split(',')[0] || 'milkyway-agency.com'
})
```

**Additional validation in callback:**
```typescript
async validateGoogleUser(profile) {
  const allowedDomains = process.env.ALLOWED_INVITE_DOMAINS?.split(',').map(d => d.trim())
  const userDomain = profile.email.split('@')[1]
  
  if (!allowedDomains.includes(userDomain)) {
    throw new UnauthorizedException('Invalid email domain')
  }
  
  // Check invitation exists
  const user = await prisma.user.findUnique({ where: { email: profile.email }})
  if (!user || user.status !== 'INVITED') {
    throw new UnauthorizedException('No invitation found for this email')
  }
  
  // Continue with activation...
}
```

**Rationale:**
- `hd` parameter filters at Google's OAuth consent screen level (user never sees app if domain mismatch)
- Server-side validation provides defense-in-depth
- Reading `ALLOWED_INVITE_DOMAINS` maintains single source of truth for domain config
- Invitation check prevents unauthorized user creation

**Alternatives considered:**
- Post-auth domain check only: Users see consent screen even if unauthorized
- Hardcoded domain: No flexibility for multi-tenant or partner domains

### 2. Refresh Token Architecture
**Decision:** Implement dual-token system with access + refresh tokens, both delivered as HTTP-only cookies

**Token Specifications:**
- **Access Token (JWT):**
  - Expiration: 12 hours (unchanged)
  - Contains: `{ email, sub: userId, jti, role, iat, exp }`
  - Cookie name: `access_token`
  - Used for: All API requests

- **Refresh Token:**
  - Expiration: 1 month (30 days)
  - Contains: `{ sub: userId, tokenId: UUID, type: 'refresh', iat, exp }`
  - Cookie name: `refresh_token`
  - Used for: Obtaining new access tokens via `/auth/refresh` endpoint

**Storage Strategy:**
```
Redis Key: `refresh:{userId}:{tokenId}`
Value: { jti: currentAccessTokenJti, issuedAt, userAgent, ipAddress }
TTL: 30 days
```

**Token Rotation:**
- On refresh, old refresh token is invalidated and new one issued
- Access token `jti` updated in Redis to track current session
- If refresh token reused (potential theft), invalidate all user sessions

**Rationale:**
- HTTP-only cookies prevent XSS token theft
- Short-lived access tokens minimize exposure window
- Refresh token rotation detects theft attempts
- Redis storage enables instant revocation
- Separate secrets for access vs refresh tokens (defense-in-depth)

**Alternatives considered:**
- Storing refresh tokens in database: Slower, adds DB load on every refresh
- Long-lived access tokens: Higher security risk if token compromised
- LocalStorage tokens: Vulnerable to XSS attacks

### 3. CSRF Protection Strategy
**Decision:** Use double-submit cookie pattern with per-session CSRF tokens

**Implementation Flow:**
1. On successful authentication, generate CSRF token: `crypto.randomBytes(32).toString('hex')`
2. Store in Redis: `csrf:{userId}:{jti}` → `{ token, createdAt }` with 12h TTL
3. Set cookie: `csrf_token` (not HTTP-only, so JavaScript can read)
4. Also send in response header: `X-CSRF-Token`
5. Frontend reads from cookie or header, includes in mutation requests as `X-CSRF-Token` header
6. Backend validates: extract token from header, compare with Redis value for current session

**Middleware Application:**
```typescript
// Applied globally to all POST/PUT/PATCH/DELETE routes
@UseGuards(JwtAuthGuard, CsrfGuard)
```

**CSRF Guard Logic:**
```typescript
if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
  return true // Skip for read operations
}

const tokenFromHeader = req.headers['x-csrf-token']
const userSession = req.user // from JWT
const storedToken = await redis.get(`csrf:${userSession.userId}:${userSession.jti}`)

if (!storedToken || tokenFromHeader !== storedToken) {
  throw new ForbiddenException('Invalid CSRF token')
}

return true
```

**Rationale:**
- Double-submit pattern is stateless-friendly (token in cookie + Redis)
- Per-session tokens prevent token fixation attacks
- Tied to JWT `jti` ensures token invalidation on logout/role-change
- Non-HTTP-only cookie allows JavaScript to read (required for SPA)
- Secure + SameSite=Lax cookies provide additional CSRF protection

**Alternatives considered:**
- Synchronizer token pattern: Requires server-side session storage (already using Redis, but adds complexity)
- SameSite=Strict only: Breaks legitimate cross-site OAuth redirects
- No CSRF protection: Violates project security rules and exposes application to attacks

### 4. Invitation-Only Sign-In Enforcement
**Decision:** Reject Google OAuth callback if user not found OR status is not INVITED

**Current Behavior (BEFORE):**
```typescript
// Auto-creates ACTIVE user if not exists
let user = await prisma.user.findUnique({ where: { email }})
if (!user) {
  user = await prisma.user.create({ 
    data: { email, name, status: 'ACTIVE' } 
  })
}
```

**New Behavior (AFTER):**
```typescript
const user = await prisma.user.findUnique({ where: { email }})

if (!user) {
  throw new UnauthorizedException('No invitation found. Please contact your administrator.')
}

if (user.status !== 'INVITED') {
  // If ACTIVE, allow sign-in (existing user)
  // If DEACTIVATED, reject
  if (user.status === 'DEACTIVATED') {
    throw new UnauthorizedException('Account has been deactivated')
  }
}

// Continue with invitation acceptance for INVITED users
// Or normal sign-in for ACTIVE users
```

**Rationale:**
- Prevents unauthorized account creation
- Maintains invitation-driven onboarding flow
- Clear error messages for each rejection reason
- Existing ACTIVE users can still sign in (no breaking change)

### 5. Role-Based UI Visibility
**Decision:** Implement client-side permission checks with server-side enforcement (defense-in-depth)

**Frontend Architecture:**
```typescript
// apps/web-admin/src/lib/auth-store.ts
interface AuthStore {
  user: User | null
  hasPermission: (action: string) => boolean
  canAccessRoute: (path: string) => boolean
}

// Permission mapping
const ROLE_PERMISSIONS = {
  Admin: ['*'], // All permissions
  Editor: ['user:Read', 'settings:Read', 'settings:Write', 'content:*'],
  Viewer: ['user:Read', 'settings:Read', 'content:Read']
}

// Usage in components
const { hasPermission } = useAuthStore()

{hasPermission('user:Create') && (
  <Button onClick={openInviteModal}>Invite User</Button>
)}
```

**Navigation Filtering:**
```typescript
// apps/web-admin/src/components/ProtectedLayout.tsx
const PROTECTED_ROUTES = {
  '/users': 'user:Read',
  '/roles': 'role:Read',
  '/audit': 'audit:Read',
  '/settings': 'settings:Read'
}

const visibleNavItems = NAV_ITEMS.filter(item => 
  hasPermission(PROTECTED_ROUTES[item.path])
)
```

**Rationale:**
- Client-side checks improve UX (no flashing of unauthorized content)
- Server-side guards remain primary security enforcement
- Simple permission model matches backend RBAC system
- Wildcard support (`content:*`) reduces permission mapping complexity

**Alternatives considered:**
- Server-side rendering only: Poor UX, requires full page reload for permission checks
- Feature flags: Overkill for role-based visibility, adds complexity
- Route-level guards only: Doesn't hide UI elements within pages

## Risks / Trade-offs

### Risk: Refresh Token Rotation Complexity
**Impact:** If rotation logic has bugs, users may get locked out requiring re-login

**Mitigation:**
- Implement graceful fallback: if refresh fails, redirect to login (don't block)
- Add comprehensive logging for refresh token operations
- Monitor refresh token usage patterns
- Allow grace period: old refresh token valid for 5 minutes after rotation

### Risk: CSRF Token Synchronization
**Impact:** Token mismatch between frontend and backend causes all mutations to fail

**Mitigation:**
- Include CSRF token in every API response (so frontend always has latest)
- Implement retry logic: if 403 CSRF error, re-fetch token and retry once
- Clear error messages distinguish CSRF errors from permission errors
- Development mode logs CSRF validation failures with details

### Risk: Breaking Change for Existing Users
**Impact:** Users with active sessions must re-authenticate after deployment

**Mitigation:**
- Communicate deployment maintenance window
- Implement gradual rollout: enable features via feature flags first
- Provide clear error message on old session: "Your session has expired. Please sign in again."
- Auto-redirect to login page with return URL preservation

### Trade-off: Redis Dependency Increased
**Decision:** Store both refresh tokens and CSRF tokens in Redis

**Trade-off:**
- Pro: Fast access, automatic expiration via TTL, instant revocation
- Con: Redis becomes critical dependency (if down, refresh and CSRF fail)
- Acceptable: Graceful degradation implemented (users can re-login if Redis down)

### Trade-off: Client-Side Permission Checks
**Decision:** Duplicate permission logic in frontend and backend

**Trade-off:**
- Pro: Better UX (no flashing unauthorized content), faster UI updates
- Con: Permission definitions must stay synchronized between frontend and backend
- Acceptable: Simple role → permissions mapping easy to maintain; backend remains source of truth

## Migration Plan

### Phase 1: Backend Infrastructure (No Breaking Changes)
1. Add refresh token generation to `auth.service.ts`
2. Create `/auth/refresh` endpoint (not used yet)
3. Implement CSRF middleware and guard (not applied globally yet)
4. Update `session.service.ts` with refresh token tracking

### Phase 2: OAuth Hardening (Breaking Change)
1. Add `hd` parameter to Google OAuth strategy
2. Implement invitation-only check in OAuth callback
3. Deploy with announcement: "Users must be invited before signing in"
4. Monitor for domain restriction errors

### Phase 3: Token & CSRF Rollout
1. Enable CSRF guard on all mutation endpoints
2. Update frontend API client with CSRF token handling
3. Deploy frontend with auto-refresh interceptor
4. Existing users see "Session expired" and must re-login (gets new tokens)

### Phase 4: Frontend UI Hardening
1. Add role-based navigation filtering
2. Add permission checks to action buttons
3. Implement 403 error handling with user-friendly messages

### Rollback Plan
- Remove CSRF guard from app module (disable validation)
- Revert Google OAuth strategy to not require `hd` parameter
- Remove refresh token logic (fall back to 12h JWT only)
- Frontend gracefully degrades (shows all features if permission check fails)

## Open Questions

### Q1: Should refresh token rotation be strict (invalidate immediately) or allow grace period?
**Recommendation:** Implement 5-minute grace period to handle clock skew and race conditions during refresh.

### Q2: How to handle CSRF token on first request before user authenticated?
**Recommendation:** CSRF token only generated after authentication. Unauthenticated endpoints (login, OAuth callback) don't require CSRF.

### Q3: Should role-based UI permissions be fetched from backend or hardcoded in frontend?
**Recommendation:** Hardcode in frontend for Phase 1 (simpler, faster UX). Add `/auth/permissions` endpoint in future if dynamic permissions needed.

### Q4: What should happen if `ALLOWED_INVITE_DOMAINS` is empty or not set?
**Recommendation:** Fail loudly in production (require explicit configuration). In development, log warning and default to `milkyway-agency.com`.

### Q5: Should we implement token refresh on 401 response or proactively before expiration?
**Recommendation:** Hybrid approach: attempt proactive refresh 5 minutes before expiration, plus automatic retry on 401 with token refresh.
