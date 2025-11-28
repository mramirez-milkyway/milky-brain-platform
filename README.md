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
- Next.js 14/15 (App Router)
- React 18/19
- TanStack Query
- Zustand
- TailwindCSS 3/4
- TailAdmin V2 Design System
- TypeScript

**Infrastructure:**
- Turborepo (monorepo)
- Docker & Docker Compose
- PostgreSQL
- Terraform + Terragrunt (AWS provisioning)
- AWS (EC2, RDS, ElastiCache, ECR, ALB, Route53)
- GitHub Actions (CI/CD)

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
│   └── web-admin/                    # Next.js Frontend (TailAdmin V2)
│       ├── src/
│       │   ├── app/
│       │   │   ├── login/            # Login page
│       │   │   ├── app/              # Main application dashboard
│       │   │   ├── (admin)/          # Admin routes with sidebar
│       │   │   └── (full-width-pages)/ # Auth & error pages
│       │   ├── components/           # TailAdmin V2 components
│       │   ├── layout/               # Sidebar, Header, etc.
│       │   ├── icons/                # SVG icons
│       │   ├── hooks/                # Custom hooks
│       │   ├── context/              # React contexts
│       │   └── utils/                # Utilities
│       └── package.json
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

## Frontend Design System: TailAdmin V2

### System Design Selection

We have selected **TailAdmin V2** as our frontend design system for the following reasons:

#### Why TailAdmin V2?

1. **Modern & Professional Design**
   - Clean, contemporary UI that aligns with modern admin panel standards
   - Professional color schemes and typography
   - Consistent design language across all components

2. **Comprehensive Component Library**
   - 100+ pre-built React components
   - Advanced charts (ApexCharts integration)
   - Form elements with validation
   - Data tables with sorting, filtering, pagination
   - Modals, dropdowns, notifications, and more
   - Calendar, file upload, rich text editors

3. **Built for Next.js & React**
   - Next.js 15 with App Router support
   - React 19 compatible
   - Server and Client Components
   - Optimized for performance

4. **TailwindCSS 4.0**
   - Modern utility-first CSS framework
   - Easy to customize and extend
   - Responsive design out of the box
   - Dark mode support included

5. **TypeScript First**
   - Fully typed components
   - Better IDE support and autocomplete
   - Fewer runtime errors

6. **Responsive & Accessible**
   - Mobile-first responsive design
   - Collapsible sidebar for mobile devices
   - Keyboard navigation support
   - WCAG compliance considerations

7. **Perfect Fit for Our Tech Stack**
   - Integrates seamlessly with TanStack Query
   - Works well with Zustand for state management
   - Uses Axios for HTTP requests (already in our stack)
   - Follows SOLID principles and component isolation

8. **Rapid Development**
   - Pre-built layouts for common admin pages
   - Reduces development time by 60-70%
   - Focus on business logic instead of UI primitives
   - Easy to customize and extend

### Implementation Approach

We've created a separate `web-admin` app to:
- Test and validate TailAdmin V2 integration
- Ensure all components work in our monorepo
- Provide a clean migration path from the existing `web` app
- Allow parallel development while maintaining existing functionality

### Available Routes

**Public Routes:**
- `/login` - Authentication page with Google SSO integration

**Protected Routes (with sidebar navigation):**
- `/app` - Main dashboard with metrics and activity
- `/` - TailAdmin demo dashboard (e-commerce example)
- Multiple pre-built pages for future feature integration

### Key Features

- **Persistent Left Sidebar** with collapsible menu
- **Account Dropdown** with user profile and settings
- **Responsive Design** that adapts to mobile, tablet, and desktop
- **Dark Mode** toggle
- **Search Functionality** (Cmd+K)
- **Notification System**
- **Customizable Themes**

### Running the New Design System

```bash
# Start the TailAdmin V2 app
make web-admin

# Or directly
cd apps/web-admin && npm run dev
```

The app will be available at http://localhost:3000 (or next available port).

### Next Steps

1. Integrate with API backend
2. Implement authentication flow
3. Migrate existing features from `web` app
4. Add RBAC-aware navigation
5. Customize theme to match brand guidelines

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

## Infrastructure & Deployment

The application uses **Terraform + Terragrunt** for Infrastructure as Code on AWS.

### Quick Start

```bash
# Initialize infrastructure for QA
make infra-init ENV=qa
make infra-plan ENV=qa
make infra-apply ENV=qa

# Sync secrets to AWS Secrets Manager
make sync-secrets ENV=qa

# Build and push Docker images
make docker-build-all
aws ecr get-login-password --region eu-south-2 | docker login --username AWS --password-stdin <ECR_REGISTRY>
make docker-push-all ECR_REGISTRY=<your-ecr-registry>

# Deploy application (via GitHub Actions or SSH)
# SSH to EC2 instance and run:
cd /opt/app && ./deploy.sh
```

### Infrastructure Components

- **VPC**: Public/private subnets across 2 AZs
- **EC2**: Application servers with Docker
- **RDS**: PostgreSQL 15 database
- **ElastiCache**: Redis for caching
- **ECR**: Container image registry
- **ALB**: Application Load Balancer
- **Route53**: DNS management (optional)
- **ACM**: SSL certificates (optional)
- **Secrets Manager**: Secure secrets storage
- **CloudWatch**: Logging and monitoring

### Environments

**QA Environment:**
- Cost-optimized (single AZ, smaller instances)
- Auto-deploy on push to `develop` branch
- Subdomain: `qa.yourdomain.com`

**Production Environment:**
- High availability (Multi-AZ, larger instances)
- Manual approval for deployments
- Domain: `yourdomain.com` or `prod.yourdomain.com`

### Documentation

- [Infrastructure README](infrastructure/README.md) - Complete infrastructure guide
- [Terraform Modules](infrastructure/modules/) - Reusable infrastructure modules

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
- [Infrastructure Guide](infrastructure/README.md) - AWS deployment guide
- [PRD](docs/prds/central-admin-panel-shell.prd.md) - Product requirements

## License

Proprietary - Internal use only

## Support

For issues or questions, contact the platform team.
