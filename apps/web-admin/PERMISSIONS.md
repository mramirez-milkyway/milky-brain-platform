# Permission-Based UI Guide

This document explains how to use the permission system in the web-admin application.

## Overview

The authentication system now includes:
- **Automatic token refresh**: Access tokens are automatically refreshed on 401 errors and proactively every ~12 hours
- **CSRF protection**: All mutation requests automatically include CSRF tokens
- **Role-based permissions**: UI elements can be shown/hidden based on user permissions
- **OAuth error handling**: Clear error messages for domain restrictions and invitation requirements

## Using Permissions in Components

### Method 1: Using the `usePermission` hook with a specific action

```tsx
import { usePermission } from '@/hooks/usePermission'

export function InviteUserButton() {
  const hasCreatePermission = usePermission('user:Create')

  if (!hasCreatePermission) return null

  return (
    <button onClick={handleInvite}>
      Invite User
    </button>
  )
}
```

### Method 2: Using the `usePermission` hook with the function

```tsx
import { usePermission } from '@/hooks/usePermission'

export function UserManagementPanel() {
  const { hasPermission } = usePermission()

  return (
    <div>
      <h1>User Management</h1>
      
      {hasPermission('user:Create') && (
        <button>Invite User</button>
      )}
      
      {hasPermission('user:Delete') && (
        <button>Delete User</button>
      )}
      
      {hasPermission('user:Read') ? (
        <UserList />
      ) : (
        <AccessDenied />
      )}
    </div>
  )
}
```

### Method 3: Using the auth store directly

```tsx
'use client'

import { useAuthStore } from '@/lib/auth-store'

export function SettingsPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const canWrite = hasPermission('settings:Write')

  return (
    <form>
      <input disabled={!canWrite} />
      
      {canWrite && (
        <button type="submit">Save Settings</button>
      )}
    </form>
  )
}
```

## Available Permission Actions

The permission system uses the format `resource:action`. Common permissions include:

- `user:Read` - View users
- `user:Create` - Invite users
- `user:Write` - Update users
- `user:Delete` - Delete users
- `role:Read` - View roles
- `role:Create` - Create roles
- `settings:Read` - View settings
- `settings:Write` - Modify settings
- `audit:Read` - View audit logs
- `navigation:Read` - View navigation items
- `navigation:Write` - Modify navigation
- `*` - All permissions (Admin only)

## Wildcard Permissions

The system supports wildcards:

- `*` - All permissions on all resources (Admin role)
- `user:*` - All permissions on user resource
- `content:*` - All permissions on content resource

Example:
```tsx
const canDoAnything = hasPermission('*') // Admin only
const canManageUsers = hasPermission('user:*') // All user operations
```

## Route Protection

All protected pages are wrapped with the `PermissionGuard` component to enforce access control.

### Using PermissionGuard

The `PermissionGuard` component checks if the user has the required permission before rendering the page content. If the user lacks permission, it displays the `AccessDenied` component.

**Example:** Users page

```tsx
// apps/web-admin/src/app/users/page.tsx

import PermissionGuard from '@/components/PermissionGuard'

function UsersContent() {
  // Page implementation...
  return <div>...</div>
}

export default function UsersPage() {
  return (
    <PermissionGuard permission="user:Read">
      <UsersContent />
    </PermissionGuard>
  )
}
```

### Protected Pages

The following pages are protected with permission guards:

- **`/users`** - Requires `user:Read` permission
- **`/roles`** - Requires `role:Read` permission
- **`/policies`** - Requires `policy:Read` permission
- **`/audit`** - Requires `audit:Read` permission (Admin only)
- **`/settings`** - Requires `settings:Read` permission

### What Happens Without Permission

When a user tries to access a protected route without the required permission:

1. **Navigation is hidden** - The menu item doesn't appear in the sidebar
2. **Direct access shows AccessDenied** - If they manually navigate to the URL, they see:
   - ⚠️ "Access Denied" message
   - Clear explanation: "You don't have permission to access this module"
   - "Go Back" and "Go to Dashboard" buttons
   - Information about contacting an administrator

### Route Permissions Mapping (Optional)

You can also check route access programmatically using the `canAccessRoute` method:

```tsx
export const ROUTE_PERMISSIONS: Record<string, string> = {
  '/users': 'user:Read',
  '/users/invite': 'user:Create',
  '/roles': 'role:Read',
  '/policies': 'policy:Read',
  '/settings': 'settings:Read',
  '/audit': 'audit:Read',
}

const canAccessRoute = useAuthStore((state) => state.canAccessRoute)

if (!canAccessRoute('/users')) {
  return <AccessDenied />
}
```

