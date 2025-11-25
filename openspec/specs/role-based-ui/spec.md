# role-based-ui Specification

## Purpose
TBD - created by archiving change harden-auth-and-access-control. Update Purpose after archive.
## Requirements
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

### Requirement: Permission Store Integration
The system SHALL provide centralized permission checking via auth store.

#### Scenario: Auth store exposes permission check function
- **WHEN** the auth store is initialized with authenticated user
- **THEN** the store provides `hasPermission(action: string)` function
- **AND** the function accepts actions like `user:Create`, `settings:Write`, `audit:Read`
- **AND** returns boolean indicating if user has permission

#### Scenario: Permission check implementation
- **WHEN** `hasPermission('user:Create')` is called
- **THEN** the store retrieves user's role from auth state
- **AND** maps role to permissions using predefined mapping:
  - Admin: `['*']` (all permissions)
  - Editor: `['user:Read', 'settings:Read', 'settings:Write', 'content:*']`
  - Viewer: `['user:Read', 'settings:Read', 'content:Read']`
- **AND** checks if requested action matches any permission (supports wildcards)
- **AND** returns `true` if match found, `false` otherwise

#### Scenario: Wildcard permission matching
- **WHEN** user has permission `content:*`
- **THEN** `hasPermission('content:Read')` returns `true`
- **AND** `hasPermission('content:Write')` returns `true`
- **AND** `hasPermission('content:Delete')` returns `true`
- **AND** `hasPermission('user:Read')` returns `false` (different resource)

#### Scenario: Admin wildcard permission
- **WHEN** user has role `Admin` with permission `*`
- **THEN** `hasPermission(anyAction)` always returns `true`
- **AND** Admin has access to all features

#### Scenario: Multiple roles support (future)
- **WHEN** user has multiple roles assigned
- **THEN** the store aggregates permissions from all roles
- **AND** grants access if ANY role provides the permission
- **AND** uses OR logic for permission checking

### Requirement: Navigation Filtering
The system SHALL filter navigation menu based on user permissions.

#### Scenario: Navigation configuration with permissions
- **WHEN** the navigation component initializes
- **THEN** each navigation item has associated required permission:
  - Dashboard: `null` (accessible to all authenticated users)
  - Users: `user:Read`
  - Roles: `role:Read`
  - Audit Logs: `audit:Read`
  - Settings: `settings:Read`

#### Scenario: Filter navigation items
- **WHEN** rendering the sidebar navigation
- **THEN** the component filters navigation items using `hasPermission()`
- **AND** only items with granted permissions are rendered
- **AND** items without permission are removed from DOM (not just hidden)
- **AND** navigation order is preserved for visible items

#### Scenario: Active route without permission
- **WHEN** user navigates to URL they don't have permission for (e.g., `/users` as Viewer)
- **THEN** the API returns 403 Forbidden
- **AND** frontend displays "Access Denied" page
- **AND** page shows message: "You don't have permission to view this page"
- **AND** page provides button to return to Dashboard

### Requirement: Component-Level Permission Checks
The system SHALL check permissions at component level for fine-grained access control.

#### Scenario: Conditional button rendering
- **WHEN** rendering a component with action buttons
- **THEN** each button checks required permission before rendering
- **AND** uses pattern:
  ```tsx
  {hasPermission('user:Create') && (
    <Button onClick={openInviteModal}>Invite User</Button>
  )}
  ```
- **AND** button is completely omitted from DOM if permission denied

#### Scenario: Conditional form field rendering
- **WHEN** rendering a settings form
- **THEN** read-only fields always visible
- **AND** edit fields only visible if `hasPermission('settings:Write')`
- **AND** Viewers see form fields as disabled or read-only display
- **AND** Editors see editable form fields

#### Scenario: Conditional table actions
- **WHEN** rendering a table with row actions (Edit, Delete)
- **THEN** each action column checks required permission
- **AND** if user lacks permission, action column is not rendered
- **AND** table layout adjusts to hide empty action column

#### Scenario: Conditional page sections
- **WHEN** rendering a page with multiple sections
- **THEN** each section can independently check permissions
- **AND** sections without permission are not rendered
- **AND** page gracefully handles all sections hidden (shows empty state)

### Requirement: Permission Check Hook
The system SHALL provide React hook for permission checking in components.

#### Scenario: usePermission hook usage
- **WHEN** a component needs to check permissions
- **THEN** the component uses `const { hasPermission } = usePermission()` hook
- **AND** the hook connects to auth store
- **AND** returns memoized permission check function
- **AND** re-renders component when user role changes

#### Scenario: usePermission with specific action
- **WHEN** a component only needs one permission check
- **THEN** the component can use `const canCreate = usePermission('user:Create')`
- **AND** the hook returns boolean directly
- **AND** simplifies conditional rendering

