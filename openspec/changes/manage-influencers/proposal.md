# Change: Manage Influencers (Add, Edit, Delete & Restore)

## Why

Currently, influencer records can only be added via bulk CSV import. There is no way to:
- Add individual influencers with IMAI verification to ensure data accuracy
- Edit existing influencer records
- Soft delete influencers and later restore them
- Restore soft-deleted records when re-adding via single-add or bulk import

This limits the flexibility and accuracy of the influencer database management.

## What Changes

### New Capability: influencer-management

1. **Smart Add Flow with IMAI Verification**
   - User enters social handle/URL first
   - System queries IMAI API to fetch profile preview (picture, name, bio, followers)
   - User confirms identity before proceeding to full form
   - Confirmed data pre-fills relevant form fields
   - Validation ensures mandatory fields are not empty

2. **Restore Logic on Add**
   - When saving a new influencer, system checks if handle/email exists but is soft-deleted
   - If found, the record is restored and updated with new data (instead of creating duplicate)

3. **Edit Influencer**
   - Users can modify existing influencer details
   - Changes are persisted to database with audit trail

4. **Soft Delete Influencer**
   - Users can soft-delete influencers (sets `deleted_at` timestamp)
   - Soft-deleted records are hidden from lists but retained in database

5. **Permission-Based Access Control**
   - Create, Edit, and Delete actions restricted by role permissions
   - Uses existing RBAC infrastructure with new permissions

### Modified Capability: influencer-import

6. **Bulk Import Restore Logic**
   - Import Center logic updated to restore soft-deleted records
   - If CSV row matches a soft-deleted record, it is restored and updated
   - No longer throws duplicate error for soft-deleted matches

## Impact

- **New spec:** `specs/influencer-management/spec.md`
- **Modified spec:** `specs/influencer-import/spec.md` (duplicate handling for soft-deleted records)
- **Affected code:**
  - `apps/api/src/creators/` - New endpoints for CRUD operations
  - `apps/api/src/integrations/` - IMAI profile lookup endpoint
  - `apps/client/` - Add/Edit/Delete UI components
  - `lambdas/job-processor/` - Updated duplicate handling in import handler
  - RBAC policies for new permissions
