# Capability: User Management

## ADDED Requirements

### Requirement: User List Display
The system SHALL display a comprehensive list of all users with their details to Admins.

#### Scenario: View all users
- **WHEN** an Admin navigates to the User Management panel
- **THEN** the system displays a list containing all users
- **AND** each user entry shows email, name, status, all assigned roles, and last activity timestamp
- **AND** the list is accessible only to users with `user:Read` permission

#### Scenario: Total active users count
- **WHEN** an Admin views the User Management panel
- **THEN** the system displays a "Total Active Users" count
- **AND** the count includes all users with `status = 'ACTIVE'`

### Requirement: Role Management
The system SHALL allow Admins to change user roles for both ACTIVE and INVITED users.

#### Scenario: Change role for active user
- **WHEN** an Admin with `user:AssignRole` permission changes a role for an ACTIVE user
- **THEN** the system updates the user's role assignment in the database
- **AND** immediately revokes all active sessions for that user
- **AND** the user must re-authenticate to continue using the system

#### Scenario: Change role for invited user
- **WHEN** an Admin with `user:AssignRole` permission changes a role for an INVITED user
- **THEN** the system updates the user's role assignment
- **AND** no session revocation occurs (user has no active sessions yet)
- **AND** when the user accepts the invitation, they receive the updated role

#### Scenario: Assign multiple roles
- **WHEN** an Admin assigns a role to a user who already has roles
- **THEN** the system adds the new role to the user's role collection
- **AND** displays all roles as badges in the user list

#### Scenario: Remove role from user
- **WHEN** an Admin removes a role from a user with `user:RemoveRole` permission
- **THEN** the system removes the specified role from the user
- **AND** immediately revokes all active sessions for ACTIVE users
- **AND** the user retains any other roles they have

### Requirement: User Deactivation
The system SHALL allow Admins to deactivate users and immediately revoke their access.

#### Scenario: Deactivate active user
- **WHEN** an Admin with `user:Delete` permission deactivates an ACTIVE user
- **THEN** the system updates the user's status to `DEACTIVATED`
- **AND** immediately revokes all active sessions for that user
- **AND** the user cannot authenticate or access the system
- **AND** the action is logged in the audit trail

#### Scenario: Deactivate invited user
- **WHEN** an Admin deactivates an INVITED user
- **THEN** the system updates the user's status to `DEACTIVATED`
- **AND** invalidates any pending invitation tokens
- **AND** the user cannot accept the invitation

#### Scenario: Prevent self-deactivation
- **WHEN** an Admin attempts to deactivate their own account
- **THEN** the system rejects the operation with an error message
- **AND** suggests contacting another Admin

### Requirement: Last Activity Tracking
The system SHALL track and display the most recent meaningful activity for each user.

#### Scenario: Display last activity
- **WHEN** an Admin views the user list
- **THEN** each user entry displays the timestamp of their last meaningful activity
- **AND** activity is shown as "Last seen: X time ago" or "Never" if no activity recorded

#### Scenario: Recent activity indicator
- **WHEN** a user has been active within the last hour
- **THEN** the system displays a visual indicator (e.g., green dot) next to their name
- **AND** the timestamp shows precise time

### Requirement: Admin-Only Access
The system SHALL restrict User Management panel access to Admin users only.

#### Scenario: Admin accesses panel
- **WHEN** a user with `user:Read` permission accesses `/users`
- **THEN** the system displays the User Management panel

#### Scenario: Non-admin denied access
- **WHEN** a user without `user:Read` permission attempts to access `/users`
- **THEN** the system returns a 403 Forbidden error
- **AND** logs the unauthorized access attempt
