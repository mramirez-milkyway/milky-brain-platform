# Design: Export Controls & Configuration Panel

## Context
The system needs to enforce data export limitations and PDF watermarking based on user roles to protect intellectual property and control data distribution. This is a new capability that extends the existing role-based access control system. The feature requires backend enforcement, database-backed configuration, audit logging, and a user-friendly admin interface.

## Goals / Non-Goals

### Goals
- Provide flexible, role-based export control configuration
- Enforce export limits server-side (defense-in-depth)
- Support multiple export types with extensible architecture
- Implement transparent PDF watermarking during generation
- Enable time-based export limits with user-friendly UX
- Maintain comprehensive audit trail for compliance
- Decouple PDF generation library for easy future replacement

### Non-Goals
- Client-side export limiting (backend enforcement only)
- Real-time export analytics/dashboards (future enhancement)
- User-specific overrides (role-based only for v1)
- Export scheduling or batch processing
- Multiple watermark templates (single template for v1)
- Retroactive watermarking of existing PDFs

## Decisions

### 1. PDF Generation Library Selection

**Decision**: Use PDFKit for server-side PDF generation

**Rationale**:
- **PDFKit** (Recommended):
  - Pure JavaScript, no external dependencies (no binary compilation)
  - 10M+ weekly downloads, actively maintained
  - Built-in watermarking via text overlay with opacity
  - Streaming API for memory efficiency
  - Works seamlessly with NestJS
  
- **Alternatives Considered**:
  - **pdf-lib**: Good for PDF manipulation but heavier; better for modifying existing PDFs
  - **Puppeteer/Playwright**: Too heavy (requires Chromium), overkill for simple PDF generation
  - **jsPDF**: Client-side focused, less ideal for server-side streaming

**Implementation**: Wrap PDFKit behind `IPdfGenerator` interface to allow swapping if needed

### 2. Database Schema Design

**Decision**: Create `ExportControlSettings` table with role-based configuration and `ExportType` enum

**Schema**:
```prisma
model ExportControlSettings {
  id              Int      @id @default(autoincrement())
  roleId          Int      @map("role_id")
  exportType      String   @map("export_type") // 'influencer_list', 'report', 'all'
  rowLimit        Int      @map("row_limit") // -1 for unlimited
  enableWatermark Boolean  @default(true) @map("enable_watermark")
  dailyLimit      Int?     @map("daily_limit") // Optional: max exports per day
  monthlyLimit    Int?     @map("monthly_limit") // Optional: max exports per month
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  @@unique([roleId, exportType], name: "unique_role_export_type")
  @@index([roleId])
  @@map("export_control_settings")
}

model ExportLog {
  id         Int      @id @default(autoincrement())
  userId     Int      @map("user_id")
  exportType String   @map("export_type")
  rowCount   Int      @map("row_count")
  exportedAt DateTime @default(now()) @map("exported_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, exportedAt])
  @@index([exportType])
  @@map("export_logs")
}

// Mock model for testing
model Influencer {
  id          Int      @id @default(autoincrement())
  name        String
  platform    String
  followers   Int
  engagement  Float
  category    String
  createdAt   DateTime @default(now()) @map("created_at")
  
  @@map("influencers")
}
```

**Rationale**:
- Composite unique constraint on `roleId + exportType` prevents duplicate settings
- `exportType = 'all'` acts as default/fallback for unspecified types
- Time-based limits nullable for optional enforcement
- Separate `ExportLog` for tracking without bloating audit events (though audit events still created)
- Influencer model purely for mock testing

### 3. Export Limiting Logic

**Decision**: Apply limits during query execution, return first N rows

**Flow**:
```typescript
1. User requests export (e.g., GET /api/influencers/export)
2. Backend fetches user's roles
3. Backend queries ExportControlSettings for role + exportType
4. If rowLimit = -1, fetch all; else fetch LIMIT rowLimit
5. Check daily/monthly limits from ExportLog
6. If time limits exceeded, return 429 Too Many Requests
7. Generate export (CSV/PDF) with fetched data
8. Log to ExportLog and Audit
9. Return file to user
```

**Rationale**:
- Database-level LIMIT ensures efficiency (no over-fetching)
- First N rows is simplest UX (no pagination complexity for v1)
- Time-based limits checked before generation to avoid wasted resources

### 4. Watermarking Implementation

**Decision**: Apply watermark during PDF generation (not post-processing)

**Implementation**:
```typescript
// Pseudo-code
doc.save();
doc.rotate(45, { origin: [pageWidth/2, pageHeight/2] });
doc.fontSize(60)
   .fillColor('#cccccc')
   .opacity(0.3)
   .text('Milky Way Agency - Confidential', 0, pageHeight/2, {
     align: 'center',
     width: pageWidth
   });
doc.restore();
// Continue with content...
```

