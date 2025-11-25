# export-controls Specification

## Purpose
TBD - created by archiving change add-export-controls. Update Purpose after archive.
## Requirements
### Requirement: Export Control Settings Management
The system SHALL allow administrators to configure role-based export limitations including row limits, watermarking, and time-based quotas.

#### Scenario: Admin views export control settings
- **WHEN** a user with Admin role navigates to Settings > Export Controls tab
- **THEN** the system displays a table showing all roles and their export control settings
- **AND** each row shows: Role name, Export Type, Row Limit, Watermark Enabled, Daily Limit, Monthly Limit
- **AND** the table includes action buttons for Edit and Reset to Default

#### Scenario: Admin creates export control setting for role
- **WHEN** an Admin clicks "Add Setting" and selects Role "Editor" and Export Type "influencer_list"
- **AND** sets Row Limit to 70, Watermark to "On", Daily Limit to 20, Monthly Limit to 200
- **AND** submits the form
- **THEN** the system creates an ExportControlSettings record with the specified values
- **AND** displays success toast "Export control settings saved successfully"
- **AND** the new setting appears in the table

#### Scenario: Admin updates export control row limit
- **WHEN** an Admin edits the "Editor / influencer_list" setting
- **AND** changes Row Limit from 70 to 100
- **AND** saves the changes
- **THEN** the system updates the ExportControlSettings record
- **AND** creates an audit event "ExportControlSettingsUpdated" with before/after state
- **AND** the updated limit is immediately enforced for new exports

#### Scenario: Admin sets unlimited row limit
- **WHEN** an Admin sets Row Limit to -1 for "Admin / influencer_list"
- **AND** saves the setting
- **THEN** the system stores rowLimit as -1
- **AND** Admin users can export unlimited rows for that export type

#### Scenario: Admin disables watermark for role
- **WHEN** an Admin toggles Watermark to "Off" for "Admin / all"
- **AND** saves the setting
- **THEN** the system sets enableWatermark to false
- **AND** PDFs exported by Admin users have no watermark applied

#### Scenario: Admin sets time-based limits
- **WHEN** an Admin sets Daily Limit to 10 and Monthly Limit to 50 for "Viewer / all"
- **AND** saves the setting
- **THEN** the system enforces these limits across all export types for Viewer role
- **AND** limits reset at UTC midnight (daily) and first day of month (monthly)

#### Scenario: Non-admin cannot access export controls
- **WHEN** a user with Editor or Viewer role attempts to access /settings (Export Controls tab)
- **THEN** the Export Controls tab is not visible in the UI
- **AND** if they directly navigate to the tab, permission check prevents rendering

#### Scenario: Default settings applied to new role
- **WHEN** an Admin creates a new custom role "Contributor"
- **AND** no export control settings exist for that role
- **THEN** the system applies default settings (copied from Viewer role)
- **AND** the Admin can later customize the settings

### Requirement: Export Row Limiting Enforcement
The system SHALL enforce row limits configured for each role and export type during data export operations.

#### Scenario: Editor exports with row limit applied
- **WHEN** a user with Editor role requests export of influencer list
- **AND** the query would return 200 influencers
- **AND** the export control setting for "Editor / influencer_list" has rowLimit = 70
- **THEN** the system applies LIMIT 70 to the database query
- **AND** returns a PDF with exactly 70 influencer records (first 70 rows)
- **AND** the user is NOT notified that data was limited

#### Scenario: Admin exports with unlimited access
- **WHEN** a user with Admin role requests export of influencer list
- **AND** the export control setting for "Admin / influencer_list" has rowLimit = -1
- **AND** the query returns 5000 influencers
- **THEN** the system does NOT apply a row limit
- **AND** returns a PDF with all 5000 influencer records

#### Scenario: Export type fallback to default settings
- **WHEN** a user with Viewer role requests export of type "report"
- **AND** no specific setting exists for "Viewer / report"
- **AND** a setting exists for "Viewer / all" with rowLimit = 50
- **THEN** the system applies the "all" export type setting as fallback
- **AND** limits the export to 50 rows

#### Scenario: Multiple roles - most permissive limit applied
- **WHEN** a user has both Editor (rowLimit = 70) and Viewer (rowLimit = 50) roles
- **AND** requests an influencer list export
- **THEN** the system applies the most permissive limit (70 rows)
- **AND** uses OR logic for permission aggregation

#### Scenario: User views their export limits before exporting
- **WHEN** a user with Editor role views the influencer list page
- **AND** the page includes an export button
- **THEN** the system displays quota indicator: "You can export up to 70 rows"
- **AND** shows remaining daily quota: "Remaining today: 8/10 exports"
- **AND** information is fetched from ExportControlSettings and ExportLog

### Requirement: Time-Based Export Quota Enforcement
The system SHALL enforce daily and monthly export limits configured for each role and export type.

#### Scenario: User within daily export limit
- **WHEN** a user with Viewer role requests an export
- **AND** the export control setting has dailyLimit = 10
- **AND** the user has performed 5 exports today (from ExportLog)
- **THEN** the system allows the export to proceed
- **AND** increments the ExportLog count
- **AND** shows updated quota: "Remaining today: 4/10 exports"

#### Scenario: User exceeds daily export limit
- **WHEN** a user with Viewer role requests an export
- **AND** the export control setting has dailyLimit = 10
- **AND** the user has already performed 10 exports today
- **THEN** the system returns HTTP 429 Too Many Requests
- **AND** displays error toast: "Daily export limit reached (10/10). Resets at midnight UTC."
- **AND** does NOT create an export file or ExportLog entry

