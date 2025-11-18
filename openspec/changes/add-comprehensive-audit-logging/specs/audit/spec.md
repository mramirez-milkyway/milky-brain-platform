# Audit Capability - Spec Delta

## MODIFIED Requirements

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