## Navigation Filtering

The `AppSidebar` component automatically filters navigation items based on user permissions. Menu items are only visible if the user has the required permission.

### How It Works

The sidebar navigation is defined with optional `permission` properties:

```tsx
// apps/web-admin/src/layout/AppSidebar.tsx

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: 'Dashboard',
    path: '/',
    // No permission required - everyone can access
  },
  {
    icon: <UserCircleIcon />,
    name: 'Users',
    path: '/users',
    permission: 'user:Read', // Only visible with user:Read
  },
  {
    icon: <PieChartIcon />,
    name: 'Audit Log',
    path: '/audit',
    permission: 'audit:Read', // Only visible with audit:Read (Admin only)
  },
]
```

The sidebar automatically filters these items using `useMemo`:

```tsx
const hasPermission = useAuthStore((state) => state.hasPermission)

const filteredNavItems = useMemo(
  () => navItems.filter((item) => !item.permission || hasPermission(item.permission)),
  [hasPermission]
)
```

### Result

- **Admin users**: See all navigation items (Users, Roles, Policies, Audit Log, Settings)
- **Editor users**: See only permitted items (Users, Settings, etc.)
- **Viewer users**: See only read-only items (limited navigation)

### Custom Navigation Example

If you need to create custom navigation with permission filtering:

```tsx
const CUSTOM_NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', permission: null },
  { path: '/users', label: 'Users', permission: 'user:Read' },
  { path: '/roles', label: 'Roles', permission: 'role:Read' },
  { path: '/settings', label: 'Settings', permission: 'settings:Read' },
  { path: '/audit', label: 'Audit Logs', permission: 'audit:Read' },
]

export function CustomNavigation() {
  const { hasPermission } = usePermission()
  
  const visibleItems = CUSTOM_NAV_ITEMS.filter(item => 
    !item.permission || hasPermission(item.permission)
  )

  return (
    <nav>
      {visibleItems.map(item => (
        <Link key={item.path} href={item.path}>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
```

## API Client Features

The API client automatically handles:

### 1. CSRF Token Injection
All POST/PUT/PATCH/DELETE requests automatically include the CSRF token from cookies.

### 2. Automatic Token Refresh
When a 401 error occurs, the client automatically:
- Attempts to refresh the access token
- Queues concurrent requests during refresh
- Retries the original request with the new token
- Redirects to login if refresh fails

### 3. CSRF Error Recovery
When a 403 CSRF error occurs, the client:
- Attempts to refresh tokens (which generates a new CSRF token)
- Retries the original request once
- Shows an error if retry fails

## Proactive Token Refresh

The `ProtectedLayout` automatically starts a timer to refresh tokens every ~12 hours (before the 12-hour expiration). This prevents interruptions during active sessions.

## OAuth Error Handling

The login page displays clear error messages for:

- **invalid_domain**: Email domain not authorized
- **no_invitation**: User not invited
- **account_deactivated**: Account has been deactivated
- **session_expired**: Session expired (auto-dismisses after 8 seconds)
- **auth_failed**: General authentication failure (auto-dismisses after 8 seconds)

## Security Best Practices

1. **Always enforce permissions on the backend** - Frontend checks are for UX only
2. **Use HTTP-only cookies** - Access and refresh tokens are secure
3. **CSRF tokens are automatic** - No manual handling needed
4. **Logout clears all tokens** - Use `useAuthStore().logout()`

## Example: Full User Management Component

```tsx
'use client'

import { usePermission } from '@/hooks/usePermission'
import { useState } from 'react'

export default function UserManagementPage() {
  const { hasPermission } = usePermission()
  const [showInviteModal, setShowInviteModal] = useState(false)

  const canRead = hasPermission('user:Read')
  const canCreate = hasPermission('user:Create')
  const canDelete = hasPermission('user:Delete')

  if (!canRead) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
        <p>You don't have permission to view users.</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        
        {canCreate && (
          <button 
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Invite User
          </button>
        )}
      </div>

      <UserList canDelete={canDelete} />
      
      {showInviteModal && canCreate && (
        <InviteUserModal onClose={() => setShowInviteModal(false)} />
      )}
    </div>
  )
}
```

## Debugging Permissions

Check user permissions in the browser console:

```javascript
// Get current permissions
const permissions = useAuthStore.getState().permissions
console.log('User permissions:', permissions)

// Test a specific permission
const canInvite = useAuthStore.getState().hasPermission('user:Create')
console.log('Can invite users:', canInvite)
```
