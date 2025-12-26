# data-refresh-settings Specification

## Purpose
Allows Admins to configure expiration thresholds for influencer social media data, controlling how often the background worker system should refresh data from external APIs.

## ADDED Requirements

### Requirement: Data Refresh Settings Management

The system SHALL allow administrators to configure data refresh thresholds per social network, storing settings in the database for consumption by background workers.

#### Scenario: Admin views data refresh settings

- **WHEN** a user with Admin role navigates to `/settings/data-refresh`
- **THEN** the system displays the "Social Media Data Refresh Settings" section
- **AND** shows settings grouped by social network (Instagram, TikTok, YouTube)
- **AND** for each network displays two configurable thresholds:
  - Basic Data Threshold (in days)
  - Audience Data Threshold (in days)
- **AND** displays current values or defaults if not yet configured

#### Scenario: Admin updates Instagram refresh thresholds

- **WHEN** an Admin sets Instagram Basic Data Threshold to 14 days
- **AND** sets Instagram Audience Data Threshold to 90 days
- **AND** clicks "Save Changes"
- **THEN** the system stores the settings in the `Setting` table with key `dataRefresh.instagram`
- **AND** value contains `{ "basicDataDays": 14, "audienceDataDays": 90 }`
- **AND** displays success message "Settings saved successfully"
- **AND** creates an audit event for the settings change

#### Scenario: Admin updates TikTok refresh thresholds

- **WHEN** an Admin sets TikTok Basic Data Threshold to 7 days
- **AND** sets TikTok Audience Data Threshold to 60 days
- **AND** clicks "Save Changes"
- **THEN** the system stores the settings in the `Setting` table with key `dataRefresh.tiktok`
- **AND** value contains `{ "basicDataDays": 7, "audienceDataDays": 60 }`

#### Scenario: Admin updates YouTube refresh thresholds

- **WHEN** an Admin sets YouTube Basic Data Threshold to 30 days
- **AND** sets YouTube Audience Data Threshold to 180 days
- **AND** clicks "Save Changes"
- **THEN** the system stores the settings in the `Setting` table with key `dataRefresh.youtube`
- **AND** value contains `{ "basicDataDays": 30, "audienceDataDays": 180 }`

#### Scenario: Default values applied on first access

- **WHEN** an Admin navigates to `/settings/data-refresh` for the first time
- **AND** no settings exist in the database
- **THEN** the system displays default values:
  - All networks: Basic Data Threshold = 30 days
  - All networks: Audience Data Threshold = 180 days
- **AND** the form is pre-populated with these defaults

#### Scenario: Non-admin cannot access data refresh settings

- **WHEN** a user without `settings:Write` permission attempts to access `/settings/data-refresh`
- **THEN** the system redirects to an unauthorized page or shows permission denied

### Requirement: Data Refresh Settings Validation

The system SHALL validate data refresh settings to ensure thresholds are within acceptable ranges.

#### Scenario: Threshold must be positive integer

- **WHEN** an Admin attempts to set a threshold to 0 or a negative number
- **THEN** the system displays validation error "Threshold must be at least 1 day"
- **AND** does not save the settings

#### Scenario: Threshold has maximum limit

- **WHEN** an Admin attempts to set a threshold greater than 365 days
- **THEN** the system displays validation error "Threshold cannot exceed 365 days"
- **AND** does not save the settings

#### Scenario: Basic threshold cannot exceed audience threshold

- **WHEN** an Admin sets Basic Data Threshold to 60 days
- **AND** sets Audience Data Threshold to 30 days for the same network
- **THEN** the system displays validation error "Basic data threshold cannot exceed audience data threshold"
- **AND** does not save the settings

### Requirement: Data Refresh Settings API

The system SHALL expose REST API endpoints for managing data refresh settings.

#### Scenario: GET data refresh settings

- **WHEN** an authenticated admin sends `GET /api/settings/data-refresh`
- **THEN** the system returns HTTP 200 with:
```json
{
  "instagram": { "basicDataDays": 30, "audienceDataDays": 180 },
  "tiktok": { "basicDataDays": 30, "audienceDataDays": 180 },
  "youtube": { "basicDataDays": 30, "audienceDataDays": 180 }
}
```
- **AND** returns defaults if no settings are stored

#### Scenario: PATCH data refresh settings

- **WHEN** an authenticated admin sends `PATCH /api/settings/data-refresh` with body:
```json
{
  "instagram": { "basicDataDays": 14, "audienceDataDays": 90 }
}
```
- **THEN** the system updates only the specified network settings
- **AND** returns HTTP 200 with the complete updated settings object
- **AND** creates an audit event

#### Scenario: Unauthenticated request rejected

- **WHEN** an unauthenticated request is sent to `GET /api/settings/data-refresh`
- **THEN** the system returns HTTP 401 Unauthorized

#### Scenario: Insufficient permissions rejected

- **WHEN** an authenticated user without `settings:Write` permission attempts to update settings
- **THEN** the system returns HTTP 403 Forbidden

### Requirement: Settings Page URL-Based Routing

The system SHALL use URL-based routing for settings tabs to enable shareable links.

#### Scenario: Export controls accessible via URL

- **WHEN** a user navigates to `/settings/export-controls`
- **THEN** the system displays the Export Controls settings section
- **AND** the URL remains `/settings/export-controls`

#### Scenario: Data refresh accessible via URL

- **WHEN** a user navigates to `/settings/data-refresh`
- **THEN** the system displays the Social Media Data Refresh settings section
- **AND** the URL remains `/settings/data-refresh`

#### Scenario: Settings root redirects to first tab

- **WHEN** a user navigates to `/settings`
- **THEN** the system redirects to `/settings/export-controls`

#### Scenario: Tab navigation updates URL

- **WHEN** a user clicks on the "Data Refresh" tab in the Settings page
- **THEN** the browser URL changes to `/settings/data-refresh`
- **AND** the Data Refresh settings section is displayed

#### Scenario: General tab removed

- **WHEN** a user views the Settings page
- **THEN** the "General" tab is not displayed
- **AND** only "Export Controls" and "Data Refresh" tabs are visible
