# Design: User Management Panel

## Context
The admin panel needs comprehensive user management capabilities. The system already has:
- User model with `ACTIVE`, `DEACTIVATED`, and `INVITED` status
- Role-based access control (RBAC) with UserRole junction table
- Google OAuth authentication with JWT tokens
- Basic user CRUD operations

This change adds email invitations, session revocation, activity tracking, and enhanced UI for managing team members.

## Goals / Non-Goals

### Goals
- Provide complete user lifecycle management (invite, activate, change roles, deactivate)
- Send professional email invitations with secure, expiring tokens
- Track meaningful user activity for monitoring and audit purposes
- Immediately revoke access when users are deactivated or roles change
- Support configurable domain restrictions for invitations

### Non-Goals
- Invitation acceptance UI/flow (handled in separate story)
- User self-service role requests
- Advanced activity analytics or dashboards
- Multi-workspace support
- Bulk user operations

## Decisions

### 1. Email Service: Resend
**Decision:** Use Resend for transactional emails

**Rationale:**
- Simple, developer-friendly API
- Good deliverability and reputation
- React Email integration for HTML templates
- Already configured (`RESEND_API_KEY` added to .env)

**Alternatives considered:**
- SendGrid: More complex setup, overkill for current needs
- AWS SES: Requires AWS infrastructure, more configuration
- Nodemailer: Requires SMTP server setup and maintenance

### 2. Session Revocation: Redis Token Blacklist
**Decision:** Use Redis to maintain a blacklist of revoked JWT tokens

**Rationale:**
- JWT tokens are stateless; cannot be revoked without external state
- Redis provides fast, in-memory lookups with TTL support
- Tokens only need to be blacklisted until their natural expiration
- Minimal performance impact with proper middleware placement

**Architecture:**
```
Key pattern: `blacklist:jwt:{jti}`
Value: { userId, reason, revokedAt }
TTL: JWT expiration time - revoked time
```

**Alternatives considered:**
- Session version in database: Requires DB query on every request
- Short-lived tokens + refresh tokens: Major auth system refactor
- Token introspection endpoint: Network overhead on every request

**Implementation strategy:**
- Add `jti` (JWT ID) claim to all new tokens
- Check blacklist in JWT auth guard before validating user
- Blacklist all active user sessions on deactivation or role change

### 3. Invitation Token Storage
**Decision:** Create `UserInvitation` table with secure random tokens

