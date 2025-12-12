# Change: Add Creator Directory (List & Detail View)

## Why
Users need to browse and view detailed information about creators (influencers) that have been imported into the system. Currently, the `/influencers` page uses mock data and the legacy `Influencer` model. The comprehensive `Creator` model (used by the import process) provides richer data including social accounts, agency info, and campaign history.

## What Changes
- Create new API module for Creator entity with list and detail endpoints
- Replace mock data on `/influencers` page with real Creator data
- Add detail view at `/influencers/[id]` showing complete creator profile
- Add `creator:Read` permission for access control

## Impact
- Affected specs: Creates new `creator-directory` capability
- Affected code:
  - `apps/api/src/creators/` - New module (controller, service, repository, DTOs)
  - `apps/api/src/app.module.ts` - Register CreatorsModule
  - `apps/api/prisma/seed.ts` - Add creator:Read permission
  - `apps/web-admin/src/app/influencers/page.tsx` - Update to use Creator API
  - `apps/web-admin/src/app/influencers/[id]/page.tsx` - New detail page
  - `apps/web-admin/src/layout/AppSidebar.tsx` - Update permission
