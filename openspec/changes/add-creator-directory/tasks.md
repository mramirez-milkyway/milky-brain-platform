## 1. API - Creators Module
- [x] 1.1 Create `apps/api/src/creators/creators.module.ts`
- [x] 1.2 Create `apps/api/src/creators/creators.repository.ts` with findAll and findById methods
- [x] 1.3 Create `apps/api/src/creators/creators.service.ts` with pagination and detail logic
- [x] 1.4 Create `apps/api/src/creators/creators.controller.ts` with GET /creators and GET /creators/:id
- [x] 1.5 Create `apps/api/src/creators/dto/index.ts` with query and response DTOs
- [x] 1.6 Register CreatorsModule in `apps/api/src/app.module.ts`

## 2. Permissions
- [x] 2.1 Add `creator:Read` permission to seed data
- [x] 2.2 Assign permission to appropriate roles

## 3. Frontend - List View
- [x] 3.1 Update `apps/web-admin/src/app/influencers/page.tsx` to fetch from /creators
- [x] 3.2 Remove "Mock Data" badge and test messaging
- [x] 3.3 Update table columns for Creator fields (Name, Country, Categories, Socials)
- [x] 3.4 Make table rows clickable with navigation to detail view
- [x] 3.5 Update TypeScript interfaces for Creator data

## 4. Frontend - Detail View
- [x] 4.1 Create `apps/web-admin/src/app/influencers/[id]/page.tsx`
- [x] 4.2 Implement data fetching with TanStack Query
- [x] 4.3 Display Basic Info section (fullName, gender, country, city, email, phone)
- [x] 4.4 Display Social Accounts section with platform icons
- [x] 4.5 Display Professional section (characteristics, pastClients, pastCampaigns)
- [x] 4.6 Display Agency section (agencyName, managerName, billingInfo)
- [x] 4.7 Display Status section (isActive, isBlacklisted)
- [x] 4.8 Add back button to return to list
- [x] 4.9 Add PermissionGuard with creator:Read

## 5. Navigation
- [x] 5.1 Update sidebar permission from influencer:Read to creator:Read

## 6. Testing & Validation
- [ ] 6.1 Verify list view displays real Creator data with pagination
- [ ] 6.2 Verify clicking row navigates to detail view
- [ ] 6.3 Verify detail view shows all Creator fields
- [ ] 6.4 Verify back button returns to list
- [ ] 6.5 Verify permission restrictions work correctly
