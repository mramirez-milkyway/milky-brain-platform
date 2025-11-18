# NestJS + NextJS Implementation Guide
## Central Admin Panel Shell V1

This guide provides the complete architecture and implementation approach for rebuilding the admin panel with NestJS + NextJS in a Turborepo monorepo.

---

## Project Structure

```
milky_way_admin_panel/
├── apps/
│   ├── api/                     # NestJS backend
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── prisma/          # Prisma service
│   │   │   ├── auth/            # Auth module (Google OAuth, JWT)
│   │   │   ├── users/           # Users CRUD
│   │   │   ├── roles/           # Roles management
│   │   │   ├── policies/        # IAM policies
│   │   │   ├── settings/        # Settings management
│   │   │   ├── audit/           # Audit logging
│   │   │   ├── notifications/   # Notifications
│   │   │   ├── common/          # Shared (guards, decorators, interceptors)
│   │   │   └── jobs/            # BullMQ job processors
│   │   ├── prisma/
│   │   │   └── schema.prisma    # ✅ Already created
│   │   ├── test/
│   │   └── package.json
│   └── web/                     # NextJS frontend
│       ├── app/                 # App router
│       │   ├── (auth)/
│       │   │   └── login/
│       │   ├── (dashboard)/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   ├── users/
│       │   │   ├── roles/
│       │   │   ├── policies/
│       │   │   ├── settings/
│       │   │   ├── notifications/
│       │   │   └── audit/
│       │   └── api/             # Minimal - only for proxying if needed
│       ├── components/
│       ├── lib/
│       │   ├── api-client.ts
│       │   ├── auth-store.ts    # Zustand
│       │   └── react-query.ts
│       ├── test/
│       └── package.json
├── packages/
│   ├── config/                  # Shared ESLint, TS configs
│   ├── types/                   # Shared TypeScript types
│   └── utils/                   # Shared utilities
├── package.json                 # Root package.json
├── turbo.json                   # ✅ Already created
├── docker-compose.yml
├── Makefile
└── .env.example
```

---

## Backend Implementation (NestJS)

### 1. Prisma Setup

**Already created:** `apps/api/prisma/schema.prisma` with all V1 models

**Initialize:**
```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
```

**Prisma Service (`src/prisma/prisma.service.ts`):**
```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

---

### 2. Auth Module (Google OAuth + JWT)

**Structure:**
```
src/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   ├── google.strategy.ts
│   └── jwt.strategy.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── permission.guard.ts
├── decorators/
│   ├── current-user.decorator.ts
│   └── require-permission.decorator.ts
└── dto/
    └── auth.dto.ts
```

**Google Strategy:**
```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { emails, displayName } = profile;
    const user = {
      email: emails[0].value,
      name: displayName,
    };
    done(null, user);
  }
}
```

**JWT Strategy:**
```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.['access_token'];
        },
      ]),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

**Auth Controller:**
```typescript
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const token = await this.authService.login(req.user);
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60 * 1000, // 12 hours
    });
    res.redirect(process.env.FRONTEND_URL);
  }

  @Post('logout')
  async logout(@Res() res) {
    res.clearCookie('access_token');
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user) {
    return this.authService.getMe(user.userId);
  }
}
```

---

### 3. RBAC Implementation

**Permission Guard (`src/common/guards/permission.guard.ts`):**
```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../services/rbac.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>(
      'permission',
      context.getHandler(),
    );
    
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    const hasPermission = await this.rbacService.checkPermission(
      user.userId,
      requiredPermission,
      'res:*',
    );

    return hasPermission;
  }
}
```

**Permission Decorator:**
```typescript
import { SetMetadata } from '@nestjs/common';

export const RequirePermission = (permission: string) =>
  SetMetadata('permission', permission);
```

**RBAC Service:**
```typescript
@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  async checkPermission(
    userId: number,
    action: string,
    resource: string,
  ): Promise<boolean> {
    // Get user with roles and policies
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePolicies: {
                  include: { policy: true },
                },
              },
            },
          },
        },
        userPolicies: {
          include: { policy: true },
        },
      },
    });

    // Collect all policies
    const policies = [
      ...user.userRoles.flatMap((ur) =>
        ur.role.rolePolicies.map((rp) => rp.policy),
      ),
      ...user.userPolicies.map((up) => up.policy),
    ];

    // Evaluate policies (default deny)
    let hasAllow = false;
    let hasDeny = false;

    for (const policy of policies) {
      const statements = policy.statements as any[];
      for (const statement of statements) {
        if (
          this.matchesPattern(action, statement.Actions) &&
          this.matchesPattern(resource, statement.Resources)
        ) {
          if (statement.Effect === 'Allow') hasAllow = true;
          if (statement.Effect === 'Deny') hasDeny = true;
        }
      }
    }

    return hasDeny ? false : hasAllow;
  }

  private matchesPattern(value: string, patterns: string[]): boolean {
    return patterns.some((pattern) => {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(value);
    });
  }
}
```

