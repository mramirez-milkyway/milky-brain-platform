# audit Specification

## Purpose
TBD - created by archiving change add-comprehensive-audit-logging. Update Purpose after archive.
## Requirements
### Requirement: Automatic Request Logging

The system SHALL automatically capture all authenticated API requests and store them as immutable audit events without requiring manual instrumentation.

#### Scenario: Successful API request logged

- **WHEN** an authenticated user makes a POST request to `/users` with valid data
- **THEN** an audit event is created with:
  - `actorId` = current user ID from JWT token
  - `action` = "POST /users"
  - `entityType` = "user"
  - `ipAddress` = client IP from X-Forwarded-For header or request.ip
  - `userAgent` = client user agent string
  - `afterState` = request body (JSON)
  - `createdAt` = current timestamp
  - `hash` = SHA-256 hash of event data + previous hash
  - `prevHash` = hash of most recent previous event

#### Scenario: Failed API request logged

- **WHEN** an authenticated user makes a DELETE request to `/users/999` that fails with 404
- **THEN** an audit event is created with:
  - `actorId` = current user ID
  - `action` = "DELETE /users/999"
  - `entityType` = "user"
  - `entityId` = "999"
  - `ipAddress` and `userAgent` captured
  - `afterState` = error details (status code, message)

#### Scenario: Unauthenticated requests not logged

- **WHEN** an unauthenticated request is made to `/auth/login`
- **THEN** no audit event is created (logging requires authenticated user context)

#### Scenario: Excluded routes not logged

- **WHEN** a request is made to health check endpoint `/health`
- **THEN** no audit event is created (excluded routes: `/health`, `/metrics`)

### Requirement: Event Filtering by Date Range

The system SHALL allow administrators to filter audit events by a specific date range using start and end date parameters.

#### Scenario: Filter events within date range

- **WHEN** an admin requests `/audit?startDate=2025-11-01&endDate=2025-11-15`
- **THEN** the system returns only audit events where `createdAt` is between 2025-11-01 00:00:00 and 2025-11-15 23:59:59 UTC

#### Scenario: Filter with start date only

- **WHEN** an admin requests `/audit?startDate=2025-11-10`
- **THEN** the system returns all audit events where `createdAt` >= 2025-11-10 00:00:00 UTC

#### Scenario: Filter with end date only

- **WHEN** an admin requests `/audit?endDate=2025-11-15`
- **THEN** the system returns all audit events where `createdAt` <= 2025-11-15 23:59:59 UTC

#### Scenario: Invalid date format rejected

- **WHEN** an admin requests `/audit?startDate=invalid-date`
- **THEN** the system returns HTTP 400 with error message "Invalid date format. Use YYYY-MM-DD"

### Requirement: Event Filtering by User

The system SHALL allow administrators to filter audit events by a specific user (actorId) to track all actions performed by that user.

#### Scenario: Filter events by specific user

- **WHEN** an admin requests `/audit?userId=5`
- **THEN** the system returns only audit events where `actorId` = 5
- **AND** each event includes the actor's name and email in the response

#### Scenario: Filter by user with no events

- **WHEN** an admin requests `/audit?userId=999` for a user with no logged actions
- **THEN** the system returns an empty events array

#### Scenario: Non-numeric userId rejected

- **WHEN** an admin requests `/audit?userId=abc`
- **THEN** the system returns HTTP 400 with error message "userId must be a number"

### Requirement: Combined Filtering

The system SHALL support simultaneous filtering by multiple criteria (date range AND user) to enable targeted investigations.

#### Scenario: Filter by user and date range

- **WHEN** an admin requests `/audit?userId=5&startDate=2025-11-01&endDate=2025-11-15`
- **THEN** the system returns only audit events where:
  - `actorId` = 5
  - **AND** `createdAt` is between 2025-11-01 and 2025-11-15

#### Scenario: All filters applied

- **WHEN** an admin requests `/audit?userId=5&startDate=2025-11-10&endDate=2025-11-15&action=POST&limit=50`
- **THEN** the system returns up to 50 audit events matching all criteria

### Requirement: Event Immutability

The system SHALL ensure audit events cannot be modified or deleted through the application interface, maintaining integrity of the audit trail.

#### Scenario: No update endpoint exists

- **WHEN** an attacker attempts to send PATCH `/audit/123` with modified data
- **THEN** the system returns HTTP 404 (endpoint does not exist)

#### Scenario: No delete endpoint exists

- **WHEN** an attacker attempts to send DELETE `/audit/123`
- **THEN** the system returns HTTP 404 (endpoint does not exist)

#### Scenario: Hash chain integrity maintained

- **WHEN** multiple audit events are created sequentially
- **THEN** each event's `hash` is computed from its data + `prevHash`
- **AND** any break in the chain is detectable by hash verification

### Requirement: Permission-Based Access

The system SHALL restrict access to audit event viewing to users with the `audit:Read` permission.

#### Scenario: Admin with permission views audit log

- **WHEN** a user with `audit:Read` permission requests `/audit`
- **THEN** the system returns audit events (up to limit)

#### Scenario: User without permission denied access

- **WHEN** a user without `audit:Read` permission requests `/audit`
- **THEN** the system returns HTTP 403 Forbidden

#### Scenario: Unauthenticated user denied access

- **WHEN** an unauthenticated request is made to `/audit`
- **THEN** the system returns HTTP 401 Unauthorized

### Requirement: Event Ordering and Pagination

The system SHALL return audit events in reverse chronological order (newest first) with configurable result limits.

#### Scenario: Default limit applied

- **WHEN** an admin requests `/audit` without a limit parameter
- **THEN** the system returns the 100 most recent events ordered by `createdAt` DESC

#### Scenario: Custom limit applied

- **WHEN** an admin requests `/audit?limit=50`
- **THEN** the system returns the 50 most recent events ordered by `createdAt` DESC

#### Scenario: Maximum limit enforced

- **WHEN** an admin requests `/audit?limit=10000`
- **THEN** the system returns at most 1000 events (system maximum limit)

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

