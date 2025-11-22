# Capability: Google OAuth Hardening

## ADDED Requirements

### Requirement: Domain Restriction at OAuth Level
The system SHALL enforce domain restrictions during Google OAuth authentication.

#### Scenario: Valid domain authentication
- **WHEN** a user with email `@milkyway-agency.com` (or other domain in `ALLOWED_INVITE_DOMAINS`) initiates Google OAuth
- **THEN** the system includes the `hd` parameter in the OAuth request
- **AND** Google displays the consent screen for that domain
- **AND** the OAuth flow completes successfully

#### Scenario: Invalid domain rejection at OAuth consent
- **WHEN** a user attempts to sign in with a Google account from a non-allowed domain
- **THEN** Google's consent screen displays an error
- **AND** the user never reaches the callback endpoint
- **AND** the error message indicates domain restriction

#### Scenario: Domain validation in OAuth callback
- **WHEN** the OAuth callback receives a user profile
- **THEN** the system extracts the domain from the user's email
- **AND** compares it against `ALLOWED_INVITE_DOMAINS` environment variable
- **AND** if domain not in allowed list, throws `UnauthorizedException` with message "Invalid email domain"
- **AND** redirects to login page with error displayed

#### Scenario: Multiple allowed domains
- **WHEN** `ALLOWED_INVITE_DOMAINS` contains multiple comma-separated domains (e.g., `milkyway-agency.com,partner-agency.com`)
- **THEN** the system accepts any user whose email domain matches one of the configured domains
- **AND** the `hd` parameter uses the first domain in the list for OAuth consent screen

#### Scenario: Missing domain configuration in production
- **WHEN** `ALLOWED_INVITE_DOMAINS` is not set in production environment
- **THEN** the system defaults to `milkyway-agency.com`
- **AND** logs a warning about missing configuration
- **AND** authentication continues with default domain

#### Scenario: Missing domain configuration in development
- **WHEN** `ALLOWED_INVITE_DOMAINS` is not set in development environment
- **THEN** the system logs a warning
- **AND** defaults to `milkyway-agency.com`
- **AND** authentication continues

### Requirement: Invitation-Only Authentication
The system SHALL only allow users with existing invitations to authenticate.

#### Scenario: First-time sign-in with valid invitation
- **WHEN** a user with `status = 'INVITED'` completes Google OAuth for the first time
- **THEN** the system validates their email matches the invitation
- **AND** updates user status to `ACTIVE`
- **AND** assigns the role from the invitation
- **AND** deletes the invitation token
- **AND** creates a new session with access and refresh tokens
- **AND** redirects to the main application page

#### Scenario: First-time sign-in without invitation
- **WHEN** a user who does not exist in the database completes Google OAuth
- **THEN** the system throws `UnauthorizedException` with message "No invitation found. Please contact your administrator."
- **AND** does NOT create a user record
- **AND** redirects to login page with error displayed
- **AND** logs the attempt in audit trail

#### Scenario: Sign-in attempt with deactivated account
- **WHEN** a user with `status = 'DEACTIVATED'` attempts to sign in
- **THEN** the system throws `UnauthorizedException` with message "Account has been deactivated"
- **AND** does not create a new session
- **AND** redirects to login page with error displayed
- **AND** logs the attempt in audit trail

#### Scenario: Returning user sign-in
- **WHEN** a user with `status = 'ACTIVE'` completes Google OAuth
- **THEN** the system validates their email and domain
- **AND** updates `lastSeenAt` timestamp
- **AND** creates a new session with access and refresh tokens
- **AND** redirects to the main application page

#### Scenario: Expired invitation token on sign-in
- **WHEN** a user with `status = 'INVITED'` signs in but their invitation token has expired
- **THEN** the system still allows authentication
- **AND** activates the user account
- **AND** assigns the role from the invitation
- **AND** deletes the expired token
- **AND** logs a warning about expired token acceptance

### Requirement: OAuth Error Handling
The system SHALL provide clear error messages for authentication failures.

#### Scenario: Domain error display on login page
- **WHEN** OAuth callback fails due to domain restriction
- **THEN** the system redirects to `/login?error=invalid_domain`
- **AND** the login page displays error message "Invalid email domain. Please use your @milkyway-agency.com account."
- **AND** the error message is generic (does not reveal internal system details)
- **AND** the error auto-dismisses after 5 seconds or user interaction

#### Scenario: No invitation error display
- **WHEN** OAuth callback fails due to missing invitation
- **THEN** the system redirects to `/login?error=no_invitation`
- **AND** the login page displays error message "No invitation found. Please contact your administrator."
- **AND** the error persists until user dismisses it

#### Scenario: Deactivated account error display
- **WHEN** OAuth callback fails due to deactivated account
- **THEN** the system redirects to `/login?error=account_deactivated`
- **AND** the login page displays error message "Your account has been deactivated. Please contact your administrator."
- **AND** the error persists until user dismisses it

### Requirement: OAuth Configuration
The system SHALL properly configure Google OAuth strategy with domain restrictions.

#### Scenario: Google OAuth strategy configuration
- **WHEN** the NestJS application initializes
- **THEN** the Google OAuth strategy includes the following configuration:
  - `clientID` from `GOOGLE_CLIENT_ID` environment variable
  - `clientSecret` from `GOOGLE_CLIENT_SECRET` environment variable
  - `callbackURL` as `{API_URL}/auth/google/callback`
  - `scope` includes `email` and `profile`
  - `hd` parameter set to first domain in `ALLOWED_INVITE_DOMAINS`
- **AND** throws error if `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` not set

#### Scenario: OAuth callback URL validation
- **WHEN** Google redirects to the callback URL after authentication
- **THEN** the callback URL must match the configured `callbackURL` exactly
- **AND** the system validates the state parameter to prevent CSRF
- **AND** rejects callbacks with mismatched state or invalid authorization codes
