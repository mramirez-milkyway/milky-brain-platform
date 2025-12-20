## ADDED Requirements

### Requirement: IMAI Profile Lookup

The system SHALL provide an endpoint to look up influencer profiles from IMAI API for identity verification before adding new influencers.

#### Scenario: Successful profile lookup

- **WHEN** user calls `GET /api/integrations/imai/profile?handle=@johndoe&platform=instagram`
- **THEN** the system queries IMAI API with the provided handle and platform
- **AND** returns profile data: `{ found: true, profile: { handle, platform, fullName, bio, profilePicUrl, followers, engagementRate }, cached: false }`

#### Scenario: Profile not found in IMAI

- **WHEN** user calls `GET /api/integrations/imai/profile?handle=@nonexistent&platform=instagram`
- **AND** IMAI API returns no matching profile
- **THEN** the system returns `{ found: false, profile: null, cached: false }`
- **AND** HTTP status is 200 (not 404, as this is a valid search result)

#### Scenario: Cached profile returned

- **WHEN** user calls profile lookup for a handle that was looked up within the last 5 minutes
- **THEN** the system returns cached profile data from Redis
- **AND** response includes `{ cached: true }`
- **AND** no IMAI API call is made

#### Scenario: IMAI API unavailable

- **WHEN** user calls profile lookup
- **AND** IMAI API is unreachable or returns an error
- **THEN** the system returns HTTP 503 Service Unavailable
- **AND** error message: "IMAI service is temporarily unavailable. Please try again later."

#### Scenario: Missing required parameters

- **WHEN** user calls `GET /api/integrations/imai/profile` without handle or platform
- **THEN** the system returns HTTP 400 Bad Request
- **AND** error message indicates missing required parameter

### Requirement: Create Influencer with IMAI Verification

The system SHALL allow authorized users to create new influencer records after verifying identity via IMAI profile lookup.

#### Scenario: Create new influencer

- **WHEN** user with `creator:Create` permission calls `POST /api/creators` with valid payload
- **AND** payload includes: `{ handle: "@johndoe", platform: "instagram", fullName: "John Doe", country: "US", ... }`
- **THEN** the system creates a new Creator record
- **AND** creates a linked CreatorSocial record with handle and platform
- **AND** returns HTTP 201 with created record

#### Scenario: Create influencer restores soft-deleted record

- **WHEN** user calls `POST /api/creators` with handle "@johndoe" and platform "instagram"
- **AND** a Creator/CreatorSocial record exists with that handle+platform but has `deletedAt` set
- **THEN** the system clears `deletedAt` on the existing record (restores it)
- **AND** updates the record with new payload data
- **AND** returns HTTP 200 with restored record
- **AND** response includes `{ restored: true }`

#### Scenario: Create influencer fails for active duplicate

- **WHEN** user calls `POST /api/creators` with handle "@johndoe" and platform "instagram"
- **AND** an active Creator/CreatorSocial record exists with that handle+platform (deletedAt is null)
- **THEN** the system returns HTTP 409 Conflict
- **AND** error message: "An influencer with this handle already exists on this platform."

#### Scenario: Create without permission denied

- **WHEN** user without `creator:Create` permission calls `POST /api/creators`
- **THEN** the system returns HTTP 403 Forbidden

#### Scenario: Create with missing required fields

- **WHEN** user calls `POST /api/creators` without required field `handle`
- **THEN** the system returns HTTP 400 Bad Request
- **AND** error message indicates missing required field

### Requirement: Edit Influencer

The system SHALL allow authorized users to edit existing influencer records.

#### Scenario: Update influencer details

- **WHEN** user with `creator:Update` permission calls `PATCH /api/creators/:id` with payload `{ country: "UK", gender: "female" }`
- **THEN** the system updates only the provided fields
- **AND** other fields remain unchanged
- **AND** returns HTTP 200 with updated record

#### Scenario: Update influencer not found

- **WHEN** user calls `PATCH /api/creators/99999` for non-existent ID
- **THEN** the system returns HTTP 404 Not Found

#### Scenario: Update soft-deleted influencer

- **WHEN** user calls `PATCH /api/creators/:id` for a soft-deleted record
- **THEN** the system returns HTTP 404 Not Found
- **AND** error message: "Influencer not found"

#### Scenario: Update without permission denied

- **WHEN** user without `creator:Update` permission calls `PATCH /api/creators/:id`
- **THEN** the system returns HTTP 403 Forbidden

#### Scenario: Update handle to existing handle

- **WHEN** user calls `PATCH /api/creators/:id` with `{ handle: "@existinghandle" }`
- **AND** another active influencer already has that handle on the same platform
- **THEN** the system returns HTTP 409 Conflict

### Requirement: Soft Delete Influencer

The system SHALL allow authorized users to soft delete influencer records.

#### Scenario: Soft delete influencer

- **WHEN** user with `creator:Delete` permission calls `DELETE /api/creators/:id`
- **THEN** the system sets `deletedAt = now()` on the Creator record
- **AND** sets `deletedAt = now()` on all associated CreatorSocial records
- **AND** returns HTTP 200 with success message

#### Scenario: Delete influencer not found

- **WHEN** user calls `DELETE /api/creators/99999` for non-existent ID
- **THEN** the system returns HTTP 404 Not Found

#### Scenario: Delete already deleted influencer

