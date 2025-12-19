# Tasks: Manage Influencers

## 1. Backend - IMAI Profile Lookup

- [x] 1.1 Create `GET /api/integrations/imai/profile` endpoint in IntegrationsController
- [x] 1.2 Implement IMAI profile fetch in IntegrationsService (call IMAI API with handle/platform)
- [x] 1.3 Add Redis caching for profile lookups (5-minute TTL, key: `imai:profile:{platform}:{handle}`)
- [x] 1.4 Create `ImaiProfileDto` response schema with profile fields
- [x] 1.5 Add unit tests for IMAI profile lookup service

## 2. Backend - Creator CRUD Endpoints

- [x] 2.1 Create `POST /api/creators` endpoint with `@RequirePermission('creator:Create')`
- [x] 2.2 Implement create service with soft-delete restoration check (find by handle+platform where deletedAt IS NOT NULL)
- [x] 2.3 Create `PATCH /api/creators/:id` endpoint with `@RequirePermission('creator:Update')`
- [x] 2.4 Implement update service with partial update support
- [x] 2.5 Create `DELETE /api/creators/:id` endpoint with `@RequirePermission('creator:Delete')`
- [x] 2.6 Implement soft delete service (set deletedAt = now())
- [x] 2.7 Create DTOs: `CreateCreatorDto`, `UpdateCreatorDto`
- [x] 2.8 Add validation decorators for required fields (fullName, handle, platform)
- [x] 2.9 Add audit logging for create/update/delete operations
- [x] 2.10 Add unit tests for creator CRUD service methods

## 3. Backend - RBAC Updates

- [x] 3.1 Add `creator:Create`, `creator:Update`, `creator:Delete` permissions to RBAC service
- [x] 3.2 Update EditorAccess policy to include `creator:Create`, `creator:Update`
- [x] 3.3 Verify Admin policy includes all creator permissions via wildcard
- [x] 3.4 Add unit tests for new permission checks

## 4. Lambda - Import Handler Update

- [x] 4.1 Modify creator-import-handler to check for soft-deleted records before duplicate skip
- [x] 4.2 If soft-deleted record found, restore (clear deletedAt) and update with CSV data
- [x] 4.3 Update import summary to include `restoredCount` metric
- [x] 4.4 Add logging for restored records: "Row X: Restored soft-deleted creator @handle"
- [x] 4.5 Add unit tests for restore-on-import logic

## 5. Frontend - IMAI Profile Preview Component

- [x] 5.1 Create `useImaiProfileLookup` hook using TanStack Query
- [x] 5.2 Create `ProfilePreviewCard` component (avatar, name, bio, followers, platform badge)
- [x] 5.3 Add loading skeleton state for profile lookup
- [x] 5.4 Add error state for "Influencer not found"
- [x] 5.5 Add confirmation button "Yes, this is the correct influencer"

## 6. Frontend - Add Influencer Modal

- [x] 6.1 Create `AddInfluencerModal` component with two-step flow
- [x] 6.2 Step 1: Handle input + platform selector + "Lookup" button
- [x] 6.3 Step 2: Profile preview + confirmation + full form (pre-filled)
- [x] 6.4 Create form fields for all creator attributes (country, gender, languages, etc.)
- [x] 6.5 Add form validation for required fields
- [x] 6.6 Integrate `useCreateCreator` mutation hook
- [x] 6.7 Handle restore scenario (show "Influencer restored" toast if record was restored)
- [x] 6.8 Add "Add Influencer" button to creators list page (permission-gated)

## 7. Frontend - Edit Influencer

- [x] 7.1 Create `EditInfluencerModal` component with form pre-filled from existing data
- [x] 7.2 Integrate `useUpdateCreator` mutation hook
- [x] 7.3 Add "Edit" action button to creator row/detail page (permission-gated)
- [x] 7.4 Add optimistic update for immediate UI feedback

## 8. Frontend - Delete Influencer

- [x] 8.1 Create `DeleteConfirmationDialog` component
- [x] 8.2 Integrate `useDeleteCreator` mutation hook
- [x] 8.3 Add "Delete" action button to creator row/detail page (permission-gated)
- [x] 8.4 Add optimistic update to remove from list immediately
- [x] 8.5 Show success toast "Influencer deleted successfully"

## 9. Frontend - Permission Integration

- [x] 9.1 Update permission constants to include `creator:Create`, `creator:Update`, `creator:Delete`
- [x] 9.2 Gate "Add Influencer" button with `hasPermission('creator:Create')`
- [x] 9.3 Gate "Edit" button with `hasPermission('creator:Update')`
- [x] 9.4 Gate "Delete" button with `hasPermission('creator:Delete')`

## 10. Testing & Validation

- [x] 10.1 Write integration tests for complete add flow (lookup → preview → confirm → save)
- [x] 10.2 Write integration tests for edit flow
- [x] 10.3 Write integration tests for delete flow
- [x] 10.4 Test restore-on-add scenario (add previously deleted influencer)
- [x] 10.5 Test restore-on-import scenario (CSV with previously deleted handle)
- [x] 10.6 Test permission enforcement (unauthorized user cannot access actions)
