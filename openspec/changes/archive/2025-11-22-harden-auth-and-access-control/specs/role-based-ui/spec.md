# Capability: Role-Based UI

## ADDED Requirements

### Requirement: Permission Checking in UI
The system SHALL hide UI elements based on user permissions.

#### Scenario: Admin sees all features
- **WHEN** a user with role `Admin` views the admin panel
- **THEN** the user sees all navigation items including:
  - Dashboard
  - Users
  - Roles
  - Audit Logs
  - Settings
- **AND** all action buttons are visible (Create, Edit, Delete)
- **AND** no features are hidden

#### Scenario: Editor sees content features
- **WHEN** a user with role `Editor` views the admin panel
- **THEN** the user sees navigation items:
  - Dashboard
  - Settings (read/write)
- **AND** does NOT see:
  - Users
  - Roles
  - Audit Logs
- **AND** sees action buttons for content creation and editing
- **AND** sees Settings edit capabilities

#### Scenario: Viewer sees read-only interface
- **WHEN** a user with role `Viewer` views the admin panel
- **THEN** the user sees navigation items:
  - Dashboard
  - Settings (read-only)
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
