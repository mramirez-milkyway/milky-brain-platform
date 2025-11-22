# Change: Harden Authentication & Access Control

## Why
The current authentication system has critical security gaps that expose the application to unauthorized access and CSRF attacks. While the invitation and RBAC systems are fully implemented, the following vulnerabilities exist:

1. **No Domain Restriction at OAuth Level:** Any Google account can authenticate, not just `@milkyway-agency.com` accounts
2. **Missing CSRF Protection:** All mutation endpoints lack CSRF token validation, violating project security rules
3. **Auto-Creation of Unauthorized Users:** Users without invitations can sign in and get auto-created as ACTIVE
4. **Short Session Duration:** 12-hour JWT tokens require frequent re-authentication without refresh mechanism
5. **No Role-Based UI:** Frontend shows all features regardless of user permissions

These gaps create security risks and poor user experience. This change hardens the authentication system to meet enterprise security standards.

## What Changes
- Enforce Google OAuth domain restriction using the `ALLOWED_INVITE_DOMAINS` environment variable and `hd` parameter
- Implement invitation-only sign-in (reject OAuth if user not invited)
- Add refresh token mechanism (12h access token + 1 month refresh token) via HTTP-only cookies
- Implement CSRF token generation and validation for all mutation requests
- Add role-based UI visibility in web-admin (hide features based on permissions)
- Display clear error messages for domain restriction violations
- Automatically refresh access tokens using refresh tokens

## Impact
- **Affected specs:** 
  - `google-oauth-hardening` (new capability)
  - `refresh-token-auth` (new capability)
  - `csrf-protection` (new capability)
  - `role-based-ui` (new capability)

- **Affected code:**
  - `apps/api/src/auth/strategies/google.strategy.ts` - Add domain restriction and invitation check
  - `apps/api/src/auth/auth.service.ts` - Add refresh token generation and validation
  - `apps/api/src/auth/auth.controller.ts` - Add refresh endpoint and CSRF token delivery
  - `apps/api/src/common/guards/csrf.guard.ts` - New CSRF validation guard
  - `apps/api/src/common/middleware/csrf.middleware.ts` - New CSRF token generation
  - `apps/api/src/common/services/session.service.ts` - Enhanced with refresh token tracking
  - `apps/api/prisma/schema.prisma` - Add refresh token tracking (if needed)
  - `apps/web-admin/src/lib/api-client.ts` - Add auto-refresh interceptor and CSRF headers
  - `apps/web-admin/src/lib/auth-store.ts` - Add role-based permission checking
  - `apps/web-admin/src/components/ProtectedLayout.tsx` - Add role-based navigation
  - `apps/web-admin/src/app/login/page.tsx` - Add domain error handling

- **New dependencies:**
  - `csurf` or custom CSRF implementation - CSRF token management

- **Environment variables:**
  - `ALLOWED_INVITE_DOMAINS` - Existing, now enforced at OAuth level (comma-separated domains)
  - `REFRESH_TOKEN_SECRET` - New secret for signing refresh tokens
  - `REFRESH_TOKEN_EXPIRY` - Refresh token expiration (default: 30 days)

- **Breaking changes:**
  - Users without `@milkyway-agency.com` (or configured domains) can no longer sign in
  - All frontend mutations must include CSRF token (handled automatically by API client)
  - Users must be invited before they can authenticate

## Risks
- **Redis Dependency:** Refresh tokens stored in Redis; if Redis down, users can't refresh (mitigation: graceful degradation with re-login prompt)
- **Migration Complexity:** Existing sessions will need re-authentication after deployment
- **CSRF Token Sync:** Frontend must properly handle CSRF token refresh on each request
