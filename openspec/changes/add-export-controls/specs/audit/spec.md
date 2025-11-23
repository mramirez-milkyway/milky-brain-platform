## ADDED Requirements

### Requirement: Export Control Settings Change Auditing
The system SHALL log all changes to export control settings as audit events for compliance and security monitoring.

#### Scenario: Export control setting created
- **WHEN** an Admin creates a new export control setting for "Editor / influencer_list"
- **AND** sets rowLimit = 70, enableWatermark = true, dailyLimit = 20, monthlyLimit = 200
- **THEN** an audit event is created with:
  - `actorId` = Admin user ID
  - `action` = "CREATE ExportControlSettings"
  - `entityType` = "export_control_settings"
  - `entityId` = newly created setting ID
  - `beforeState` = null
  - `afterState` = { roleId: 2, roleName: "Editor", exportType: "influencer_list", rowLimit: 70, enableWatermark: true, dailyLimit: 20, monthlyLimit: 200 }
  - `ipAddress` and `userAgent` captured
  - `createdAt` = current timestamp

#### Scenario: Export control setting updated
- **WHEN** an Admin updates an existing export control setting
- **AND** changes rowLimit from 70 to 100
- **AND** changes enableWatermark from true to false
- **THEN** an audit event is created with:
  - `action` = "UPDATE ExportControlSettings"
  - `entityType` = "export_control_settings"
  - `entityId` = setting ID
  - `beforeState` = { roleId: 2, roleName: "Editor", exportType: "influencer_list", rowLimit: 70, enableWatermark: true, dailyLimit: 20, monthlyLimit: 200 }
  - `afterState` = { roleId: 2, roleName: "Editor", exportType: "influencer_list", rowLimit: 100, enableWatermark: false, dailyLimit: 20, monthlyLimit: 200 }
  - Full before/after state captures all fields, not just changed ones

#### Scenario: Export control setting deleted
- **WHEN** an Admin deletes an export control setting
- **THEN** an audit event is created with:
  - `action` = "DELETE ExportControlSettings"
  - `entityType` = "export_control_settings"
  - `entityId` = deleted setting ID
  - `beforeState` = full setting object before deletion
  - `afterState` = null

#### Scenario: Export control setting reset to default
- **WHEN** an Admin resets an export control setting to default values
- **THEN** an audit event is created with:
  - `action` = "UPDATE ExportControlSettings"
  - `beforeState` = custom values
  - `afterState` = default values
  - Treated as a standard update operation

### Requirement: Data Export Event Auditing
The system SHALL log all data export operations as audit events to track data access and distribution.

#### Scenario: Successful PDF export logged
- **WHEN** a user with Editor role exports an influencer list PDF
- **AND** the export contains 70 rows (limited by export control)
- **THEN** an audit event is created with:
  - `actorId` = current user ID
  - `action` = "EXPORT influencer_list"
  - `entityType` = "export"
  - `entityId` = null (or export log ID if needed)
  - `afterState` = { exportType: "influencer_list", rowCount: 70, wasLimited: true, appliedLimit: 70, format: "pdf", watermarked: true }
  - `ipAddress` and `userAgent` captured
  - `createdAt` = export timestamp

#### Scenario: Unlimited export logged for Admin
- **WHEN** a user with Admin role exports 500 influencer records
- **AND** no row limit is applied (rowLimit = -1)
- **THEN** an audit event is created with:
  - `action` = "EXPORT influencer_list"
  - `afterState` = { exportType: "influencer_list", rowCount: 500, wasLimited: false, appliedLimit: -1, format: "pdf", watermarked: false }

#### Scenario: Export quota exceeded logged
- **WHEN** a user attempts to export but has exceeded their daily quota
- **AND** the request is rejected with HTTP 429
- **THEN** an audit event is created with:
  - `action` = "EXPORT_FAILED influencer_list"
  - `entityType` = "export"
  - `afterState` = { exportType: "influencer_list", reason: "daily_quota_exceeded", dailyLimit: 10, currentCount: 10 }

#### Scenario: Export permission denied logged
- **WHEN** a user without "influencer:Export" permission attempts export
- **AND** the request is rejected with HTTP 403
- **THEN** an audit event is created with:
  - `action` = "EXPORT_DENIED influencer_list"
  - `afterState` = { exportType: "influencer_list", reason: "insufficient_permissions", requiredPermission: "influencer:Export" }

#### Scenario: CSV export logged (future format support)
- **WHEN** a user exports data in CSV format (future feature)
- **THEN** an audit event is created with:
  - `action` = "EXPORT influencer_list"
  - `afterState` includes `format: "csv"`
- **AND** row limiting and watermarking metadata still captured where applicable

#### Scenario: Export audit includes user role context
- **WHEN** any export audit event is created
- **THEN** the `afterState` includes:
  - `userRole` = name of the user's primary role (e.g., "Editor")
  - `userId` = user ID (from actorId)
  - `userName` = user's full name or email
- **AND** this context aids in compliance reporting and analysis

### Requirement: Audit Event Integrity for Export Operations
The system SHALL ensure export-related audit events maintain cryptographic integrity consistent with existing audit logging.

#### Scenario: Export event hash chain maintained
- **WHEN** a data export audit event is created
- **THEN** the event includes:
  - `hash` = SHA-256 hash of (event data + prevHash)
  - `prevHash` = hash of the most recent previous audit event
- **AND** maintains the immutable hash chain across all event types

#### Scenario: Export settings audit event hash chain maintained
- **WHEN** an export control settings change audit event is created
- **THEN** the event maintains hash chain integrity
- **AND** is stored immutably like all other audit events
- **AND** cannot be modified or deleted after creation

### Requirement: Audit Query Support for Export Events
The system SHALL support querying and filtering export-related audit events for reporting and analysis.

#### Scenario: Query all export events for a user
- **WHEN** an Admin queries audit logs with filter: `entityType = "export"` and `actorId = 5`
- **THEN** the system returns all export audit events for user ID 5
- **AND** includes both successful exports and failed/denied attempts
- **AND** results are sorted by `createdAt` descending (most recent first)

#### Scenario: Query export control settings changes
- **WHEN** an Admin queries audit logs with filter: `entityType = "export_control_settings"`
- **THEN** the system returns all create/update/delete events for export settings
- **AND** shows full before/after state for each change
- **AND** allows tracing history of configuration changes

#### Scenario: Query exports by export type
- **WHEN** an Admin queries with filter: `action LIKE "EXPORT influencer_list%"`
- **THEN** the system returns all influencer list export events
- **AND** includes successful exports, quota exceeded, and permission denied events

#### Scenario: Query exports within date range
- **WHEN** an Admin queries exports from 2025-11-01 to 2025-11-15
- **THEN** the system returns export events where `createdAt` is within the range
- **AND** supports pagination for large result sets

#### Scenario: Export audit events included in CSV export
- **WHEN** an Admin exports audit logs to CSV (existing feature)
- **AND** includes export-related events
- **THEN** the CSV includes all standard audit fields plus:
  - Parsed `afterState` showing exportType, rowCount, wasLimited, etc.
  - Human-readable action descriptions (e.g., "Exported influencer list (70 rows, limited)")
