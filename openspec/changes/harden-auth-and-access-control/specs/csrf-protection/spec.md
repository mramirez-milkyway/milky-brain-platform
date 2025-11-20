# Capability: CSRF Protection

## ADDED Requirements

### Requirement: CSRF Token Generation
The system SHALL generate unique CSRF tokens for each authenticated session.

#### Scenario: Generate CSRF token on authentication
- **WHEN** a user successfully authenticates (Google OAuth or token refresh)
- **THEN** the system generates a CSRF token using `crypto.randomBytes(32).toString('hex')`
- **AND** stores the token in Redis with key pattern `csrf:{userId}:{jti}`
- **AND** the value is the token string
- **AND** Redis key TTL is set to 12 hours (matching access token expiration)
- **AND** the token is delivered to client in two ways:
  - As cookie named `csrf_token` (NOT HTTP-only, so JavaScript can read)
  - As response header `X-CSRF-Token`

#### Scenario: CSRF token cookie attributes
- **WHEN** the system sets the CSRF token cookie
- **THEN** the cookie has the following attributes:
  - `httpOnly: false` (allows JavaScript to read)
  - `secure: true` (in production only)
  - `sameSite: 'Lax'`
  - `path: '/'`
  - `maxAge: 12 hours` (matching access token)

#### Scenario: CSRF token rotation on refresh
- **WHEN** a user refreshes their access token via `/auth/refresh`
- **THEN** the system generates a new CSRF token
- **AND** deletes the old CSRF token from Redis
- **AND** stores the new token with the new access token `jti`
- **AND** sends the new token in cookie and header

### Requirement: CSRF Token Validation
The system SHALL validate CSRF tokens on all state-changing requests.

#### Scenario: Validate CSRF on mutation requests
- **WHEN** a request with method POST, PUT, PATCH, or DELETE is received
- **THEN** the system extracts the CSRF token from `X-CSRF-Token` request header
- **AND** extracts the user's `jti` from the validated JWT access token
- **AND** retrieves stored token from Redis key `csrf:{userId}:{jti}`
- **AND** compares header token with Redis token using constant-time comparison
- **AND** if tokens match, allows request to proceed
- **AND** if tokens don't match, throws `ForbiddenException` with message "Invalid CSRF token"

#### Scenario: Skip CSRF validation for read requests
- **WHEN** a request with method GET, HEAD, or OPTIONS is received
- **THEN** the system skips CSRF validation
- **AND** proceeds with normal authentication and authorization

#### Scenario: Skip CSRF validation for unauthenticated endpoints
- **WHEN** a request to unauthenticated endpoint (e.g., `/auth/google`, `/auth/google/callback`) is received
- **THEN** the system skips CSRF validation
- **AND** proceeds with normal endpoint logic

#### Scenario: CSRF validation failure response
- **WHEN** CSRF validation fails
- **THEN** the system returns 403 Forbidden status code
- **AND** response body includes:
  - `statusCode: 403`
  - `message: "Invalid CSRF token"`
  - `error: "Forbidden"`
- **AND** logs security warning with user ID and request details
- **AND** does NOT execute the requested operation

#### Scenario: Missing CSRF token on mutation
- **WHEN** a mutation request is received without `X-CSRF-Token` header
- **THEN** the system treats it as invalid CSRF token
- **AND** returns 403 Forbidden
- **AND** returns error message "CSRF token required for this operation"

#### Scenario: CSRF token expired
- **WHEN** a client sends CSRF token but corresponding access token has expired
- **THEN** the Redis key `csrf:{userId}:{jti}` does not exist (TTL expired)
- **AND** CSRF validation fails with 403 Forbidden
- **AND** client receives error "CSRF token expired"

### Requirement: CSRF Guard Implementation
The system SHALL implement reusable CSRF validation guard.

#### Scenario: CSRF guard applied globally
- **WHEN** the NestJS application initializes
- **THEN** the CSRF guard is registered globally after JWT auth guard
- **AND** applied to all controller routes except explicitly excluded paths
- **AND** excluded paths include:
  - `/auth/google`
  - `/auth/google/callback`
  - `/auth/refresh`
  - `/health`

#### Scenario: CSRF guard execution order
- **WHEN** a request reaches a protected endpoint
- **THEN** guards execute in order:
  1. `JwtAuthGuard` - Validates access token, extracts user
  2. `CsrfGuard` - Validates CSRF token (if mutation request)
  3. `PermissionGuard` - Validates user has required permissions
- **AND** if any guard fails, request is rejected before reaching controller

#### Scenario: CSRF guard with custom decorators
- **WHEN** a controller method needs to skip CSRF validation
- **THEN** the method can use `@SkipCsrf()` decorator
- **AND** CSRF guard checks for this decorator and skips validation
- **AND** this is used sparingly for specific edge cases only

### Requirement: Frontend CSRF Integration
The system SHALL provide CSRF tokens to frontend clients for mutations.

