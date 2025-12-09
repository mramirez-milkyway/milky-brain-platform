# integrations-usage Specification

## Purpose
TBD - created by archiving change add-integrations-usage-panel. Update Purpose after archive.
## Requirements
### Requirement: Integration List Display
The system SHALL display a list of all configured integration providers in the admin panel.

#### Scenario: Admin views integrations page
- **WHEN** an admin with `integration:Read` permission navigates to `/integrations`
- **THEN** the system displays a list of all integration providers
- **AND** each provider shows its name and current status

### Requirement: Quota Information Display
The system SHALL display quota and usage information for each integration provider.

#### Scenario: Display IMAI quota information
- **WHEN** viewing the integrations page
- **THEN** the system displays the total quota (credits) for IMAI
- **AND** displays the remaining quota (credits remaining)
- **AND** shows a visual progress indicator of quota consumption

#### Scenario: Calculate quota percentage
- **WHEN** total quota is greater than zero
- **THEN** the system calculates used percentage as `((total - remaining) / total) * 100`
- **AND** displays the percentage in a progress bar

### Requirement: Real-time Quota Fetching
The system SHALL fetch current quota information from the IMAI API.

#### Scenario: Fetch IMAI account info
- **WHEN** the integrations page loads
- **THEN** the backend calls the IMAI `/account/info/` endpoint
- **AND** authenticates using the `IMAI_API_KEY` environment variable
- **AND** returns the quota data to the frontend

#### Scenario: Handle API errors gracefully
- **WHEN** the IMAI API is unavailable or returns an error
- **THEN** the system displays an error message to the user
- **AND** does not crash or show sensitive error details
- **AND** allows retry of the request

### Requirement: Permission-Based Access Control
The system SHALL restrict access to the integrations page to authorized admins only.

#### Scenario: Admin with permission accesses page
- **WHEN** a user with `integration:Read` permission navigates to `/integrations`
- **THEN** the page content is displayed

#### Scenario: User without permission is denied
- **WHEN** a user without `integration:Read` permission attempts to access `/integrations`
- **THEN** the system denies access
- **AND** displays an appropriate permission error message

### Requirement: Navigation Integration
The system SHALL provide navigation to the integrations page from the admin sidebar.

#### Scenario: Admin sees integrations menu item
- **WHEN** an admin with `integration:Read` permission views the sidebar
- **THEN** an "Integrations" menu item is visible
- **AND** clicking it navigates to `/integrations`

#### Scenario: User without permission does not see menu item
- **WHEN** a user without `integration:Read` permission views the sidebar
- **THEN** the "Integrations" menu item is not displayed

### Requirement: Loading and Error States
The system SHALL provide clear feedback during data fetching operations.

#### Scenario: Display loading state
- **WHEN** quota data is being fetched from the API
- **THEN** a loading indicator is displayed
- **AND** the user cannot interact with incomplete data

#### Scenario: Display error state with retry
- **WHEN** an API error occurs
- **THEN** an error message is displayed
- **AND** a retry button is available
- **AND** clicking retry re-fetches the data

### Requirement: Extensible Provider Architecture
The system SHALL be designed to support multiple integration providers beyond IMAI.

#### Scenario: Frontend supports multiple providers
- **WHEN** the backend returns multiple integration providers
- **THEN** the frontend displays each provider in a separate card
- **AND** each card shows provider-specific quota information

#### Scenario: Backend supports provider enumeration
- **WHEN** the `/integrations/usage` endpoint is called
- **THEN** it returns an array of provider usage data
- **AND** each provider includes: name, total quota, remaining quota, status

