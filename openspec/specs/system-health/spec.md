# system-health Specification

## Purpose
TBD - created by archiving change add-system-health-logs. Update Purpose after archive.
## Requirements
### Requirement: System Log Entity
The system SHALL persist unhandled exceptions in a `SystemLog` database entity with the following fields:
- `id`: Auto-incrementing primary key
- `context`: String identifying the source (e.g., "API", "Lambda:job-processor")
- `errorMessage`: Text field with short error summary
- `stackTrace`: Text field with full stack trace
- `metadata`: JSONB field for flexible debugging data (request path, user ID, input parameters)
- `createdAt`: Timestamp of when the error occurred

#### Scenario: API exception logged
- **WHEN** an unhandled 5xx exception occurs in the API
- **THEN** a SystemLog record is created with context "API", the error message, full stack trace, and request metadata

#### Scenario: Lambda exception logged
- **WHEN** an unhandled exception occurs in a Lambda function
- **THEN** a SystemLog record is created with context "Lambda:{function-name}", the error message, full stack trace, and job metadata

### Requirement: Global Exception Filter
The API SHALL implement a global exception filter that intercepts all unhandled exceptions.

#### Scenario: 5xx error captured
- **WHEN** an exception results in a 5xx HTTP status code
- **THEN** the exception is logged to SystemLog with full stack trace and metadata
- **AND** the appropriate HTTP error response is returned to the client

#### Scenario: 4xx error not captured
- **WHEN** an exception results in a 4xx HTTP status code (BadRequest, Unauthorized, Forbidden, NotFound)
- **THEN** the exception is NOT logged to SystemLog
- **AND** the appropriate HTTP error response is returned to the client

### Requirement: Lambda Error Wrapper
The Lambda handler entry point SHALL wrap execution in a try/catch block to capture unhandled exceptions.

#### Scenario: Unhandled Lambda exception
- **WHEN** an unhandled exception bubbles up to the Lambda handler
- **THEN** the exception is logged to SystemLog before re-throwing
- **AND** the exception propagates to AWS for standard error handling

### Requirement: System Health Logs List Endpoint
The API SHALL provide an endpoint to list system logs with pagination and filtering.

#### Scenario: List logs with pagination
- **WHEN** a GET request is made to `/api/system-health/logs`
- **THEN** the response contains a paginated list of system logs ordered by createdAt descending
- **AND** each log entry includes id, context, errorMessage (truncated), and createdAt

#### Scenario: Filter logs by context
- **WHEN** a GET request includes a `context` query parameter
- **THEN** only logs matching that context are returned

#### Scenario: Filter logs by date range
- **WHEN** a GET request includes `startDate` and/or `endDate` query parameters
- **THEN** only logs within that date range are returned

### Requirement: System Health Log Detail Endpoint
The API SHALL provide an endpoint to retrieve a single system log with full details.

#### Scenario: Get log by ID
- **WHEN** a GET request is made to `/api/system-health/logs/:id`
- **THEN** the response contains the full log record including stackTrace and metadata

#### Scenario: Log not found
- **WHEN** a GET request is made with an invalid log ID
- **THEN** a 404 Not Found response is returned

### Requirement: System Health Permission
Access to system health logs SHALL require the `systemHealth:Read` permission.

#### Scenario: Authorized access
- **WHEN** a user with `systemHealth:Read` permission accesses system health endpoints
- **THEN** the request is processed normally

#### Scenario: Unauthorized access
- **WHEN** a user without `systemHealth:Read` permission accesses system health endpoints
- **THEN** a 403 Forbidden response is returned

#### Scenario: Admin role has permission
- **WHEN** a user with Admin role is created
- **THEN** the user has `systemHealth:Read` permission by default

### Requirement: System Health UI Panel
The frontend SHALL provide a System Health panel visible only to users with `systemHealth:Read` permission.

#### Scenario: Panel visible to authorized users
- **WHEN** a user with `systemHealth:Read` permission views the admin panel
- **THEN** the System Health navigation item is visible in the sidebar

#### Scenario: Panel hidden from unauthorized users
- **WHEN** a user without `systemHealth:Read` permission views the admin panel
- **THEN** the System Health navigation item is not visible

### Requirement: System Health Logs List View
The System Health panel SHALL display a list of system errors.

#### Scenario: Display error list
- **WHEN** a user navigates to the System Health panel
- **THEN** a table displays: Context, Error Summary (truncated), and Timestamp
- **AND** logs are sorted by most recent first

#### Scenario: Click to view details
- **WHEN** a user clicks on a log entry in the list
- **THEN** the user is navigated to the detail view for that log

### Requirement: System Health Log Detail View
The System Health panel SHALL provide a detailed view of each error log.

#### Scenario: Display full error details
- **WHEN** a user views a log detail page
- **THEN** the full stack trace is displayed in a monospace font with preserved whitespace
- **AND** the metadata is displayed in a readable JSON format
- **AND** the context, error message, and timestamp are prominently shown

#### Scenario: Navigate back to list
- **WHEN** a user is on the detail view
- **THEN** a back button allows returning to the logs list