#### Scenario: Hook handles unauthenticated state
- **WHEN** user is not authenticated
- **THEN** `hasPermission()` always returns `false`
- **AND** prevents accidental permission leaks in unauthenticated views

### Requirement: Error Handling for Unauthorized Access
The system SHALL handle unauthorized API responses gracefully.

#### Scenario: 403 response handling
- **WHEN** API returns 403 Forbidden response
- **THEN** the frontend intercepts the response in API client
- **AND** checks if error message indicates permission issue
- **AND** displays toast notification: "You don't have permission to perform this action"
- **AND** does not redirect user (stays on current page)

#### Scenario: 403 on page load
- **WHEN** user navigates to page and initial API request returns 403
- **THEN** the page component catches the error
- **AND** displays "Access Denied" page instead of page content
- **AND** page includes message and link to Dashboard

#### Scenario: 403 on mutation action
- **WHEN** user clicks button and mutation API call returns 403
- **THEN** the frontend displays toast notification with error
- **AND** does not modify UI state (e.g., doesn't show success message)
- **AND** logs error for debugging

#### Scenario: Distinguish 403 from 401
- **WHEN** API returns 401 Unauthorized (auth issue)
- **THEN** frontend attempts token refresh
- **AND** if refresh fails, redirects to login
- **WHEN** API returns 403 Forbidden (permission issue)
- **THEN** frontend does NOT attempt refresh
- **AND** shows permission error message
- **AND** user stays logged in

### Requirement: Permission Configuration
The system SHALL maintain clear permission-to-role mappings.

#### Scenario: Permission mapping definition
- **WHEN** the application initializes
- **THEN** permission mappings are defined in `src/lib/permissions.ts`:
  ```typescript
  export const ROLE_PERMISSIONS = {
    Admin: ['*'],
    Editor: [
      'user:Read',
      'settings:Read',
      'settings:Write',
      'content:*'
    ],
    Viewer: [
      'user:Read',
      'settings:Read',
      'content:Read'
    ]
  }
  ```
- **AND** this mapping is single source of truth for frontend permissions

#### Scenario: Route permission mapping
- **WHEN** the application defines routes
- **THEN** protected routes include required permission:
  ```typescript
  export const ROUTE_PERMISSIONS = {
    '/users': 'user:Read',
    '/roles': 'role:Read',
    '/audit': 'audit:Read',
    '/settings': 'settings:Read'
  }
  ```
- **AND** navigation component uses this mapping to filter links

#### Scenario: Feature permission mapping
- **WHEN** implementing new feature with permissions
- **THEN** developers add permission to role mapping
- **AND** add permission to route mapping if needed
- **AND** use `hasPermission()` in components
- **AND** ensure backend has matching permission checks

### Requirement: Defense-in-Depth
The system SHALL enforce permissions on both frontend and backend.

#### Scenario: Client-side permission check
- **WHEN** user attempts to access UI feature
- **THEN** frontend checks permission via `hasPermission()`
- **AND** hides UI if permission denied
- **AND** improves UX by not showing unauthorized features

#### Scenario: Server-side permission enforcement
- **WHEN** user sends API request
- **THEN** backend validates permission via `@RequirePermission()` decorator
- **AND** returns 403 if permission denied
- **AND** provides security enforcement regardless of frontend state

#### Scenario: Frontend permission bypass attempt
- **WHEN** user modifies frontend code to bypass permission checks
- **THEN** UI shows unauthorized features
- **AND** API requests still return 403 Forbidden
- **AND** actions cannot be completed
- **AND** demonstrates defense-in-depth effectiveness

#### Scenario: Permission check synchronization
- **WHEN** backend permission model changes
- **THEN** frontend permission mappings must be updated manually
- **AND** mismatch causes UI to hide features that backend allows (conservative)
- **AND** or UI to show features that backend denies (secure, just poor UX)
- **AND** both cases are acceptable; backend is always authoritative

### Requirement: User Experience
The system SHALL provide clear feedback about access restrictions.

#### Scenario: Empty state when all sections hidden
- **WHEN** user views page where all sections require permissions they lack
- **THEN** the page displays empty state message
- **AND** message says: "No content available with your current permissions"
- **AND** page provides link to Dashboard or contact admin

#### Scenario: Read-only mode indicator
- **WHEN** Viewer accesses a page they can only view
- **THEN** the page displays badge or banner: "Read-only access"
- **AND** all action buttons are hidden
- **AND** forms display as read-only or disabled

#### Scenario: Permission denial explanation
- **WHEN** user receives 403 error on action
- **THEN** error message explains: "You don't have permission to [action]. Contact your administrator to request access."
- **AND** message is user-friendly, not technical

#### Scenario: Graceful degradation
- **WHEN** permission check function fails (error in implementation)
- **THEN** the system defaults to denying permission (fail-secure)
- **AND** logs error for debugging
- **AND** user sees "Access Denied" rather than broken UI

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

