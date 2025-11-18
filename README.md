# Milky Way Admin Panel
## Central Admin Panel Shell V1 - NestJS + NextJS

A comprehensive, secure admin panel system with IAM-like RBAC, audit logging, and multi-module support built with **NestJS** and **NextJS** in a **Turborepo** monorepo.

## Tech Stack

**Backend:**
- NestJS (REST API)
- Prisma ORM
- PostgreSQL
- Passport (Google OAuth + JWT)
- TypeScript

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TanStack Query
- Zustand
- TailwindCSS
- TypeScript

**Infrastructure:**
- Turborepo (monorepo)
- Docker & Docker Compose
- PostgreSQL

## Features

### Core Features (V1)
- ✅ **Google SSO Authentication** with domain whitelisting
- ✅ **IAM-like RBAC** with policy-based access control
- ✅ **Tamper-evident Audit Logging** with SHA-256 hash chaining
- ✅ **Role Management** (Admin, Manager, Contributor, ReadOnly)
- ✅ **User Management** with invite flow
- ✅ **Settings Management** (Organization, Security)
- ✅ **Notifications System**
- ✅ **Security Hardening** (JWT, rate limiting, Helmet)
- ✅ **Role-aware Navigation**

## Project Structure

```
milky_way_admin_panel/
├── apps/
│   ├── api/                          # NestJS Backend
│   │   ├── src/
│   │   │   ├── auth/                 # Google OAuth + JWT
│   │   │   ├── users/                # User CRUD
│   │   │   ├── roles/                # Role management
│   │   │   ├── policies/             # IAM policies
│   │   │   ├── settings/             # Settings
│   │   │   ├── audit/                # Audit log
│   │   │   ├── notifications/        # Notifications
│   │   │   ├── navigation/           # Role-aware nav
│   │   │   ├── common/               # Guards, decorators, services
│   │   │   │   ├── guards/           # Permission guard
│   │   │   │   ├── decorators/       # @RequirePermission, @CurrentUser
│   │   │   │   └── services/         # RbacService, AuditService
│   │   │   ├── prisma/               # Prisma service
│   │   │   ├── main.ts
│   │   │   └── app.module.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma         # All V1 models
│   │   ├── package.json
│   │   └── Dockerfile
│   └── web/                          # Next.js Frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── login/            # Login page
│       │   │   ├── (dashboard)/      # Protected routes
│       │   │   │   ├── layout.tsx    # Main layout
│       │   │   │   ├── page.tsx      # Dashboard
│       │   │   │   ├── users/
│       │   │   │   ├── roles/
│       │   │   │   ├── policies/
│       │   │   │   ├── settings/
│       │   │   │   ├── notifications/
│       │   │   │   └── audit/
│       │   │   ├── globals.css
│       │   │   ├── layout.tsx
│       │   │   └── providers.tsx
│       │   ├── components/
│       │   └── lib/
│       │       ├── api-client.ts     # Axios instance
│       │       └── auth-store.ts     # Zustand store
│       ├── package.json
│       └── Dockerfile
├── packages/                         # Shared packages
│   ├── config/
│   ├── types/
│   └── utils/
├── docker-compose.yml
├── Makefile
├── turbo.json
├── package.json
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- Google OAuth credentials

### 1. Clone and Setup

```bash
git clone <repository-url>
cd milky_way_admin_panel
cp .env.example .env
# Edit .env with your Google OAuth credentials
```

### 2. Install Dependencies

```bash
make install
# or
npm install
```

### 3. Start Development Environment

```bash
make dev
# or
docker-compose up
```

### 4. Run Migrations

In a new terminal:

```bash
make migrate
# or
cd apps/api && npx prisma migrate dev
```

### 5. Initialize Database

```bash
make db-init
```

### 6. Access the Application

- **Frontend:** http://localhost:3000
- **API:** http://localhost:4000/api
- **Prisma Studio:** `make db-studio`

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:4000/api/auth/google/callback` (dev)
   - `https://yourdomain.com/api/auth/google/callback` (prod)
6. Copy Client ID and Secret to `.env`

## Development

### Backend (NestJS)

```bash
# Run locally
make api
# or
cd apps/api && npm run dev

# Generate Prisma client
cd apps/api && npx prisma generate

# Create migration
cd apps/api && npx prisma migrate dev --name migration_name

# Open Prisma Studio
make db-studio
```

