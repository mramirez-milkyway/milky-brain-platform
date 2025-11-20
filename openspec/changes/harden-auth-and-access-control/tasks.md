# Tasks: Harden Authentication & Access Control

## Backend Tasks (NestJS API)

### Phase 1: Refresh Token Infrastructure

- [ ] **Add refresh token configuration to environment variables**
  - Add `REFRESH_TOKEN_SECRET` to `.env.example` and validate at startup
  - Add `REFRESH_TOKEN_EXPIRY` with default `30d`
  - Add validation to ensure `REFRESH_TOKEN_SECRET` is set in production
  - Location: `apps/api/src/config/` or `apps/api/src/main.ts`

- [ ] **Extend JWT service with refresh token generation**
  - Add `generateRefreshToken(userId: number)` method to `auth.service.ts`
  - Create refresh token payload with `{ sub, tokenId, type: 'refresh', iat, exp }`
  - Sign with `REFRESH_TOKEN_SECRET`
  - Return both access and refresh tokens from method
  - Location: `apps/api/src/auth/auth.service.ts`

- [ ] **Update session service for refresh token tracking**
  - Add `storeRefreshToken(userId, tokenId, metadata)` method to `session.service.ts`
  - Store in Redis with key `refresh:{userId}:{tokenId}`
  - Include `{ jti, issuedAt, userAgent, ipAddress }` in value
  - Set TTL to 30 days
  - Add `getRefreshToken(userId, tokenId)` method
  - Add `deleteRefreshToken(userId, tokenId)` method
  - Add `revokeAllRefreshTokens(userId)` method to delete all `refresh:{userId}:*` keys
  - Location: `apps/api/src/auth/services/session.service.ts`

- [ ] **Create refresh token validation method**
  - Add `validateRefreshToken(token: string)` method to `auth.service.ts`
  - Verify JWT signature with `REFRESH_TOKEN_SECRET`
  - Check token not expired
  - Verify token exists in Redis
  - Return payload or throw `UnauthorizedException`
  - Location: `apps/api/src/auth/auth.service.ts`

- [ ] **Implement token rotation logic**
  - Add `refreshAccessToken(refreshToken: string)` method to `auth.service.ts`
  - Validate refresh token
  - Detect token reuse: if not in Redis, revoke all user sessions
  - Generate new access token and new refresh token
  - Delete old refresh token from Redis
  - Store new refresh token in Redis
  - Return new tokens
  - Location: `apps/api/src/auth/auth.service.ts`

- [ ] **Create `/auth/refresh` endpoint**
  - Add `POST /auth/refresh` route to `auth.controller.ts`
  - Extract refresh token from `refresh_token` cookie
  - Call `refreshAccessToken()` method
  - Set new `access_token` and `refresh_token` cookies
  - Return 200 with user info
  - Handle errors: return 401 for invalid/expired tokens
  - Location: `apps/api/src/auth/auth.controller.ts`

- [ ] **Update authentication flow to issue refresh tokens**
  - Modify `validateGoogleUser()` to generate both access and refresh tokens
  - Store refresh token in Redis
  - Set both `access_token` and `refresh_token` cookies in OAuth callback
  - Update cookie options: `httpOnly: true`, `secure: prod`, `sameSite: 'Lax'`
  - Location: `apps/api/src/auth/auth.service.ts` and `auth.controller.ts`

### Phase 2: Google OAuth Hardening

- [ ] **Add domain restriction to Google OAuth strategy**
  - Read `ALLOWED_INVITE_DOMAINS` from environment
  - Add `hd` parameter with first domain from list to Google strategy config
  - Validate `ALLOWED_INVITE_DOMAINS` is set at startup (fail in production if missing)
  - Location: `apps/api/src/auth/strategies/google.strategy.ts`

- [ ] **Implement domain validation in OAuth callback**
  - Extract domain from user email in `validateGoogleUser()`
  - Parse `ALLOWED_INVITE_DOMAINS` into array
  - Validate email domain is in allowed list
  - Throw `UnauthorizedException('Invalid email domain')` if not allowed
  - Location: `apps/api/src/auth/strategies/google.strategy.ts` or `auth.service.ts`

- [ ] **Implement invitation-only authentication check**
  - In `validateGoogleUser()`, check if user exists in database
  - If user does not exist, throw `UnauthorizedException('No invitation found. Please contact your administrator.')`
  - If user exists with `status = 'DEACTIVATED'`, throw `UnauthorizedException('Account has been deactivated')`
  - If user exists with `status = 'INVITED'`, proceed with invitation acceptance flow
  - If user exists with `status = 'ACTIVE'`, proceed with normal login
  - Remove auto-user-creation logic
  - Location: `apps/api/src/auth/auth.service.ts`

