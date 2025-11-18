# Audit Export Capability

## ADDED Requirements

### Requirement: CSV Export Generation

The system SHALL generate CSV files containing audit event data that matches the applied filter criteria.

#### Scenario: Export all recent events

- **WHEN** an admin requests `/audit/export` without filters
- **THEN** the system generates a CSV file with columns:
  - Timestamp (createdAt in ISO 8601 format)
  - Actor ID
  - Actor Name
  - Actor Email
  - Action
  - Entity Type
  - Entity ID
  - IP Address
  - User Agent
  - Before State (JSON string)
  - After State (JSON string)
  - Hash
- **AND** returns the file with Content-Type: text/csv
- **AND** filename is "audit-log-YYYY-MM-DD.csv" with current date

#### Scenario: Export filtered events

- **WHEN** an admin requests `/audit/export?userId=5&startDate=2025-11-01&endDate=2025-11-15`
- **THEN** the CSV file contains only events matching:
  - `actorId` = 5
  - `createdAt` between 2025-11-01 and 2025-11-15
- **AND** the filename is "audit-log-user-5-2025-11-01-to-2025-11-15.csv"

#### Scenario: Export with no matching events

- **WHEN** an admin requests `/audit/export?userId=999` for a user with no events
- **THEN** the system returns a CSV file with headers only (no data rows)

#### Scenario: Export large dataset streams

- **WHEN** an admin exports 100,000 events
- **THEN** the system streams the CSV incrementally without loading all data into memory
- **AND** download starts immediately (within 1 second)

### Requirement: Export Permission Control

The system SHALL restrict export functionality to users with the `audit:Export` permission, which is granted to Admin role by default.

#### Scenario: Admin exports successfully

- **WHEN** a user with Admin role and `audit:Export` permission requests `/audit/export`
- **THEN** the system generates and returns the CSV file

#### Scenario: User without export permission denied

- **WHEN** a user with only `audit:Read` permission (but not `audit:Export`) requests `/audit/export`
- **THEN** the system returns HTTP 403 Forbidden with message "Insufficient permissions to export audit logs"

#### Scenario: ReadOnly role cannot export

- **WHEN** a user with ReadOnly role requests `/audit/export`
- **THEN** the system returns HTTP 403 Forbidden

#### Scenario: Unauthenticated export attempt blocked

- **WHEN** an unauthenticated request is made to `/audit/export`
- **THEN** the system returns HTTP 401 Unauthorized

### Requirement: Export Time Range Limits

The system SHALL enforce a maximum export time range to prevent system overload, configured via MAX_AUDIT_EXPORT_MONTHS environment variable (default: 3 months).

#### Scenario: Export within allowed range succeeds

- **WHEN** an admin requests `/audit/export?startDate=2025-11-01&endDate=2025-11-30`
- **AND** MAX_AUDIT_EXPORT_MONTHS is set to 3
- **THEN** the export succeeds (30 days < 90 days limit)

#### Scenario: Export exceeding maximum range rejected

- **WHEN** an admin requests `/audit/export?startDate=2025-05-01&endDate=2025-11-17`
- **AND** MAX_AUDIT_EXPORT_MONTHS is set to 3
- **THEN** the system returns HTTP 400 Bad Request with message "Export range cannot exceed 3 months"

#### Scenario: Export without date range allowed

- **WHEN** an admin requests `/audit/export` without startDate or endDate
- **THEN** the export succeeds with default limit (most recent 100 events)
- **AND** no time range validation is applied

#### Scenario: Custom maximum export range enforced

- **WHEN** MAX_AUDIT_EXPORT_MONTHS is set to 6
- **AND** an admin requests a 5-month export range
- **THEN** the export succeeds (within custom limit)

### Requirement: Export Data Integrity

The system SHALL include all audit event data in exports with proper escaping and encoding to prevent data corruption.

#### Scenario: Special characters escaped in CSV

- **WHEN** an audit event contains `afterState` with JSON: `{"name": "Test, Inc.", "note": "Line1\nLine2"}`
- **AND** the event is exported to CSV
- **THEN** the field is properly escaped with quotes: `"{\"name\": \"Test, Inc.\", \"note\": \"Line1\\nLine2\"}"`

#### Scenario: Unicode characters preserved

- **WHEN** an audit event contains Unicode characters (e.g., emoji, non-Latin scripts)
- **AND** the event is exported to CSV
- **THEN** the CSV file uses UTF-8 encoding and preserves all characters correctly

#### Scenario: Null values handled

- **WHEN** an audit event has null `entityId`, `ipAddress`, `beforeState`
- **AND** the event is exported to CSV
- **THEN** null fields are represented as empty strings in the CSV

### Requirement: Export File Naming

The system SHALL generate descriptive filenames for exported CSV files that reflect the applied filters and export date.

#### Scenario: Filename with date range

- **WHEN** an admin exports events from 2025-11-01 to 2025-11-15
- **THEN** the filename is "audit-log-2025-11-01-to-2025-11-15.csv"

#### Scenario: Filename with user filter

- **WHEN** an admin exports events for userId=5 without date filters
- **THEN** the filename is "audit-log-user-5-YYYY-MM-DD.csv" where YYYY-MM-DD is current date

#### Scenario: Filename with combined filters

- **WHEN** an admin exports events for userId=5 from 2025-11-01 to 2025-11-15
- **THEN** the filename is "audit-log-user-5-2025-11-01-to-2025-11-15.csv"

#### Scenario: Default filename for unfiltered export

- **WHEN** an admin exports without any filters
- **THEN** the filename is "audit-log-YYYY-MM-DD.csv" where YYYY-MM-DD is current date

### Requirement: Export Performance

The system SHALL complete CSV export generation without blocking other API operations and provide responsive download initiation.

#### Scenario: Export initiation within 1 second

- **WHEN** an admin requests an export of any size
- **THEN** the HTTP response headers are sent within 1 second
- **AND** the download starts immediately in the browser

#### Scenario: Large export does not block API

- **WHEN** a 500,000-event export is in progress
- **THEN** other API endpoints remain responsive (<100ms p95 latency)

#### Scenario: Concurrent exports handled

- **WHEN** 5 admins simultaneously request exports
- **THEN** all exports proceed concurrently without errors
- **AND** each receives their correctly filtered CSV file
