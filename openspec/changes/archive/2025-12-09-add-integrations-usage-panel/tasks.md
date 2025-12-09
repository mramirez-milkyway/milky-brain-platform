# Implementation Tasks

## 1. Backend Implementation
- [x] 1.1 Create `apps/api/src/integrations/` module structure
- [x] 1.2 Create DTOs for integration usage response
- [x] 1.3 Implement `IntegrationsService` with IMAI API client
- [x] 1.4 Implement `IntegrationsController` with `integration:Read` guard
- [x] 1.5 Add `IMAI_API_KEY` and `IMAI_API_BASE_URL` to `.env.example`
- [x] 1.6 Register `IntegrationsModule` in `app.module.ts`
- [x] 1.7 Write unit tests for service and controller

## 2. Frontend Implementation
- [x] 2.1 Create `apps/web-admin/src/app/integrations/` directory
- [x] 2.2 Create `page.tsx` with TanStack Query integration
- [x] 2.3 Create `layout.tsx` for integrations section
- [x] 2.4 Create quota display component with progress bar
- [x] 2.5 Add error handling and loading states
- [x] 2.6 Wrap page in `PermissionGuard` with `integration:Read`
- [x] 2.7 Write unit tests for components

## 3. Navigation & Permissions
- [x] 3.1 Add "Integrations" nav item to `AppSidebar.tsx`
- [x] 3.2 Add `integration:Read` permission to admin role seeder
- [x] 3.3 Update permission types in `auth-store.ts`

## 4. Documentation & Validation
- [x] 4.1 Update `.env.example` with IMAI credentials
- [x] 4.2 Validate proposal with `openspec validate add-integrations-usage-panel --strict`
- [x] 4.3 Test end-to-end flow with real IMAI API
