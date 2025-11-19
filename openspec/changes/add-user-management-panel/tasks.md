# Implementation Tasks

## 1. Database Schema & Migrations
- [ ] 1.1 Create Prisma migration for `UserInvitation` table with fields: id, userId, token, expiresAt, createdAt
- [ ] 1.2 Add unique constraints on `userId` and `token` in UserInvitation model
- [ ] 1.3 Add onDelete: Cascade foreign key from UserInvitation to User
- [ ] 1.4 Run migration: `npx prisma migrate dev --name=add_user_invitations`
- [ ] 1.5 Verify migration success and schema.prisma updated

## 2. Infrastructure Setup
- [ ] 2.1 Add `resend` package to API dependencies: `pnpm add resend --filter @milky-way/api`
- [ ] 2.2 Add `ioredis` package to API dependencies: `pnpm add ioredis --filter @milky-way/api`
- [ ] 2.3 Add environment variables to `.env.example`: `RESEND_API_KEY`, `ALLOWED_INVITE_DOMAINS`, `REDIS_URL`, `INVITATION_EXPIRY_DAYS`, `FROM_EMAIL`
- [ ] 2.4 Create Redis service in `src/common/services/redis.service.ts` with connection management
- [ ] 2.5 Register RedisService as provider in AppModule
- [ ] 2.6 Add Redis health check to app startup

## 3. Email Service Implementation
- [ ] 3.1 Create email module: `nest g module notifications/email`
- [ ] 3.2 Create email service: `src/notifications/email/email.service.ts`
- [ ] 3.3 Implement Resend client initialization with API key from config
- [ ] 3.4 Create invitation email HTML template in `src/notifications/email/templates/invitation.html`
- [ ] 3.5 Implement `sendInvitationEmail(to, token, role, inviterName)` method
- [ ] 3.6 Add error handling and logging for email send failures
- [ ] 3.7 Add email send event to audit log

## 4. Session Management Implementation
- [ ] 4.1 Create session service: `src/auth/services/session.service.ts`
- [ ] 4.2 Implement `blacklistToken(jti, userId, reason)` method
- [ ] 4.3 Implement `isTokenBlacklisted(jti)` method with Redis lookup
- [ ] 4.4 Implement `revokeAllUserSessions(userId)` method to blacklist all active tokens
- [ ] 4.5 Add `jti` claim to JWT payload in `auth.service.ts` login method (use UUID v4)
- [ ] 4.6 Create session tracking: `recordSession(userId, jti, metadata)` in Redis
- [ ] 4.7 Update JWT strategy to check token blacklist before validating user
- [ ] 4.8 Implement graceful degradation if Redis is unavailable (log error, allow request)

## 5. Activity Tracking Implementation
- [ ] 5.1 Create activity tracking middleware: `src/common/middleware/activity-tracking.middleware.ts`
- [ ] 5.2 Implement logic to detect meaningful actions (POST/PUT/PATCH/DELETE or export GET requests)
- [ ] 5.3 Implement async `lastSeenAt` update with error handling (fire-and-forget)
- [ ] 5.4 Register middleware in AppModule after JwtAuthGuard
- [ ] 5.5 Add throttling: only update if `lastSeenAt` is null or older than 5 minutes
- [ ] 5.6 Verify activity updates do not block requests or cause performance issues

## 6. User Service Enhancements
- [ ] 6.1 Update `invite()` method to validate inviter's email domain against `ALLOWED_INVITE_DOMAINS`
- [ ] 6.2 Generate secure invitation token using `crypto.randomBytes(32).toString('base64url')`
- [ ] 6.3 Create UserInvitation record with 30-day expiration
- [ ] 6.4 Integrate email service to send invitation email
- [ ] 6.5 Wrap invitation creation in database transaction (rollback on email failure)
- [ ] 6.6 Implement `resendInvitation(userId)` method
- [ ] 6.7 Add validation: only INVITED users can have invitations resent
- [ ] 6.8 Generate new token and delete old token on resend
- [ ] 6.9 Update `deactivate()` method to call session revocation service
- [ ] 6.10 Update `assignRole()` and `removeRole()` to revoke sessions for ACTIVE users only
- [ ] 6.11 Add check to prevent self-deactivation

