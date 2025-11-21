# user-invitations Specification

## Purpose
TBD - created by archiving change add-user-management-panel. Update Purpose after archive.
## Requirements
### Requirement: Invitation Creation
The system SHALL allow Admins to invite new users via email with role assignment.

#### Scenario: Successful invitation
- **WHEN** an Admin with `user:Create` permission submits an invitation with email and role
- **THEN** the system creates a user record with `status = 'INVITED'`
- **AND** generates a secure random invitation token
- **AND** stores the token with 30-day expiration in the database
- **AND** assigns the specified role to the user
- **AND** sends an invitation email to the provided address
- **AND** returns success with the created user details

#### Scenario: Duplicate email invitation
- **WHEN** an Admin attempts to invite a user with an existing email address
- **THEN** the system rejects the invitation with a clear error message
- **AND** suggests checking the existing user list

#### Scenario: Invalid email format
- **WHEN** an Admin submits an invitation with an invalid email format
- **THEN** the system rejects the request with a validation error
- **AND** returns specific feedback about the email format issue

### Requirement: Domain Restriction
The system SHALL restrict invitation sending to Admins with authorized email domains.

#### Scenario: Authorized domain sends invitation
- **WHEN** an Admin whose email domain is in `ALLOWED_INVITE_DOMAINS` sends an invitation
- **THEN** the system processes the invitation normally

#### Scenario: Unauthorized domain attempts invitation
- **WHEN** an Admin whose email domain is NOT in `ALLOWED_INVITE_DOMAINS` attempts to send an invitation
- **THEN** the system rejects the request with a 403 Forbidden error
- **AND** returns message "Invitations restricted to authorized domains"
- **AND** logs the attempt in the audit trail

#### Scenario: Configuration missing
- **WHEN** `ALLOWED_INVITE_DOMAINS` environment variable is not set
- **THEN** the system allows invitations from any Admin (fallback behavior)
- **AND** logs a warning about missing domain configuration

### Requirement: Invitation Email
The system SHALL send professional HTML email invitations with secure links.

#### Scenario: Email content
- **WHEN** an invitation email is sent
- **THEN** the email includes a welcome message
- **AND** contains a prominent call-to-action button with the invitation link
- **AND** displays the inviting organization name
- **AND** shows the assigned role
- **AND** mentions the link expires in 30 days
- **AND** includes a plain-text fallback version

#### Scenario: Invitation link format
- **WHEN** an invitation email is generated
- **THEN** the invitation link format is `{FRONTEND_URL}/accept-invite?token={secure_token}`
- **AND** the token is a URL-safe base64-encoded random string

#### Scenario: Email delivery tracking
- **WHEN** an invitation email is sent
- **THEN** the system logs the email event in the audit trail
- **AND** records the recipient, sender, and timestamp

#### Scenario: Email send failure
- **WHEN** the email service fails to send an invitation
- **THEN** the system returns an error to the Admin
- **AND** does not create the user record (transaction rollback)
- **AND** logs the failure with error details

### Requirement: Invitation Resend
The system SHALL allow Admins to resend invitations for INVITED users.

#### Scenario: Resend expired invitation
- **WHEN** an Admin clicks "Resend Invitation" for an INVITED user with expired token
- **THEN** the system generates a new invitation token
- **AND** deletes the old token
- **AND** sets expiration to 30 days from current time
- **AND** sends a new invitation email
- **AND** does not modify the user's assigned role

#### Scenario: Resend valid invitation
- **WHEN** an Admin resends an invitation for an INVITED user with valid, unexpired token
- **THEN** the system generates a new invitation token
- **AND** deletes the old token (invalidating previous link)
- **AND** sets expiration to 30 days from current time
- **AND** sends a new invitation email

#### Scenario: Resend for active user
- **WHEN** an Admin attempts to resend an invitation for an ACTIVE user
- **THEN** the system rejects the request with an error
- **AND** returns message "Cannot resend invitation for active users"

#### Scenario: Resend for deactivated user
- **WHEN** an Admin attempts to resend an invitation for a DEACTIVATED user
- **THEN** the system rejects the request with an error
- **AND** returns message "Cannot resend invitation for deactivated users"

### Requirement: Invitation Token Validation
The system SHALL validate invitation tokens for security and expiration.

#### Scenario: Token expiration check
- **WHEN** an invitation token is accessed after 30 days
- **THEN** the system rejects the token as expired
- **AND** prompts the user to request a new invitation

#### Scenario: Token uniqueness
- **WHEN** generating a new invitation token
- **THEN** the system ensures the token is globally unique
- **AND** uses cryptographically secure random generation (`crypto.randomBytes`)

#### Scenario: One-time use enforcement
- **WHEN** an invitation token is successfully used
- **THEN** the system deletes the token from the database
- **AND** subsequent attempts to use the same token fail

