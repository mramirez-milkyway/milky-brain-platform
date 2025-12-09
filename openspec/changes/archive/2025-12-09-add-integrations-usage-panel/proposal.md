# Change: Add Integrations Usage Panel

## Why
Admins need visibility into external integration quotas and usage to monitor consumption and available capacity. Currently, there's no way to view quota information for integrated services like IMAI, which can lead to unexpected service disruptions when quotas are exhausted.

## What Changes
- Add new read-only "Integrations" section in admin panel
- Display quota and usage information for IMAI integration
- Create backend endpoint to fetch IMAI account info
- Design extensible UI to support multiple providers in the future
- Add `integration:Read` permission for access control

## Impact
- **Affected specs**: New capability `integrations-usage`
- **Affected code**: 
  - Backend: New `apps/api/src/integrations/` module (controller, service, DTOs)
  - Frontend: New `apps/web-admin/src/app/integrations/` page
  - Navigation: Update `apps/web-admin/src/layout/AppSidebar.tsx`
  - Environment: Add `IMAI_API_KEY` and `IMAI_API_BASE_URL` variables
  - Auth: Add `integration:Read` permission to permission system