- [ ] **Add OAuth error handling and redirects**
  - Catch exceptions in OAuth callback
  - Redirect to frontend login with error query params:
    - `?error=invalid_domain` for domain errors
    - `?error=no_invitation` for missing invitation
    - `?error=account_deactivated` for deactivated accounts
  - Use environment variable `FRONTEND_URL` for redirect base
  - Location: `apps/api/src/auth/auth.controller.ts`

### Phase 3: CSRF Protection

- [ ] **Create CSRF token generation utility**
  - Create `generateCsrfToken()` function using `crypto.randomBytes(32).toString('hex')`
  - Add to utilities or create new file `apps/api/src/common/utils/csrf.util.ts`

- [ ] **Implement CSRF token storage in Redis**
  - Add `storeCsrfToken(userId, jti, token)` method to session service or create new `csrf.service.ts`
  - Store with key pattern `csrf:{userId}:{jti}`
  - Set TTL to 12 hours (match access token)
  - Add `getCsrfToken(userId, jti)` method
  - Add `deleteCsrfToken(userId, jti)` method
  - Location: `apps/api/src/auth/services/session.service.ts` or `apps/api/src/common/services/csrf.service.ts`

- [ ] **Generate CSRF token on authentication**
  - In OAuth callback success, generate CSRF token
  - Store in Redis with user ID and JWT `jti`
  - Set `csrf_token` cookie (NOT HTTP-only, `secure`, `sameSite: 'Lax'`)
  - Add `X-CSRF-Token` response header with token value
  - Location: `apps/api/src/auth/auth.controller.ts`

- [ ] **Generate CSRF token on refresh**
  - In `/auth/refresh` endpoint, generate new CSRF token
  - Delete old CSRF token (old `jti`)
  - Store new CSRF token (new `jti`)
  - Set new cookie and header
  - Location: `apps/api/src/auth/auth.controller.ts`

- [ ] **Create CSRF validation guard**
  - Create `CsrfGuard` class in `apps/api/src/common/guards/csrf.guard.ts`
  - Implement `CanActivate` interface
  - Skip validation for GET, HEAD, OPTIONS methods
  - Skip validation for unauthenticated requests
  - Extract token from `X-CSRF-Token` header
  - Extract `userId` and `jti` from request user (JWT auth)
  - Retrieve stored token from Redis
  - Compare using `crypto.timingSafeEqual()` (constant-time)
  - Throw `ForbiddenException('Invalid CSRF token')` on mismatch
  - Location: `apps/api/src/common/guards/csrf.guard.ts`

- [ ] **Create SkipCsrf decorator (optional)**
  - Create `@SkipCsrf()` decorator for explicit CSRF bypass
  - Use metadata to mark routes that skip CSRF
  - Update CSRF guard to check for this metadata
  - Location: `apps/api/src/common/decorators/skip-csrf.decorator.ts`

- [ ] **Apply CSRF guard globally**
  - Register `CsrfGuard` in app module providers
  - Apply guard globally after `JwtAuthGuard` in execution order
  - Exclude specific paths: `/auth/google`, `/auth/google/callback`, `/health`
  - Test guard execution order: JWT → CSRF → Permission
  - Location: `apps/api/src/app.module.ts`

- [ ] **Add CSRF token cleanup on logout**
  - Update `/auth/logout` endpoint to delete CSRF token
  - Clear `csrf_token` cookie
  - Location: `apps/api/src/auth/auth.controller.ts`

### Phase 4: Session Revocation Updates

- [ ] **Update user deactivation to revoke refresh tokens**
  - In `users.service.ts` deactivate method, call `revokeAllRefreshTokens(userId)`
  - Ensure both access tokens (existing) and refresh tokens (new) are revoked
  - Location: `apps/api/src/users/users.service.ts`

- [ ] **Update role change to revoke refresh tokens**
  - In `users.service.ts` role assignment/removal, call `revokeAllRefreshTokens(userId)`
  - Only for ACTIVE users
  - Location: `apps/api/src/users/users.service.ts`

- [ ] **Update logout to revoke refresh token**
  - In `/auth/logout`, extract refresh token from cookie
  - Decode to get `tokenId`
  - Delete specific refresh token from Redis
  - Clear both `access_token` and `refresh_token` cookies
  - Location: `apps/api/src/auth/auth.controller.ts`

### Phase 5: Testing & Validation

- [ ] **Write unit tests for refresh token service**
  - Test token generation, validation, rotation
  - Test token reuse detection
  - Test revocation scenarios
  - Location: `apps/api/src/auth/tests/unit/auth.service.spec.ts`

- [ ] **Write unit tests for CSRF guard**
  - Test validation with valid token
  - Test rejection with invalid token
  - Test skipping for GET requests
  - Test constant-time comparison
  - Location: `apps/api/src/common/guards/tests/csrf.guard.spec.ts`

