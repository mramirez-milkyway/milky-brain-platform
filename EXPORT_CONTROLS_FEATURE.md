# Export Controls & Configuration Panel - Feature Documentation

## Overview
This feature adds role-based export controls and PDF watermarking to the admin panel, allowing administrators to configure and enforce data export limitations across different user roles.

## Features Implemented

### 1. **Database Models**
- **ExportControlSettings**: Role-based export configuration
  - Row limits (-1 for unlimited)
  - Watermark enable/disable
  - Daily and monthly export quotas
- **ExportLog**: Tracks all export events for quota enforcement
- **Influencer**: Mock data model for testing exports

### 2. **Backend API Endpoints**

#### Export Controls Management
```
GET    /api/export-controls              # List all settings (Admin only)
POST   /api/export-controls              # Create setting (Admin only)
PATCH  /api/export-controls/:id          # Update setting (Admin only)
DELETE /api/export-controls/:id          # Delete setting (Admin only)
GET    /api/export-controls/quota/:userId # Get user's current quota
```

#### Influencers (Mock for Testing)
```
GET    /api/influencers                  # List influencers (paginated)
GET    /api/influencers/export/pdf       # Export PDF with controls applied
```

### 3. **Frontend Pages**

#### Settings Page (/settings)
- **Refactored** to tabs-based layout
- **General Tab**: Organization settings (existing functionality)
- **Export Controls Tab**: Admin-only configuration panel
  - View all export control settings
  - Add/Edit/Delete settings per role and export type
  - Configure row limits, watermarking, and time-based quotas

#### Influencers Page (/influencers) - Mock
- List view of mock influencer data
- Export Quota Indicator component
- Export PDF button with quota checking
- Visual feedback for quota limits

### 4. **PDF Generation & Watermarking**
- Server-side PDF generation using PDFKit
- Diagonal watermark: "Milky Way Agency - Confidential"
- Semi-transparent gray overlay (30% opacity, 45° rotation)
- Applied to every page of multi-page PDFs
- Configurable per role (can be disabled for Admin)

### 5. **Export Limiting Logic**
- **Row Limits**: First N rows returned from database query
- **Time-Based Quotas**: 
  - Daily limit resets at midnight UTC
  - Monthly limit resets on 1st of month
- **Most Permissive Rule**: When user has multiple roles, applies highest limits
- **Fallback**: Export type "all" serves as default for unspecified types

## Default Settings (Seeded)

| Role | Export Type | Row Limit | Watermark | Daily Limit | Monthly Limit |
|------|-------------|-----------|-----------|-------------|---------------|
| Admin | all | -1 (unlimited) | Off | None | None |
| Editor | all | 100 | On | 20 | 200 |
| Viewer | all | 50 | On | 10 | 50 |

## Permissions

### New Permissions Added
- `exportControl:Read` - View export control settings (Admin only)
- `exportControl:Manage` - Modify export control settings (Admin only)
- `influencer:Read` - View influencer list
- `influencer:Export` - Export influencer PDF

### Role Permissions
- **Admin**: All permissions (wildcard `*`)
- **Editor**: Can read and export influencers
- **Viewer**: Can read and export influencers (with stricter limits)

## Usage Guide

### For Administrators

#### 1. Configure Export Controls
1. Navigate to **Settings** > **Export Controls** tab
2. Click **Add Setting** to create a new export control
3. Select:
   - **Role**: Which role to apply settings to
   - **Export Type**: Specific export or "all" for default
   - **Row Limit**: Max rows (-1 for unlimited)
   - **Watermark**: Enable/disable PDF watermarking
   - **Daily/Monthly Limits**: Optional quota limits
4. Click **Save**

#### 2. Edit Existing Settings
1. In the Export Controls table, click **Edit** on any row
2. Modify values as needed
3. Click **Save**

#### 3. Delete Settings
1. Click **Delete** on any row
2. Confirm deletion
3. Users will fall back to default "all" settings

### For End Users

#### View Export Quota
- Navigate to **Influencers** page
- See quota indicator at top showing:
  - Row limit
  - Daily quota remaining
  - Monthly quota remaining

#### Export PDF
1. Click **Export PDF** button
2. If quota available:
   - PDF downloads automatically
   - Watermark applied based on role settings
   - Limited to configured row count
3. If quota exceeded:
   - Error message displays
   - Informs when quota resets

## Technical Architecture

### Backend Modules
```
apps/api/src/
├── export-controls/        # Export control settings CRUD
│   ├── dto/
│   ├── export-controls.controller.ts
│   ├── export-controls.service.ts
│   ├── export-controls.repository.ts
│   └── export-controls.module.ts
├── pdf/                    # PDF generation abstraction
│   ├── interfaces/pdf-generator.interface.ts
│   ├── pdfkit-generator.service.ts
│   └── pdf.module.ts
└── influencers/            # Mock influencer endpoints
    ├── dto/
    ├── influencers.controller.ts
    ├── influencers.service.ts
    ├── influencers.repository.ts
    └── influencers.module.ts
```

