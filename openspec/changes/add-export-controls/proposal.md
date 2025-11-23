# Change: Add Export Controls & Configuration Panel

## Why
The system currently lacks granular control over data exports and document downloads based on user roles. This creates risks around data distribution and intellectual property protection. Admins need the ability to configure export limitations and watermarking on a per-role basis to control data access while maintaining flexibility for different user types.

## What Changes
- Add database model for export control settings (row limits, watermarking, time-based limits per role)
- Create admin configuration panel under Settings with tabs-based UI (new "Export Controls" tab)
- Implement role-based export row limiting logic in backend
- Implement server-side PDF watermarking with "Milky Way Agency - Confidential" text
- Create mock Influencers controller and endpoint for testing export functionality
- Create mock frontend screen to test PDF export with controls
- Add comprehensive audit logging for export control setting changes and all export events
- **BREAKING**: Convert Settings page to tabs-based layout (affects existing UI structure)

## Impact
- **Affected specs**: 
  - `role-based-ui` (MODIFIED - adds new admin panel section and permission checks)
  - `audit` (MODIFIED - adds new audit event types for exports and settings changes)
  - `export-controls` (ADDED - new capability)
  - `pdf-generation` (ADDED - new capability)
  
- **Affected code**:
  - `apps/api/prisma/schema.prisma` - New ExportControlSettings and Influencer models
  - `apps/api/src/export-controls/` - New module for settings management
  - `apps/api/src/influencers/` - New mock module for testing
  - `apps/api/src/pdf/` - New module for PDF generation and watermarking
  - `apps/web-admin/src/app/settings/page.tsx` - Convert to tabs-based layout
  - `apps/web-admin/src/app/settings/*` - New export controls tab component
  - `apps/web-admin/src/app/influencers/` - Mock export testing screen

- **Database migration**: New tables for export control settings and influencers mock data

- **Dependencies**: New NPM packages for server-side PDF generation (PDFKit or similar)

## Risks & Considerations
- PDF generation library selection critical for future maintainability (mitigated by interface-based decoupling)
- Time-based export limits require careful UX design to be user-friendly
- Settings page UI restructuring may impact existing user workflows temporarily
- Mock influencers data should be clearly marked to prevent confusion with production features