**Schema:**
```prisma
model UserInvitation {
  id        Int      @id @default(autoincrement())
  userId    Int      @unique
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Rationale:**
- Separate concerns: User record vs invitation state
- Allows multiple invitations per user (resend scenario)
- Token can be securely generated and validated independently
- Easy to clean up expired invitations

**Security:**
- Use `crypto.randomBytes(32).toString('base64url')` for tokens
- Tokens are one-time use (deleted on acceptance)
- Server-side expiration validation

### 4. Activity Tracking: Middleware Approach
**Decision:** Implement Express middleware to update `lastSeenAt` on meaningful actions

**Meaningful actions defined as:**
- POST, PUT, PATCH, DELETE requests (mutations)
- GET requests to `/audit/export` and similar export endpoints
- Excludes: GET requests for data retrieval, health checks, static assets

**Rationale:**
- Middleware is framework-appropriate and composable
- Throttling can be added easily (e.g., update max once per 5 minutes)
- Minimal performance impact (async DB update)
- Clear separation of concerns

**Implementation:**
```typescript
// Pseudo-code
if (isAuthenticated && isMeaningfulAction(req)) {
  // Fire-and-forget update
  prisma.user.update({
    where: { id: userId },
    data: { lastSeenAt: new Date() }
  }).catch(err => logger.error('Failed to update lastSeenAt', err))
}
```

### 5. Domain Restriction: Environment Variable
**Decision:** Use comma-separated `ALLOWED_INVITE_DOMAINS` environment variable

**Format:** `ALLOWED_INVITE_DOMAINS=milkyway-agency.com,partner-agency.com`

**Rationale:**
- Simple configuration without code changes
- Can be updated per environment (dev/staging/prod)
- Validation happens in service layer with clear error messages
- Future migration path to database-stored settings if needed

**Validation logic:**
```typescript
const allowedDomains = process.env.ALLOWED_INVITE_DOMAINS?.split(',').map(d => d.trim())
const inviterDomain = inviterEmail.split('@')[1]
if (!allowedDomains?.includes(inviterDomain)) {
  throw new ForbiddenException('Invitations restricted to authorized domains')
}
```

### 6. Role Change Behavior
**Decision:** Role changes work for both ACTIVE and INVITED users; session revocation only for ACTIVE users

**Rationale:**
- INVITED users don't have active sessions yet
- Allows admins to correct mistakes before user accepts invitation
- Transparent experience: UI doesn't need to distinguish between states
- When INVITED user accepts, they get the updated role immediately

## Risks / Trade-offs

### Risk: Redis Dependency
**Impact:** New infrastructure dependency for session management

**Mitigation:**
- Use Redis only for blacklist (auth still works if Redis is temporarily down, just can't revoke)
- Implement graceful degradation: log errors but don't block requests
- Document Redis setup in deployment guide
- Consider managed Redis (AWS ElastiCache, Redis Cloud) for production

### Risk: Email Deliverability
**Impact:** Invitation emails may go to spam or fail to deliver

**Mitigation:**
- Use Resend's verified domain feature
- Include clear "from" address and reply-to
- Implement invitation resend capability
- Add audit logging for all invitation emails sent
- Monitor Resend webhook for bounces and complaints

### Risk: Race Conditions on Role Change
**Impact:** User might complete an action while role is being changed

**Mitigation:**
- Use database transactions for role updates
- Session revocation happens immediately after role change commits
- Short window (~100ms) acceptable for admin panel use case
- Audit log captures exact timing of role changes

### Trade-off: Activity Tracking Granularity
**Decision:** Only track meaningful actions, not every GET request

**Trade-off:**
- Pro: Lower database write load, more accurate "active user" metric
- Con: May miss some user engagement (e.g., heavily browsing without mutations)
- Acceptable: Admin panel is action-oriented; viewing data without acting is low signal

## Migration Plan

### Phase 1: Database Schema
1. Add `UserInvitation` table via Prisma migration
2. Backfill existing INVITED users with expired tokens (optional, for data consistency)

### Phase 2: Infrastructure
1. Set up Redis instance (local for dev, managed for prod)
2. Add Redis connection to NestJS app module
3. Test Redis connectivity and failover behavior

### Phase 3: Backend Implementation
1. Email service with Resend integration
2. Session revocation middleware
3. Activity tracking middleware
4. Enhanced user service methods
5. New API endpoints

### Phase 4: Frontend Implementation
1. Enhanced user list with roles and activity columns
2. Role change dropdown/modal
3. Resend invitation button
4. Improved deactivate confirmation

### Rollback Plan
- Remove new middlewares from app module
- Revert database migration (tokens table can be dropped safely)
- Switch DNS or remove Resend API key to stop emails
- Frontend gracefully degrades (hides new features based on API capabilities)

## Open Questions

### Q1: Should we implement invitation email templates with React Email?
**Context:** Resend works well with React Email for maintainable HTML templates

**Recommendation:** Yes, create simple React Email template. Low effort, high polish.

### Q2: How to handle "Total Active Users" count with TBD definition?
**Recommendation:** Use simple definition for v1: users with `status = 'ACTIVE'`. Add filter UI later for "active in last N days" when definition is clarified.

### Q3: Should resend invitation generate a new token or reuse existing?
**Recommendation:** Generate new token, delete old one. Security best practice: minimize token lifespan exposure.

### Q4: Display role in user list as single "Primary Role" or all roles?
**Recommendation:** Display all roles as badges/pills (user can have multiple roles via UserRole junction table). Most accurate representation.