### Frontend (Next.js)

```bash
# Run locally
make web
# or
cd apps/web && npm run dev
```

## Prisma Schema

The database includes 15 models:
- `User` - User accounts
- `Role` - User roles (Admin, Manager, etc.)
- `UserRole` - Many-to-many user-role relationship
- `Policy` - IAM-like access policies
- `RolePolicy` - Role-policy associations
- `UserPolicy` - User-specific policy overrides
- `Workspace` - Organization settings
- `Setting` - Versioned configuration
- `Integration` - Third-party integrations
- `AuditEvent` - Tamper-evident audit trail
- `Job` - Background job tracking (future)
- `ExportLog` - Export governance
- `Notification` - In-app notifications
- `FeatureFlag` - Feature toggles
- `FeatureFlagOverride` - Role/user overrides

## RBAC System

IAM-like policy-based access control:

- **Resources:** `res:{module}:{type}/{id}`
- **Actions:** `user:Read`, `role:Create`, `*`
- **Policies:** JSON statements with `{Effect, Actions[], Resources[], Conditions?}`
- **Default-deny** with explicit allow
- **Wildcards:** `*`, `user:*`, `res:*`

### Default Roles

- **Admin:** Full system access (`*` on `*`)
- **Manager:** Manage modules and data
- **Contributor:** Day-to-day work
- **ReadOnly:** Browse and search only

## API Endpoints

### Auth
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/me/permissions` - Get user permissions

### Users
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `POST /api/users/invite` - Invite user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user
- `GET /api/users/:id/roles` - Get user roles
- `POST /api/users/:userId/roles/:roleId` - Assign role
- `DELETE /api/users/:userId/roles/:roleId` - Remove role

### Roles
- `GET /api/roles` - List roles
- `POST /api/roles` - Create role
- `PATCH /api/roles/:id` - Update role

### Policies
- `GET /api/policies` - List policies
- `POST /api/policies` - Create policy

### Settings
- `GET /api/settings/org` - Get org settings
- `PATCH /api/settings/org` - Update org settings

### Audit
- `GET /api/audit` - List audit events (with filters)

### Notifications
- `GET /api/notifications` - List notifications
- `POST /api/notifications/:id/read` - Mark as read
- `GET /api/notifications/unread-count` - Get unread count

### Navigation
- `GET /api/navigation` - Get role-aware navigation

## Makefile Commands

```bash
make help          # Show all commands
make install       # Install dependencies
make dev           # Start development environment
make migrate       # Run database migrations
make db-init       # Initialize default roles/policies
make db-reset      # Reset database (WARNING: destroys data)
make db-studio     # Open Prisma Studio
make test          # Run all tests
make lint          # Lint all code
make format        # Format all code
make clean         # Clean temporary files
make docker-clean  # Clean Docker containers/volumes
```

## Testing

```bash
# Run all tests
make test

# Run backend tests
cd apps/api && npm run test

# Run frontend tests
cd apps/web && npm run test
```

## Production Deployment

### Checklist

- [ ] Change `JWT_SECRET` to strong random value
- [ ] Set up managed PostgreSQL (RDS, Cloud SQL, etc.)
- [ ] Configure proper Google OAuth redirect URLs
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and logging
- [ ] Configure backup and disaster recovery

### Build for Production

```bash
npm run build
```

## Security Features

- ✅ Google SSO with domain whitelist
- ✅ JWT authentication with HTTP-only cookies
- ✅ Rate limiting (50 requests/minute)
- ✅ Helmet.js security headers
- ✅ IAM-like RBAC with default-deny
- ✅ Audit logging with tamper-evident hashing
- ✅ Password-less authentication
- ✅ Session management

## Contributing

Follow the rules in `AGENTS.md`:
- Backend: NestJS + Prisma ORM + PostgreSQL
- Frontend: Next.js + TanStack Query + Zustand + TailwindCSS
- SOLID principles, no library coupling
- Unit tests mandatory
- No hardcoded secrets
- Migrations must be idempotent

## Documentation

- [AGENTS.md](AGENTS.md) - Development rules and guidelines
- [PRD](docs/prds/central-admin-panel-shell.prd.md) - Product requirements

## License

Proprietary - Internal use only

## Support

For issues or questions, contact the platform team.