**Rationale**:
- Generation-time watermarking is more efficient than post-processing
- Allows per-page watermarking in multi-page PDFs
- Semi-transparent gray (#cccccc, 30% opacity) balances visibility and readability
- 45-degree diagonal rotation provides standard watermark appearance

### 5. Settings UI Architecture

**Decision**: Convert Settings page to tabs-based layout using custom Tabs component

**Structure**:
```
/settings (page.tsx - tabs container)
  ├─ /general (tab) - Existing settings content
  └─ /export-controls (tab) - New export controls
```

**Component Structure**:
```tsx
// settings/page.tsx
<Tabs defaultTab="general">
  <TabList>
    <Tab id="general">General Settings</Tab>
    <Tab id="export-controls">Export Controls</Tab>
  </TabList>
  <TabPanels>
    <TabPanel id="general"><GeneralSettings /></TabPanel>
    <TabPanel id="export-controls"><ExportControlsSettings /></TabPanel>
  </TabPanels>
</Tabs>

// export-controls component shows table:
// Role | Export Type | Row Limit | Watermark | Daily Limit | Monthly Limit | Actions
```

**Rationale**:
- Tabs provide clean separation for growing settings sections
- Reuses existing Tabs UI component (apps/web-admin/src/components/ui/tabs)
- Permission check: only Admin sees "Export Controls" tab
- Future-proof for additional settings tabs

### 6. Mock Influencers Implementation

**Decision**: Create minimal mock controller and screen for testing only

**Endpoints**:
- `GET /api/influencers` - Returns paginated mock data
- `GET /api/influencers/export/pdf` - Returns PDF with watermark and row limits applied

**Frontend**:
- Simple table at `/influencers` with "Export PDF" button
- Displays user's current export limits above table
- Clear "Mock Data" badge/indicator

**Rationale**:
- Minimal implementation to test export controls without building full influencer feature
- Clearly marked as mock to prevent confusion
- Can be removed or replaced when real influencer feature is built

### 7. Audit Event Types

**Decision**: Add two new audit event types

**New Events**:
1. `ExportControlSettingsUpdated` - When admin changes export control settings
   - Before/After state: full settings object
2. `DataExported` - When any user exports data
   - Metadata: exportType, rowCount, wasLimited (boolean)

**Rationale**:
- Settings changes are critical for compliance auditing
- Export events provide usage analytics and security monitoring
- Separate from ExportLog for comprehensive audit trail

### 8. Permission Model

**Decision**: Add `exportControl:Manage` permission for Admin role only

**Permissions**:
- `exportControl:Read` - View export control settings (Admin only for v1)
- `exportControl:Manage` - Modify export control settings (Admin only)
- Export permissions per resource (e.g., `influencer:Export`) check row/time limits

**Rationale**:
- Consistent with existing RBAC pattern
- Separates viewing from modification
- Resource-specific export permissions allow granular control per export type

### 9. Time-Based Limits UX

**Decision**: Show remaining export quota proactively before export

**Implementation**:
```tsx
// Before export button:
<ExportQuotaIndicator>
  <Icon />
  <Text>
    You can export up to 70 rows. 
    Remaining today: 8/10 exports
  </Text>
</ExportQuotaIndicator>
<Button onClick={handleExport}>Export PDF</Button>
```

**Error Handling**:
- When limit exceeded: Show toast "Daily export limit reached (10/10). Try again tomorrow."
- Include reset time in error message

**Rationale**:
- Proactive display reduces user frustration
- Clear quota visualization improves UX
- Specific error messages guide user action

## Risks / Trade-offs

### Risk: PDF Generation Performance
- **Issue**: Large PDFs (1000+ rows) may block Node.js event loop
- **Mitigation**: 
  - Use PDFKit streaming API to write chunks
  - Add request timeout (30s max)
  - Consider background job queue for large exports (future enhancement)
  - Initial implementation assumes moderate data sizes (<500 rows typical)

### Risk: Library Lock-in
- **Issue**: PDFKit may not meet future requirements
- **Mitigation**: 
  - IPdfGenerator interface abstracts implementation
  - Document interface contract clearly
  - Keep PDF generation module isolated

### Trade-off: First N Rows vs User Selection
- **Decision**: Always return first N rows (no user control of which rows)
- **Trade-off**: Simplicity vs flexibility
- **Rationale**: User can apply filters/sorting before export to control which rows appear first
- **Future**: Add pagination/offset support if users request it

### Trade-off: Time Limits Granularity
- **Decision**: Daily/monthly limits only (no hourly/weekly)
- **Trade-off**: Precision vs complexity
- **Rationale**: Daily/monthly sufficient for most use cases; reduces configuration complexity
- **Future**: Add configurable time windows if needed

## Migration Plan

### Phase 1: Database & Backend (Week 1)
1. Create and run Prisma migration for new tables
2. Seed default export control settings for existing roles:
   - Admin: -1 row limit, watermark off, no time limits
   - Editor: 100 row limit, watermark on, 20/day, 200/month
   - Viewer: 50 row limit, watermark on, 10/day, 50/month
3. Implement ExportControlsModule with settings CRUD
4. Implement PdfModule with watermarking
5. Create mock InfluencersModule with export endpoint
6. Add audit logging for new event types
7. Write unit tests for limiting logic

### Phase 2: Frontend (Week 1-2)
1. Refactor settings page to tabs layout
2. Create ExportControlsSettings component with role-based table
3. Integrate with API endpoints
4. Create mock influencers list page with export button
5. Add export quota indicators
6. Write React tests for new components

### Phase 3: Testing & Validation (Week 2)
1. Test export limiting with different roles
2. Verify watermark appearance on multi-page PDFs
3. Test time-based limit enforcement
4. Validate audit log entries
5. Performance test with 500+ row exports
6. Cross-browser testing (PDF downloads)

### Rollback Plan
- Migration includes `down` migration to drop new tables
- Feature flag `ENABLE_EXPORT_CONTROLS` (defaults true) to disable if issues
- Settings page tabs backward compatible (can revert to single panel)

## Open Questions

1. **Should we enforce row limits on paginated API responses too, or only exports?**
   - Recommendation: Exports only for v1 (API pagination is separate concern)

2. **Should time-based limits reset at midnight user's timezone or UTC?**
   - Recommendation: UTC for simplicity; document clearly in UI

3. **Should we show "limited data" indicator in exported PDF footer?**
   - Recommendation: No (user doesn't see limitation was applied per requirements)

4. **What should default settings be for newly created custom roles?**
   - Recommendation: Copy Viewer settings (most restrictive) for safety

5. **Should export logs be retained indefinitely or purged?**
   - Recommendation: Retain for 90 days, then archive to cold storage (future enhancement)
