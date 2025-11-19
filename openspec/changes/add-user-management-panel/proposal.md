# Change: Add User Management Panel (View, Invite, & Deactivate)

## Why
Admins need a centralized interface to manage team access, including viewing all users with their roles and activity, inviting new teammates with specific roles, and revoking access when necessary. The current system has basic invitation functionality but lacks comprehensive user management capabilities, role assignment during invitation, email notifications, and proper session revocation.

## What Changes
- Enhance user list display to show email, roles, last activity, and total active users count
- Implement email invitation flow using Resend with HTML templates and 1-month expiring tokens
- Add domain restriction for invitations (configurable via `ALLOWED_INVITE_DOMAINS` environment variable)
- Enable role assignment and modification for both INVITED and ACTIVE users
- Implement session revocation using Redis-based token blacklist for deactivated users and role changes
- Add activity tracking middleware that updates `lastSeenAt` on meaningful actions (mutations and exports)
- Build invitation resend capability without extending token expiration

## Impact
- **Affected specs:** 
  - `user-management` (new capability)
  - `user-invitations` (new capability)
  - `session-management` (new capability)
  - `activity-tracking` (new capability)

- **Affected code:**
  - `apps/api/prisma/schema.prisma` - Add invitation tokens table and Redis session tracking
  - `apps/api/src/users/users.service.ts` - Enhanced user operations
  - `apps/api/src/users/users.controller.ts` - New endpoints for role management and resend
  - `apps/api/src/auth/auth.service.ts` - Session revocation logic
  - `apps/api/src/common/middleware/` - Activity tracking middleware (new)
  - `apps/api/src/notifications/` - Email service integration with Resend
  - `apps/web/src/app/(dashboard)/users/page.tsx` - Enhanced UI with all management features

- **New dependencies:**
  - `resend` - Email service SDK
  - `ioredis` - Redis client for session management

- **Environment variables:**
  - `RESEND_API_KEY` - Resend API key (already added)
  - `ALLOWED_INVITE_DOMAINS` - Comma-separated list of allowed email domains (e.g., `milkyway-agency.com,example.com`)
  - `REDIS_URL` - Redis connection string for session blacklist
  - `INVITATION_EXPIRY_DAYS` - Token expiration (default: 30)
  - `FROM_EMAIL` - Sender email for invitations