- [ ] **Write integration tests for OAuth hardening**
  - Test domain restriction rejection
  - Test invitation-only enforcement
  - Test error redirects
  - Location: `apps/api/src/auth/tests/integration/`

- [ ] **Write integration tests for refresh flow**
  - Test successful refresh
  - Test expired token rejection
  - Test token rotation
  - Test reuse detection
  - Location: `apps/api/src/auth/tests/integration/`

## Frontend Tasks (Next.js web-admin)

### Phase 6: API Client Enhancements

- [ ] **Implement automatic token refresh in API client**
  - Create Axios response interceptor in `api-client.ts`
  - Detect 401 responses
  - Call `/auth/refresh` endpoint
  - Retry original request with new tokens
  - Redirect to login if refresh fails
  - Prevent refresh retry loops
  - Location: `apps/web-admin/src/lib/api-client.ts`

- [ ] **Implement proactive token refresh**
  - Add access token expiration tracking to auth store
  - Set up timer to refresh 5 minutes before expiration
  - Call `/auth/refresh` proactively
  - Handle refresh errors gracefully
  - Location: `apps/web-admin/src/lib/auth-store.ts`

- [ ] **Add CSRF token handling to API client**
  - Create Axios request interceptor
  - Read CSRF token from `csrf_token` cookie for mutation requests
  - Add `X-CSRF-Token` header to POST/PUT/PATCH/DELETE requests
  - Skip header for GET requests
  - Location: `apps/web-admin/src/lib/api-client.ts`

- [ ] **Handle CSRF errors in API client**
  - Create Axios response interceptor for 403 errors
  - Check if error message indicates CSRF issue
  - Attempt token refresh to get new CSRF token
  - Retry original request once
  - Show toast notification if retry fails
  - Location: `apps/web-admin/src/lib/api-client.ts`

- [ ] **Store CSRF token in auth store (optional)**
  - Add `csrfToken` state to auth store
  - Update on login and refresh
  - Read from store instead of cookie (performance optimization)
  - Location: `apps/web-admin/src/lib/auth-store.ts`

### Phase 7: Role-Based UI Implementation

- [ ] **Create permission configuration file**
  - Create `apps/web-admin/src/lib/permissions.ts`
  - Define `ROLE_PERMISSIONS` mapping (Admin, Editor, Viewer)
  - Define `ROUTE_PERMISSIONS` mapping for protected routes
  - Export permission constants

- [ ] **Add permission checking to auth store**
  - Add `hasPermission(action: string)` method to auth store
  - Implement wildcard matching (`content:*`, `*`)
  - Return `false` if user not authenticated
  - Test with different roles
  - Location: `apps/web-admin/src/lib/auth-store.ts`

- [ ] **Create usePermission hook**
  - Create `apps/web-admin/src/hooks/usePermission.ts`
  - Export `usePermission()` hook that returns `{ hasPermission }`
  - Support direct permission check: `usePermission('user:Create')` returns boolean
  - Connect to auth store

- [ ] **Implement navigation filtering**
  - Update `ProtectedLayout.tsx` or sidebar component
  - Filter navigation items based on `ROUTE_PERMISSIONS`
  - Use `hasPermission()` to check each item
  - Remove unauthorized items from DOM
  - Location: `apps/web-admin/src/components/ProtectedLayout.tsx`

- [ ] **Add permission checks to user management page**
  - Wrap "Invite User" button with `{hasPermission('user:Create') && ...}`
  - Hide edit/delete actions if lacking permissions
  - Add read-only indicator for Viewers
  - Location: `apps/web-admin/src/app/users/page.tsx`

- [ ] **Add permission checks to settings page**
  - Show read-only form for users without `settings:Write`
  - Hide save buttons if lacking permissions
  - Location: `apps/web-admin/src/app/settings/page.tsx` (if exists)

- [ ] **Create Access Denied page component**
  - Create `apps/web-admin/src/components/AccessDenied.tsx`
  - Display "You don't have permission to view this page"
  - Include button to return to Dashboard
  - Style consistently with app theme

- [ ] **Add 403 error handling**
  - Create error boundary or use API client interceptor
  - Detect 403 responses on page load
  - Render `AccessDenied` component
  - Show toast notification for 403 on mutations
  - Location: `apps/web-admin/src/lib/api-client.ts` and page components

### Phase 8: OAuth Error Handling

- [ ] **Update login page to handle error query params**
  - Read `error` query param on login page
  - Display error messages based on error type:
    - `invalid_domain`: "Invalid email domain. Please use your @milkyway-agency.com account."
    - `no_invitation`: "No invitation found. Please contact your administrator."
    - `account_deactivated`: "Your account has been deactivated. Please contact your administrator."
  - Auto-dismiss domain error after 5 seconds
  - Persist other errors until dismissed
  - Location: `apps/web-admin/src/app/login/page.tsx`