#### Scenario: User within monthly limit but exceeds daily
- **WHEN** a user with Editor role has performed 20 exports today (daily limit reached)
- **AND** has performed 50 exports this month (monthly limit = 200)
- **THEN** the system blocks the export due to daily limit
- **AND** error message indicates daily limit exceeded, not monthly

#### Scenario: User exceeds monthly export limit
- **WHEN** a user with Viewer role requests an export
- **AND** the export control setting has monthlyLimit = 50
- **AND** the user has performed 50 exports this month (even if within daily limit)
- **THEN** the system returns HTTP 429 Too Many Requests
- **AND** displays error toast: "Monthly export limit reached (50/50). Resets on [first day of next month]."

#### Scenario: Daily limit resets at UTC midnight
- **WHEN** a user has reached their daily export limit (10/10)
- **AND** UTC midnight passes (new day begins)
- **AND** the user requests a new export
- **THEN** the system counts only today's exports (0)
- **AND** allows the export to proceed
- **AND** shows updated quota: "Remaining today: 9/10 exports"

#### Scenario: Monthly limit resets on first day of month
- **WHEN** a user has reached their monthly export limit
- **AND** the calendar month changes (e.g., January 31 → February 1)
- **AND** the user requests a new export
- **THEN** the system counts only current month's exports (0)
- **AND** allows the export to proceed

#### Scenario: No time limits configured
- **WHEN** an export control setting has dailyLimit = null and monthlyLimit = null
- **THEN** the system does NOT enforce any time-based quotas
- **AND** only row limits and watermarking are applied

#### Scenario: Admin role bypasses time limits
- **WHEN** an Admin user has dailyLimit = null in their settings
- **THEN** the system allows unlimited exports per day/month
- **AND** no quota indicator is shown

### Requirement: Export Logging and Tracking
The system SHALL log all export events with metadata for quota tracking and audit purposes.

#### Scenario: Export logged on successful export
- **WHEN** a user successfully exports an influencer list PDF
- **AND** the export contains 70 rows
- **THEN** the system creates an ExportLog entry with:
  - userId = current user's ID
  - exportType = "influencer_list"
  - rowCount = 70
  - exportedAt = current timestamp (UTC)
- **AND** also creates an audit event "DataExported"

#### Scenario: Export log tracks quota consumption
- **WHEN** calculating remaining daily quota for a user
- **THEN** the system queries ExportLog WHERE userId = X AND exportedAt >= start of day (UTC)
- **AND** counts the number of matching records
- **AND** subtracts from dailyLimit to show remaining quota

#### Scenario: Failed export not logged
- **WHEN** a user's export request fails due to exceeding quota
- **THEN** the system does NOT create an ExportLog entry
- **AND** does NOT increment the user's export count

#### Scenario: Export log includes export type
- **WHEN** querying export logs for analytics
- **THEN** each log entry includes exportType field
- **AND** allows filtering by export type (e.g., "influencer_list" vs "report")
- **AND** enables per-type quota tracking in the future

### Requirement: Export Controls Permission Management
The system SHALL restrict export control management to users with appropriate permissions.

#### Scenario: Admin has export control management permission
- **WHEN** the system initializes RBAC policies
- **THEN** the Admin role includes permission "exportControl:Manage"
- **AND** Admin role includes permission "exportControl:Read"

#### Scenario: Editor cannot manage export controls
- **WHEN** a user with Editor role attempts to access export control settings API
- **THEN** the system checks for "exportControl:Manage" permission
- **AND** returns HTTP 403 Forbidden
- **AND** displays error: "You don't have permission to manage export controls"

#### Scenario: Export permission checked per resource
- **WHEN** a user attempts to export influencer list
- **THEN** the system checks for "influencer:Export" permission (in addition to row/time limits)
- **AND** if permission denied, returns HTTP 403
- **AND** if permission granted, applies row/time limits from ExportControlSettings

### Requirement: Export Control Settings Validation
The system SHALL validate export control settings to prevent invalid configurations.

#### Scenario: Row limit must be positive or -1
- **WHEN** an Admin attempts to set Row Limit to -5
- **THEN** the system returns HTTP 400 Bad Request
- **AND** displays error: "Row limit must be -1 (unlimited) or a positive number"

#### Scenario: Time limits must be positive
- **WHEN** an Admin attempts to set Daily Limit to 0 or -10
- **THEN** the system returns HTTP 400 Bad Request
- **AND** displays error: "Daily limit must be a positive number or null"

#### Scenario: Duplicate role/export type combination prevented
- **WHEN** an Admin attempts to create a setting for "Editor / influencer_list"
- **AND** a setting already exists for that combination
- **THEN** the system returns HTTP 409 Conflict
- **AND** displays error: "Export control setting already exists for this role and export type"

#### Scenario: Daily limit cannot exceed monthly limit
- **WHEN** an Admin sets Daily Limit to 100 and Monthly Limit to 50
- **THEN** the system returns HTTP 400 Bad Request
- **AND** displays error: "Daily limit cannot exceed monthly limit"

#### Scenario: Valid export type required
- **WHEN** an Admin attempts to create a setting with exportType = "invalid_type"
- **THEN** the system validates against allowed export types enum
- **AND** returns HTTP 400 if not in allowed list
- **AND** allowed types include: "all", "influencer_list", "report" (extensible)