### Frontend Components
```
apps/web-admin/src/
├── app/
│   ├── settings/
│   │   ├── components/
│   │   │   ├── GeneralSettings.tsx
│   │   │   └── ExportControlsSettings.tsx
│   │   └── page.tsx (tabs-based)
│   └── influencers/
│       ├── page.tsx
│       └── layout.tsx
└── components/
    └── export/
        └── ExportQuotaIndicator.tsx
```

### Database Schema
```sql
-- Export Control Settings
export_control_settings (
  id, role_id, export_type, row_limit,
  enable_watermark, daily_limit, monthly_limit,
  created_at, updated_at
)

-- Export Logs (for quota tracking)
export_logs (
  id, user_id, export_type, row_count,
  exported_at, watermark, created_at, updated_at
)

-- Mock Influencers
influencers (
  id, name, platform, followers,
  engagement, category, created_at
)
```

## API Examples

### Get Export Control Settings
```bash
curl -X GET http://localhost:4000/api/export-controls \
  -H "Cookie: access_token=..." \
  -H "Cookie: csrf_token=..."
```

### Create Export Control Setting
```bash
curl -X POST http://localhost:4000/api/export-controls \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=..." \
  -H "Cookie: csrf_token=..." \
  -H "X-CSRF-Token: ..." \
  -d '{
    "roleId": 2,
    "exportType": "influencer_list",
    "rowLimit": 70,
    "enableWatermark": true,
    "dailyLimit": 15,
    "monthlyLimit": 150
  }'
```

### Export PDF
```bash
curl -X GET http://localhost:4000/api/influencers/export/pdf \
  -H "Cookie: access_token=..." \
  -H "Cookie: csrf_token=..." \
  --output influencer-list.pdf
```

## Testing

### Manual Testing Checklist
- [ ] Admin can view Export Controls tab
- [ ] Editor/Viewer cannot see Export Controls tab
- [ ] Admin can create export control setting
- [ ] Admin can edit export control setting
- [ ] Admin can delete export control setting
- [ ] Row limiting works (export respects configured limit)
- [ ] Watermark appears on PDF for Editor/Viewer
- [ ] Watermark does NOT appear on PDF for Admin
- [ ] Daily quota is enforced (blocks after limit)
- [ ] Monthly quota is enforced (blocks after limit)
- [ ] Quota indicator shows correct remaining count
- [ ] Export logs are created after successful export
- [ ] Audit events are created for settings changes

### Test Scenarios

#### Scenario 1: Test Row Limiting
1. Configure Editor role with rowLimit = 10
2. Login as Editor
3. Navigate to Influencers page
4. Export PDF
5. Open PDF and verify exactly 10 rows

#### Scenario 2: Test Daily Quota
1. Configure Viewer with dailyLimit = 2
2. Login as Viewer
3. Export PDF twice successfully
4. Try third export - should fail with 429 error
5. Wait until midnight UTC or manually clear export_logs
6. Export should work again

#### Scenario 3: Test Watermark
1. Login as Editor
2. Export PDF
3. Verify watermark appears diagonally on every page
4. Login as Admin
5. Export PDF
6. Verify NO watermark

## Migration & Deployment

### Database Migration
```bash
cd apps/api
npx prisma migrate deploy
```

### Seed Data
```bash
cd apps/api
npm run seed
```

This will:
- Create default export control settings for Admin/Editor/Viewer
- Create 20 mock influencer records
- Update role permissions

### Environment Variables
No new environment variables required. Uses existing:
- `DATABASE_URL` - PostgreSQL connection
- `NEXT_PUBLIC_API_URL` - API endpoint for frontend

## Future Enhancements

### Potential Features (Out of Scope for V1)
- [ ] User-specific overrides (currently role-based only)
- [ ] Multiple watermark templates
- [ ] Export scheduling and batch processing
- [ ] Real-time export analytics dashboard
- [ ] Different export formats (CSV, Excel)
- [ ] Per-export-type specific limits (beyond "all")
- [ ] Hourly/weekly time-based limits
- [ ] Export approval workflows
- [ ] Retroactive watermarking of existing files

## Troubleshooting

### Issue: PDF not downloading
- **Check**: Browser console for errors
- **Fix**: Ensure API endpoint is accessible, CORS configured

### Issue: Quota not resetting
- **Check**: Server time is UTC
- **Fix**: Verify `export_logs.exported_at` timestamps are UTC

### Issue: Watermark not appearing
- **Check**: Role's `enableWatermark` setting in database
- **Fix**: Update setting via Export Controls UI

### Issue: "Permission denied" on Export Controls tab
- **Check**: User has Admin role
- **Fix**: Assign Admin role or `exportControl:Read` permission

## Support & Contact
For questions or issues, contact the development team or create an issue in the project repository.

---

**Implementation Date**: 2025-11-23  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