---

### 4. Audit Logging

**Audit Service:**
```typescript
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    actorId: number;
    action: string;
    entityType: string;
    entityId?: string;
    beforeState?: any;
    afterState?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // Get previous hash for chain
    const lastEvent = await this.prisma.auditEvent.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const prevHash = lastEvent?.hash || null;

    // Compute hash
    const hash = this.computeHash({
      ...params,
      prevHash,
    });

    return this.prisma.auditEvent.create({
      data: {
        ...params,
        hash,
        prevHash,
      },
    });
  }

  private computeHash(data: any): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }
}
```

**Audit Interceptor:**
```typescript
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;

    // Only audit mutating operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => {
        await this.auditService.log({
          actorId: user.userId,
          action: `${method} ${request.url}`,
          entityType: 'API',
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });
      }),
    );
  }
}
```

---

### 5. Module Example: Users

**users.controller.ts:**
```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @RequirePermission('user:Read')
  async findAll() {
    return this.usersService.findAll();
  }

  @Post('invite')
  @RequirePermission('user:Create')
  async invite(@Body() inviteDto: InviteUserDto) {
    return this.usersService.invite(inviteDto);
  }

  @Patch(':id')
  @RequirePermission('user:Update')
  async update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.usersService.update(+id, updateDto);
  }
}
```

---

## Frontend Implementation (NextJS)

### 1. Package.json

```json
{
  "name": "@milky-way/web",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest"
  },
  "dependencies": {
    "next": "^14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.4.7",
    "axios": "^1.6.2"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "@types/react": "^18.2.46",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "typescript": "^5.3.3"
  }
}
```

### 2. Auth Store (Zustand)

**lib/auth-store.ts:**
```typescript
import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

### 3. API Client

**lib/api-client.ts:**
```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
```

### 4. React Query Setup

**lib/react-query.ts:**
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});
```

### 5. Layout with Navigation

**app/(dashboard)/layout.tsx:**
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

export default function DashboardLayout({ children }) {
  const { data: navData } = useQuery({
    queryKey: ['navigation'],
    queryFn: async () => {
      const res = await apiClient.get('/navigation');
      return res.data;
    },
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        {/* Top bar */}
      </header>
      <div className="flex">
        <nav className="w-64 bg-white shadow-sm min-h-screen">
          {navData?.navigation.map((item) => (
            <Link
              key={item.id}
              href={item.path}
              className="block px-6 py-3 hover:bg-gray-50"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
```

---

## Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: admin_panel
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build: ./apps/api
    environment:
      DATABASE_URL: postgresql://admin:admin123@postgres:5432/admin_panel
      REDIS_HOST: redis
      JWT_SECRET: your-secret-key
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
    ports:
      - "4000:4000"
    depends_on:
      - postgres
      - redis
    volumes:
      - ./apps/api:/app

  web:
    build: ./apps/web
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000/api
    ports:
      - "3000:3000"
    depends_on:
      - api
    volumes:
      - ./apps/web:/app

volumes:
  postgres_data:
```

---

## Makefile

```makefile
.PHONY: help dev build test clean

help:
	@echo "Available commands:"
	@echo "  make dev           - Start development environment"
	@echo "  make build         - Build all apps"
	@echo "  make test          - Run all tests"
	@echo "  make migrate       - Run database migrations"
	@echo "  make clean         - Clean all node_modules"

dev:
	docker-compose up

build:
	npm run build

test:
	npm run test

migrate:
	cd apps/api && npx prisma migrate dev

clean:
	npm run clean
```

---

## Next Steps

1. **Install dependencies:** `npm install` at root
2. **Generate Prisma client:** `cd apps/api && npx prisma generate`
3. **Run migrations:** `cd apps/api && npx prisma migrate dev --name init`
4. **Start services:** `make dev` or `docker-compose up`
5. **Access:** Frontend at http://localhost:3000, API at http://localhost:4000

This guide provides the complete architecture. Implement modules incrementally following the NestJS module pattern and NextJS app router conventions.