- **WHEN** user calls `DELETE /api/creators/:id` for a soft-deleted record
- **THEN** the system returns HTTP 404 Not Found

#### Scenario: Delete without permission denied

- **WHEN** user without `creator:Delete` permission calls `DELETE /api/creators/:id`
- **THEN** the system returns HTTP 403 Forbidden

### Requirement: Permission-Based Access Control for Influencer Management

The system SHALL restrict influencer create, update, and delete operations based on user permissions.

#### Scenario: Admin has all influencer management permissions

- **WHEN** a user with Admin role attempts any influencer management action
- **THEN** the action is permitted via wildcard permission `*`

#### Scenario: Editor has create and update permissions

- **WHEN** a user with Editor role is assigned permissions
- **THEN** the role includes `creator:Create` and `creator:Update`
- **AND** the user can add and edit influencers
- **AND** the user cannot delete influencers (no `creator:Delete`)

#### Scenario: Viewer has no management permissions

- **WHEN** a user with Viewer role attempts to create, update, or delete an influencer
- **THEN** all operations return HTTP 403 Forbidden
- **AND** management action buttons are hidden in UI

### Requirement: Add Influencer UI Flow

The system SHALL provide a two-step UI flow for adding influencers with IMAI verification.

#### Scenario: Step 1 - Handle lookup

- **WHEN** user opens Add Influencer modal
- **THEN** the modal displays input for social handle and platform selector
- **AND** user enters handle and clicks "Lookup"
- **AND** system calls IMAI profile lookup endpoint

#### Scenario: Step 2 - Profile preview and confirmation

- **WHEN** IMAI lookup returns a profile
- **THEN** the modal displays Profile Preview Card with: avatar, name, bio, follower count, platform badge
- **AND** displays "Yes, this is the correct influencer" confirmation button
- **AND** displays "No, try a different handle" button

#### Scenario: Proceed to full form after confirmation

- **WHEN** user clicks "Yes, this is the correct influencer"
- **THEN** the modal transitions to full form
- **AND** form fields are pre-filled with IMAI data (fullName, followers, etc.)
- **AND** user can edit pre-filled values and add additional fields

#### Scenario: Lookup returns no result

- **WHEN** IMAI lookup returns `{ found: false }`
- **THEN** the modal displays error message: "Influencer not found on [platform]. Please check the handle and try again."
- **AND** user remains on Step 1

#### Scenario: Form validation on save

- **WHEN** user attempts to save the form with empty required fields
- **THEN** the system displays inline validation errors
- **AND** prevents form submission until required fields are filled

### Requirement: Edit Influencer UI

The system SHALL provide a form for editing existing influencer records.

#### Scenario: Open edit modal

- **WHEN** user with `creator:Update` permission clicks "Edit" on an influencer row
- **THEN** the system opens edit modal pre-filled with current influencer data

#### Scenario: Edit button hidden without permission

- **WHEN** user without `creator:Update` permission views influencer list
- **THEN** the "Edit" button is not rendered

#### Scenario: Save changes

- **WHEN** user modifies fields and clicks "Save"
- **THEN** the system calls `PATCH /api/creators/:id` with changed fields
- **AND** displays success toast: "Influencer updated successfully"
- **AND** closes modal and refreshes list

### Requirement: Delete Influencer UI

The system SHALL provide confirmation dialog for deleting influencers.

#### Scenario: Open delete confirmation

- **WHEN** user with `creator:Delete` permission clicks "Delete" on an influencer row
- **THEN** the system displays confirmation dialog: "Are you sure you want to delete [Name]? This influencer will be hidden from all lists."

#### Scenario: Confirm delete

- **WHEN** user clicks "Delete" in confirmation dialog
- **THEN** the system calls `DELETE /api/creators/:id`
- **AND** displays success toast: "Influencer deleted successfully"
- **AND** removes influencer from list (optimistic update)

#### Scenario: Cancel delete

- **WHEN** user clicks "Cancel" in confirmation dialog
- **THEN** the dialog closes
- **AND** no API call is made

#### Scenario: Delete button hidden without permission

- **WHEN** user without `creator:Delete` permission views influencer list
- **THEN** the "Delete" button is not rendered

### Requirement: Audit Trail for Influencer Management

The system SHALL log all influencer management operations to the audit table.

#### Scenario: Create operation audited

- **WHEN** a user creates a new influencer
- **THEN** an audit event is created with:
  - `actorId` = current user ID
  - `action` = "CREATE Creator"
  - `entityType` = "creator"
  - `entityId` = new creator ID
  - `afterState` = created record data

#### Scenario: Update operation audited

- **WHEN** a user updates an influencer
- **THEN** an audit event is created with:
  - `action` = "UPDATE Creator"
  - `beforeState` = previous record data
  - `afterState` = updated record data

#### Scenario: Delete operation audited

- **WHEN** a user soft deletes an influencer
- **THEN** an audit event is created with:
  - `action` = "DELETE Creator"
  - `beforeState` = record data before deletion
  - `afterState` = `{ deletedAt: timestamp }`

#### Scenario: Restore operation audited

- **WHEN** a soft-deleted influencer is restored via create
- **THEN** an audit event is created with:
  - `action` = "RESTORE Creator"
  - `beforeState` = `{ deletedAt: previous timestamp }`
  - `afterState` = updated record data
