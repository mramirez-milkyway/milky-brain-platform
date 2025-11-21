# activity-tracking Specification

## Purpose
TBD - created by archiving change add-user-management-panel. Update Purpose after archive.
## Requirements
### Requirement: Meaningful Activity Detection
The system SHALL track user activity for monitoring and audit purposes.

#### Scenario: Update on mutation requests
- **WHEN** an authenticated user makes a POST, PUT, PATCH, or DELETE request
- **THEN** the system updates the user's `lastSeenAt` field to the current timestamp
- **AND** the update happens asynchronously (fire-and-forget)

#### Scenario: Update on export actions
- **WHEN** an authenticated user makes a GET request to export endpoints (e.g., `/audit/export`)
- **THEN** the system updates the user's `lastSeenAt` field
- **AND** treats export requests as meaningful activity

#### Scenario: Skip on read-only requests
- **WHEN** an authenticated user makes a GET request to non-export endpoints
- **THEN** the system does not update `lastSeenAt`
- **AND** reduces unnecessary database writes

#### Scenario: Skip on health checks
- **WHEN** a health check endpoint is called (e.g., `/health`, `/api/status`)
- **THEN** the system does not update any activity timestamps
- **AND** does not perform authentication checks

### Requirement: Activity Tracking Middleware
The system SHALL implement middleware to automatically track activity.

#### Scenario: Middleware placement
- **WHEN** the application starts
- **THEN** activity tracking middleware is registered after authentication middleware
- **AND** before route handlers execute

#### Scenario: Detect meaningful actions
- **WHEN** a request passes through the activity middleware
- **THEN** the middleware determines if the action is meaningful based on HTTP method and path
- **AND** uses rules: mutations (POST/PUT/PATCH/DELETE) or export endpoints (GET with `/export` in path)

#### Scenario: Async update execution
- **WHEN** the middleware identifies a meaningful action
- **THEN** it triggers an async database update for `lastSeenAt`
- **AND** does not wait for the update to complete before proceeding
- **AND** logs errors without blocking the request

#### Scenario: Error handling
- **WHEN** the `lastSeenAt` update fails
- **THEN** the middleware logs the error with userId and request details
- **AND** does not return an error to the client (graceful degradation)
- **AND** the request proceeds normally

### Requirement: Activity Display
The system SHALL display user activity in a human-readable format.

#### Scenario: Format relative time
- **WHEN** displaying `lastSeenAt` in the UI
- **THEN** the system shows relative time (e.g., "2 hours ago", "3 days ago")
- **AND** uses precise timestamps for recent activity (< 1 hour)
- **AND** displays "Never" if `lastSeenAt` is null

#### Scenario: Sort by recent activity
- **WHEN** displaying the user list
- **THEN** Admins can sort users by `lastSeenAt` descending
- **AND** most recently active users appear first

#### Scenario: Visual activity indicator
- **WHEN** a user has activity within the last hour
- **THEN** the system displays a green dot or "online" indicator
- **AND** the indicator updates based on the `lastSeenAt` timestamp

### Requirement: Activity on Login
The system SHALL update activity timestamp on successful authentication.

#### Scenario: Update on Google OAuth login
- **WHEN** a user successfully authenticates via Google OAuth
- **THEN** the system updates their `lastSeenAt` to the current timestamp
- **AND** the update happens in the `validateGoogleUser` method

#### Scenario: Activity persists across sessions
- **WHEN** a user's session expires and they re-authenticate
- **THEN** their `lastSeenAt` reflects the most recent authentication time
- **AND** previous activity history is preserved