## 7. User Controller Enhancements
- [ ] 7.1 Add `POST /users/:id/resend-invitation` endpoint with `@RequirePermission('user:Create')`
- [ ] 7.2 Update `GET /users` to include roles and lastSeenAt in response
- [ ] 7.3 Add query to fetch user roles via userRoles relation
- [ ] 7.4 Add endpoint `PATCH /users/:userId/roles/:roleId` to modify roles
- [ ] 7.5 Add validation and error responses for domain restrictions

## 8. Frontend UI Implementation
- [ ] 8.1 Update `apps/web/src/app/(dashboard)/users/page.tsx` to display role badges for each user
- [ ] 8.2 Add "Last Activity" column with relative time formatting (use `date-fns`)
- [ ] 8.3 Add "Total Active Users" count display at top of page
- [ ] 8.4 Implement role change dropdown/modal for each user
- [ ] 8.5 Add "Resend Invitation" button visible only for INVITED users
- [ ] 8.6 Update deactivate button to show confirmation modal with warning
- [ ] 8.7 Add visual indicator (green dot) for users active within last hour
- [ ] 8.8 Implement API integration for resend invitation mutation
- [ ] 8.9 Implement API integration for role change mutation
- [ ] 8.10 Add error handling and success toasts for all mutations
- [ ] 8.11 Update user list query to invalidate on role changes and resends

## 9. Testing
- [ ] 9.1 Write unit tests for email service (`email.service.spec.ts`)
- [ ] 9.2 Write unit tests for session service (`session.service.spec.ts`)
- [ ] 9.3 Write unit tests for activity tracking middleware (`activity-tracking.middleware.spec.ts`)
- [ ] 9.4 Write integration tests for invitation flow (create, send, resend)
- [ ] 9.5 Write integration tests for session revocation on deactivation and role change
- [ ] 9.6 Write tests for domain restriction validation
- [ ] 9.7 Test Redis failover scenarios (connection loss, recovery)
- [ ] 9.8 Test email send failure scenarios and transaction rollback

## 10. Documentation & Configuration
- [ ] 10.1 Update README with Redis setup instructions
- [ ] 10.2 Update README with Resend configuration steps
- [ ] 10.3 Document environment variable requirements
- [ ] 10.4 Add deployment notes for Redis in production (managed service recommended)
- [ ] 10.5 Update API documentation with new endpoints
- [ ] 10.6 Add troubleshooting guide for common issues (email delivery, Redis connection)

## 11. Security & Validation
- [ ] 11.1 Validate invitation token format and uniqueness
- [ ] 11.2 Ensure tokens are one-time use (delete after acceptance)
- [ ] 11.3 Add rate limiting to invitation endpoints (prevent abuse)
- [ ] 11.4 Validate email format server-side before creating invitation
- [ ] 11.5 Ensure session revocation happens within transaction for role changes
- [ ] 11.6 Audit log all invitation events (sent, resent, accepted, expired)

## 12. Deployment & Rollout
- [ ] 12.1 Set up Redis instance in development environment
- [ ] 12.2 Configure Resend account and verify domain
- [ ] 12.3 Test email deliverability in staging
- [ ] 12.4 Run database migration in staging
- [ ] 12.5 Deploy backend changes to staging
- [ ] 12.6 Deploy frontend changes to staging
- [ ] 12.7 Perform end-to-end testing in staging (invite, role change, deactivate, resend)
- [ ] 12.8 Monitor Redis performance and connection stability
- [ ] 12.9 Deploy to production with rollback plan ready
- [ ] 12.10 Monitor error rates and email delivery for 24 hours post-deployment
