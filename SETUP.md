# Setup Guide - User Management Feature

## Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ installed
- pnpm or npm

## Quick Start

### 1. Start Infrastructure Services

Start PostgreSQL and Redis:

```bash
# Start both postgres and redis
docker-compose up -d postgres redis

# Verify they're running
docker-compose ps

# Check logs if needed
docker-compose logs postgres
docker-compose logs redis
```

### 2. Run Database Migrations

```bash
cd apps/api

# Run the migration to create UserInvitation table
npm run prisma:migrate -- --name add_user_invitations

# This will:
# - Create the user_invitations table
# - Generate Prisma client with the new model
```

### 3. Start the API Server

```bash
cd apps/api
npm run dev
```

The API should start successfully on `http://localhost:4000/api`

You should see:
```
✅ Email service initialized
✅ Redis connected successfully
✅ All routes registered
🚀 API running on http://localhost:4000/api
```

### 4. Start the Web App

In a new terminal:

```bash
cd apps/web
npm run dev
```

The web app will be available at `http://localhost:3000`

## Available Migration Commands

From `apps/api/` directory:

```bash
# Create a new migration (dev)
npm run prisma:migrate -- --name your_migration_name

# Apply migrations (production)
npm run prisma:migrate:deploy

# Reset database (WARNING: deletes all data)
npm run prisma:migrate:reset

# Open Prisma Studio to view data
npm run prisma:studio

# Regenerate Prisma Client after schema changes
npm run prisma:generate
```

## Environment Variables

All required variables are already set in `.env`:

```bash
# Database
DATABASE_URL=postgresql://admin:admin123@localhost:5432/admin_panel

# Redis (for session management)
REDIS_URL=redis://localhost:6379

# Email (Resend)
RESEND_API_KEY=re_URWG6Yis_9DZ7fGq6WZDwGLXjWiXDiTUZ
FROM_EMAIL=noreply@milkyway-agency.com

# Invitation Settings
ALLOWED_INVITE_DOMAINS=milkyway-agency.com
INVITATION_EXPIRY_DAYS=30
```

## Testing the User Management Feature

### 1. Login
Navigate to `http://localhost:3000` and login with Google OAuth

### 2. Access User Management
Go to `http://localhost:3000/users` (Admin only)

### 3. Test Features

**Invite a User:**
- Click "Invite User"
- Enter email and select a role
- Check that email is sent (logs will show this)
- Note: Only users with `@milkyway-agency.com` can send invites

**View User List:**
- See all users with their roles
- Check "Last Activity" timestamps
- See green dots for recently active users (< 1 hour)
- View "Total Active Users" count

**Resend Invitation:**
- For users with "INVITED" status
- Click "Resend Invite"
- New token generated, email sent

**Deactivate User:**
- For ACTIVE users
- Click "Deactivate"
- Confirm in modal
- User sessions immediately revoked
- User can no longer login

## Troubleshooting

### Database connection failed
```bash
# Check if postgres is running
docker-compose ps postgres

# Restart postgres
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Redis connection failed
```bash
# Check if redis is running
docker-compose ps redis

# Restart redis
docker-compose restart redis

# Check logs
docker-compose logs redis
```

### Migration fails
```bash
# Make sure database is running first
docker-compose up -d postgres

# Wait a few seconds for postgres to be ready
sleep 5

# Try migration again
cd apps/api
npm run prisma:migrate -- --name add_user_invitations
```

### Email not sending
- Check `RESEND_API_KEY` in `.env`
- Check API logs for email errors
- Verify domain is configured in Resend dashboard

### Session revocation not working
- Make sure Redis is running
- Check `REDIS_URL` in `.env`
- Look for Redis connection errors in API logs

## Architecture Overview

### New Components Added

**Backend:**
- `RedisService` - Session management with graceful degradation
- `SessionService` - JWT blacklisting and session tracking
- `EmailService` - Resend integration with HTML templates
- `ActivityTrackingMiddleware` - Tracks meaningful user actions
- `UserInvitation` model - Secure token storage with expiration

**Frontend:**
- Enhanced Users page with role badges
- Last activity tracking with relative time
- Activity indicators for recent users
- Invitation resend capability
- Deactivation confirmation modal

### Key Features
✅ Email invitations with 30-day expiring tokens
✅ Domain-restricted invitations (configurable)
✅ Immediate session revocation (Redis blacklist)
✅ Activity tracking with 5-minute throttling
✅ Role management with automatic session revocation
✅ Self-deactivation prevention
✅ Transaction-safe invitation flow

## Next Steps

1. Configure your Resend domain for production
2. Update `ALLOWED_INVITE_DOMAINS` for your organization
3. Set up Redis in production (AWS ElastiCache, Redis Cloud, etc.)
4. Add monitoring for Redis and email delivery
5. Implement invitation acceptance flow (separate story)