#### Scenario: Read CSRF token from cookie
- **WHEN** the frontend needs to make a mutation request
- **THEN** the client reads the CSRF token from `csrf_token` cookie using `document.cookie`
- **AND** includes the token in `X-CSRF-Token` request header
- **AND** sends the request to API

#### Scenario: Read CSRF token from response header
- **WHEN** the frontend receives authentication or refresh response
- **THEN** the client reads `X-CSRF-Token` header from response
- **AND** stores the token in memory or local variable
- **AND** uses this token for subsequent mutation requests

#### Scenario: API client automatic CSRF header injection
- **WHEN** the API client (Axios instance) sends a mutation request
- **THEN** the request interceptor automatically adds `X-CSRF-Token` header
- **AND** reads token value from cookie or stored variable
- **AND** if token not found, logs warning and proceeds (will receive 403)

#### Scenario: Handle CSRF error in frontend
- **WHEN** the frontend receives 403 Forbidden response with "Invalid CSRF token" message
- **THEN** the client attempts to refresh access token via `/auth/refresh`
- **AND** if refresh successful, receives new CSRF token
- **AND** retries original request with new token
- **AND** if refresh fails, redirects to login page

#### Scenario: CSRF token synchronization
- **WHEN** multiple browser tabs are open for the same user
- **THEN** each tab reads CSRF token from shared cookie
- **AND** when token refreshes in one tab, other tabs automatically get new token from cookie
- **AND** all tabs can make mutations with current CSRF token

### Requirement: CSRF Security Best Practices
The system SHALL follow CSRF protection security standards.

#### Scenario: Double-submit cookie pattern
- **WHEN** implementing CSRF protection
- **THEN** the system uses double-submit cookie pattern:
  - Token in cookie (readable by JavaScript)
  - Token in header (sent by client)
  - Server validates both match
- **AND** this prevents attackers from forging requests (can't read cookie from other domain)

#### Scenario: Constant-time token comparison
- **WHEN** comparing CSRF tokens
- **THEN** the system uses constant-time comparison function
- **AND** prevents timing attacks to guess token values
- **AND** uses `crypto.timingSafeEqual()` or equivalent

#### Scenario: CSRF token uniqueness
- **WHEN** generating CSRF tokens
- **THEN** each token is cryptographically random
- **AND** uses 32 bytes (256 bits) of entropy
- **AND** encoded as hexadecimal (64 characters)
- **AND** statistically guaranteed to be unique per session

#### Scenario: CSRF token bound to session
- **WHEN** a CSRF token is validated
- **THEN** the token is tied to specific access token `jti`
- **AND** cannot be used with different access token
- **AND** automatically invalidated when access token expires or is revoked

#### Scenario: SameSite cookie defense-in-depth
- **WHEN** CSRF token cookie is set
- **THEN** cookie includes `SameSite=Lax` attribute
- **AND** this prevents cookie from being sent on cross-site requests
- **AND** provides additional protection layer beyond token validation

### Requirement: CSRF Token Lifecycle
The system SHALL manage CSRF token creation, validation, and cleanup.

#### Scenario: CSRF token creation on login
- **WHEN** user completes Google OAuth login
- **THEN** system generates CSRF token immediately after creating access token
- **AND** stores in Redis before redirecting to frontend
- **AND** user can make mutations immediately after login

#### Scenario: CSRF token deletion on logout
- **WHEN** user logs out via `/auth/logout`
- **THEN** system deletes CSRF token from Redis (`csrf:{userId}:{jti}`)
- **AND** clears CSRF token cookie
- **AND** subsequent mutation requests with old token fail

#### Scenario: CSRF token automatic expiration
- **WHEN** access token expires naturally after 12 hours
- **THEN** Redis automatically deletes CSRF token via TTL
- **AND** client receives 403 on mutation attempts
- **AND** client attempts token refresh to get new CSRF token

#### Scenario: CSRF token cleanup on token refresh
- **WHEN** user refreshes access token
- **THEN** old CSRF token (`csrf:{userId}:{old_jti}`) is deleted
- **AND** new CSRF token (`csrf:{userId}:{new_jti}`) is created
- **AND** client automatically receives new token in response

### Requirement: Development and Testing Support
The system SHALL provide tools for CSRF testing and development.

#### Scenario: CSRF validation disabled in test environment
- **WHEN** `NODE_ENV=test`
- **THEN** CSRF guard can be disabled via `DISABLE_CSRF=true` environment variable
- **AND** allows easier integration testing
- **AND** logs warning that CSRF is disabled

#### Scenario: CSRF error logging in development
- **WHEN** `NODE_ENV=development` and CSRF validation fails
- **THEN** the system logs detailed error information:
  - Expected token from Redis
  - Received token from header
  - User ID and JWT ID
  - Request path and method
- **AND** helps developers debug CSRF issues

#### Scenario: CSRF endpoint for debugging
- **WHEN** `NODE_ENV=development`
- **THEN** the system exposes `GET /auth/csrf-token` endpoint
- **AND** returns current CSRF token for authenticated user
- **AND** helps developers verify token synchronization
- **AND** endpoint is disabled in production
