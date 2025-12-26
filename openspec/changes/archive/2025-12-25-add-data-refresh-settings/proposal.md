# Change: Add Social Media Data Refresh Settings

## Why
Admins need to configure how frequently influencer data is updated from external social media APIs (Instagram, TikTok, YouTube). This controls the balance between data freshness and API costs/performance. The background worker system needs these thresholds to determine which influencer records are stale and require updates.

Additionally, the current Settings page uses client-side tab state which prevents sharing URLs to specific tabs. Each settings section should have its own URL path for shareability.

## What Changes
- Add a new "Social Media Data Refresh" tab to the Settings page
- Store refresh thresholds in the existing `Setting` table (key-value with JSON value)
- For each social network (Instagram, TikTok, YouTube), configure two thresholds:
  - **Basic Data Threshold**: Profile pic, Bio, Follower count (default: 30 days)
  - **Audience Data Threshold**: Demographics, detailed stats (default: 180 days)
- Remove the "General" tab from Settings (developer request)
- Refactor Settings page to use URL-based routing instead of client-side tab state
  - `/settings/export-controls` for Export Controls
  - `/settings/data-refresh` for Social Media Data Refresh Settings

## Impact
- Affected specs: None existing (new `data-refresh-settings` capability)
- Affected code:
  - `apps/api/src/settings/` - New endpoints for data refresh settings
  - `apps/web-admin/src/app/settings/` - Refactor to URL-based routing, add new component
  - Database: Uses existing `Setting` model (no schema changes)
- Background workers will read these settings to determine data staleness (future integration)
