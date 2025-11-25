## MODIFIED Requirements

### Requirement: Permission Checking in UI
The system SHALL hide UI elements based on user permissions.

#### Scenario: Admin sees all features
- **WHEN** a user with role `Admin` views the admin panel
- **THEN** the user sees all navigation items including:
  - Dashboard
  - Users
  - Roles
  - Audit Logs
  - Settings (with all tabs including Export Controls)
- **AND** all action buttons are visible (Create, Edit, Delete)
- **AND** no features are hidden

#### Scenario: Editor sees content features
- **WHEN** a user with role `Editor` views the admin panel
- **THEN** the user sees navigation items:
  - Dashboard
  - Settings (read/write, but Export Controls tab hidden)
- **AND** does NOT see:
  - Users
  - Roles
  - Audit Logs
- **AND** sees action buttons for content creation and editing
- **AND** sees Settings edit capabilities for General tab only

#### Scenario: Viewer sees read-only interface
- **WHEN** a user with role `Viewer` views the admin panel
- **THEN** the user sees navigation items:
  - Dashboard
  - Settings (read-only, Export Controls tab hidden)
- **AND** does NOT see:
  - Users
  - Roles
  - Audit Logs
- **AND** all action buttons are hidden (Create, Edit, Delete)
- **AND** UI displays read-only message on pages: "You have view-only access"

#### Scenario: Permission check for specific actions
- **WHEN** rendering an action button (e.g., "Invite User")
- **THEN** the component checks if user has required permission (e.g., `user:Create`)
- **AND** if permission granted, button is rendered normally
- **AND** if permission denied, button is not rendered (hidden from DOM)
- **AND** no placeholder or disabled state shown

#### Scenario: Export Controls tab visible only to Admin
- **WHEN** a user with Admin role views the Settings page
- **THEN** the page displays tabs: "General" and "Export Controls"
- **AND** both tabs are accessible
- **WHEN** a user with Editor or Viewer role views the Settings page
- **THEN** only the "General" tab is visible
- **AND** the "Export Controls" tab is not rendered in the UI

## ADDED Requirements

### Requirement: Settings Page Tab Navigation
The system SHALL organize Settings page content into multiple tabs for different configuration categories.

#### Scenario: Settings page displays tab navigation
- **WHEN** a user navigates to /settings
- **THEN** the page displays a horizontal tab navigation
- **AND** tabs are rendered using the existing Tabs UI component
- **AND** the default active tab is "General"

#### Scenario: Tab content switches on click
- **WHEN** a user clicks the "Export Controls" tab
- **THEN** the General settings content is hidden
- **AND** the Export Controls settings content is displayed
- **AND** the URL updates to /settings?tab=export-controls (optional)

#### Scenario: Tab state persists on page reload
- **WHEN** a user is viewing the "Export Controls" tab
- **AND** refreshes the browser
- **THEN** the "Export Controls" tab remains active (if URL query param used)
- **OR** defaults to "General" tab (if no URL param)

#### Scenario: Tab navigation keyboard accessible
- **WHEN** a user navigates using keyboard (Tab key)
- **THEN** tabs receive focus in order
- **AND** Enter or Space key activates the focused tab
- **AND** Arrow keys navigate between tabs

### Requirement: Export Quota Display in UI
The system SHALL display export quotas and limits to users before they attempt exports.

#### Scenario: Export quota indicator displayed
- **WHEN** a user views a page with an export feature (e.g., Influencers List)
- **THEN** the page displays an ExportQuotaIndicator component above the export button
- **AND** the indicator shows: "You can export up to [N] rows"
- **AND** shows remaining daily quota: "Remaining today: [X]/[Y] exports"
- **AND** shows remaining monthly quota: "Remaining this month: [A]/[B] exports"

#### Scenario: Unlimited quota indicator
- **WHEN** a user with Admin role views export page
- **AND** their export settings have rowLimit = -1 and no time limits
- **THEN** the quota indicator displays: "You can export unlimited rows"
- **AND** does NOT show daily/monthly quota information

#### Scenario: Quota indicator updates after export
- **WHEN** a user successfully exports a PDF
- **AND** returns to the export page
- **THEN** the quota indicator shows updated remaining count
- **AND** reflects the new ExportLog entry

#### Scenario: Quota exhausted warning
- **WHEN** a user has 0 remaining exports in their daily quota
- **THEN** the quota indicator displays in warning style (red/orange)
- **AND** shows: "Daily export limit reached (10/10). Resets at midnight UTC."
- **AND** the export button is disabled

#### Scenario: Quota near limit warning
- **WHEN** a user has 2 or fewer remaining exports in their daily quota
- **THEN** the quota indicator displays in caution style (yellow/amber)
- **AND** shows: "Remaining today: 2/10 exports (limit approaching)"