- [ ] **Style error messages on login page**
  - Use toast notification or inline alert
  - Red color scheme for errors
  - Dismissible close button
  - Accessible (ARIA labels)
  - Location: `apps/web-admin/src/app/login/page.tsx`

### Phase 9: Testing & QA

- [ ] **Write frontend unit tests for permission checks**
  - Test `hasPermission()` with different roles
  - Test wildcard matching
  - Test unauthenticated state
  - Location: `apps/web-admin/src/lib/__tests__/permissions.test.ts`

- [ ] **Write component tests for role-based UI**
  - Test navigation filtering for each role
  - Test button visibility with different permissions
  - Test Access Denied page rendering
  - Location: `apps/web-admin/src/components/__tests__/`

- [ ] **Write integration tests for token refresh**
  - Mock API responses
  - Test automatic refresh on 401
  - Test proactive refresh
  - Test redirect on refresh failure
  - Location: `apps/web-admin/src/lib/__tests__/api-client.test.ts`

- [ ] **Manual QA testing**
  - Test complete OAuth flow with valid domain
  - Test domain restriction rejection
  - Test invitation-only enforcement
  - Test token refresh flow (wait for expiration or mock)
  - Test CSRF token on all mutations
  - Test role-based UI visibility for Admin, Editor, Viewer
  - Test 403 error handling
  - Test logout and re-login

## Infrastructure & Documentation

### Phase 10: Configuration & Deployment

- [ ] **Update environment variable documentation**
  - Add `REFRESH_TOKEN_SECRET` to `.env.example` with strong random default
  - Add `REFRESH_TOKEN_EXPIRY` with default `30d`
  - Document `ALLOWED_INVITE_DOMAINS` usage (already exists, ensure documented)
  - Add notes about production requirements
  - Location: `.env.example` and `README.md`

- [ ] **Add environment validation at startup**
  - Check `REFRESH_TOKEN_SECRET` is set in production
  - Check `ALLOWED_INVITE_DOMAINS` is set in production
  - Fail loudly if missing required variables
  - Log warnings for development with defaults
  - Location: `apps/api/src/main.ts` or config module

- [ ] **Update deployment documentation**
  - Document breaking change: users must re-authenticate after deployment
  - Provide migration plan for gradual rollout
  - Document Redis dependency (already exists, ensure noted for refresh tokens)
  - Add troubleshooting section for CSRF and refresh token issues
  - Location: `README.md` or `DEPLOYMENT.md`

- [ ] **Add monitoring and logging**
  - Log CSRF validation failures with details (dev mode)
  - Log refresh token reuse detection (security alert)
  - Log domain restriction violations (audit trail)
  - Monitor Redis health (existing, ensure covers new keys)
  - Location: Throughout auth module

### Phase 11: Final Validation

- [ ] **Run OpenSpec validation**
  - Execute `npx openspec validate harden-auth-and-access-control --strict`
  - Fix any validation errors
  - Ensure all requirements have scenarios

- [ ] **Code review**
  - Review all security-critical code (CSRF, token validation, domain checks)
  - Ensure constant-time comparisons used
  - Verify no secrets logged
  - Check error messages don't leak sensitive info

- [ ] **Security audit**
  - Verify CSRF protection on all mutations
  - Verify refresh token rotation working
  - Verify domain restriction enforced
  - Verify invitation-only authentication working
  - Verify permission checks on all sensitive endpoints

- [ ] **Performance testing**
  - Test Redis load with token operations
  - Verify CSRF validation doesn't add significant latency
  - Test automatic refresh doesn't cause request storms
  - Monitor Redis memory usage

## Dependencies

**Parallel Work:**
- Backend Phase 1 and Frontend Phase 6 can be developed in parallel
- Backend Phase 2 and Frontend Phase 7 can be developed in parallel
- Testing phases can be done incrementally alongside development

**Sequential Dependencies:**
- Phase 3 (CSRF) depends on Phase 1 (refresh tokens need CSRF on refresh endpoint)
- Phase 4 (session revocation updates) depends on Phase 1 (refresh token service)
- Phase 8 (OAuth error handling frontend) depends on Phase 2 (OAuth hardening backend)
- Phase 9-11 (testing, QA, validation) depend on all development phases complete

**Critical Path:**
1. Backend Phase 1 → Backend Phase 3 → Backend Phase 5 (core auth infrastructure)
2. Backend Phase 2 → Frontend Phase 8 (OAuth hardening)
3. Frontend Phase 6 → Frontend Phase 9 (API client enhancements)
4. Frontend Phase 7 (role-based UI is independent, can be done anytime)
5. Phase 10-11 (final validation and deployment)

**Estimated Total Tasks:** 52 tasks
**Estimated Complexity:** High (security-critical changes, multiple systems)
**Recommended Approach:** Implement in phases with thorough testing at each phase before proceeding