### Requirement: Export Controls Settings UI
The system SHALL provide an admin interface for configuring role-based export controls.

#### Scenario: Export Controls settings table displayed
- **WHEN** an Admin views the Export Controls tab
- **THEN** the page displays a table with columns:
  - Role
  - Export Type
  - Row Limit
  - Watermark Enabled
  - Daily Limit
  - Monthly Limit
  - Actions (Edit, Delete)
- **AND** the table shows all existing ExportControlSettings records

#### Scenario: Add new export control setting
- **WHEN** an Admin clicks "Add Setting" button
- **THEN** a modal/form opens with fields:
  - Role (dropdown: Admin, Editor, Viewer, custom roles)
  - Export Type (dropdown: all, influencer_list, report)
  - Row Limit (number input, -1 for unlimited)
  - Watermark Enabled (toggle switch)
  - Daily Limit (number input, nullable)
  - Monthly Limit (number input, nullable)
- **AND** form includes validation indicators and error messages

#### Scenario: Edit existing export control setting
- **WHEN** an Admin clicks "Edit" on a settings row
- **THEN** a modal/form opens pre-filled with current values
- **AND** the Admin can modify any field
- **AND** saving triggers update API call and shows success toast

#### Scenario: Delete export control setting
- **WHEN** an Admin clicks "Delete" on a settings row
- **THEN** a confirmation dialog appears: "Delete export control setting for [Role] / [Export Type]?"
- **AND** if confirmed, the setting is deleted
- **AND** the table updates to remove the row
- **AND** affected users fall back to default settings

#### Scenario: Reset to default settings
- **WHEN** an Admin clicks "Reset to Default" on a settings row
- **THEN** a confirmation dialog appears
- **AND** if confirmed, the setting values are reset to recommended defaults:
  - Admin: rowLimit = -1, watermark = false, no time limits
  - Editor: rowLimit = 100, watermark = true, daily = 20, monthly = 200
  - Viewer: rowLimit = 50, watermark = true, daily = 10, monthly = 50

#### Scenario: Settings table shows current values
- **WHEN** viewing the Export Controls settings table
- **THEN** each row displays:
  - Row Limit: "-1" shown as "Unlimited", numbers shown as-is
  - Watermark Enabled: shown as "On" (green badge) or "Off" (gray badge)
  - Daily/Monthly Limits: null shown as "—", numbers shown as-is
- **AND** table supports sorting by Role or Export Type

#### Scenario: Form validation prevents invalid settings
- **WHEN** an Admin enters Row Limit = -5 (invalid)
- **THEN** the form displays inline error: "Must be -1 (unlimited) or positive number"
- **AND** the Save button is disabled until corrected

#### Scenario: Form validation enforces limit constraints
- **WHEN** an Admin enters Daily Limit = 100 and Monthly Limit = 50
- **THEN** the form displays error: "Daily limit cannot exceed monthly limit"
- **AND** the Save button is disabled until corrected

### Requirement: Mock Influencers Export UI
The system SHALL provide a mock influencers list page for testing export control functionality.

#### Scenario: Mock influencers list page displayed
- **WHEN** a user navigates to /influencers
- **THEN** the page displays a table of mock influencer data
- **AND** includes a prominent badge: "Mock Data - For Testing Only"
- **AND** shows columns: Name, Platform, Followers, Engagement, Category

#### Scenario: Export PDF button visible with quota
- **WHEN** viewing the mock influencers list page
- **THEN** an "Export PDF" button is displayed
- **AND** above the button, the ExportQuotaIndicator shows user's limits
- **AND** the button is enabled if quota available, disabled if exhausted

#### Scenario: Export PDF triggers download
- **WHEN** a user clicks "Export PDF" button
- **AND** has available quota
- **THEN** a loading spinner is displayed
- **AND** the browser initiates a PDF download within 2 seconds
- **AND** success toast displays: "PDF exported successfully"
- **AND** quota indicator updates to reflect new count

#### Scenario: Export PDF fails with quota exceeded
- **WHEN** a user clicks "Export PDF" button
- **AND** has exhausted their daily quota
- **THEN** the system displays error toast: "Daily export limit reached (10/10). Resets at midnight UTC."
- **AND** no PDF download is initiated
- **AND** the button remains disabled

#### Scenario: Mock page accessible to all authenticated users
- **WHEN** any authenticated user (Admin, Editor, Viewer) navigates to /influencers
- **THEN** the page is displayed (no permission check blocking access)
- **AND** export controls are applied based on their role
- **AND** allows testing of export limits for all role types
