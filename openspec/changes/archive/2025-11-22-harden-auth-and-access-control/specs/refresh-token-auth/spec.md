# Capability: Refresh Token Authentication

## ADDED Requirements

### Requirement: Dual Token System
The system SHALL issue both access tokens and refresh tokens for authenticated sessions.

#### Scenario: Token generation on successful authentication
- **WHEN** a user successfully authenticates via Google OAuth
- **THEN** the system generates an access token (JWT) with 12-hour expiration
- **AND** generates a refresh token (JWT) with 1-month expiration
- **AND** both tokens are signed with separate secrets (`JWT_SECRET` and `REFRESH_TOKEN_SECRET`)
- **AND** both tokens are delivered as HTTP-only, Secure cookies
- **AND** access token cookie named `access_token` with 12-hour max-age
- **AND** refresh token cookie named `refresh_token` with 30-day max-age
- **AND** both cookies use `SameSite=Lax` attribute

#### Scenario: Access token structure
- **WHEN** the system generates an access token
- **THEN** the token payload includes:
  - `sub`: userId (number)
  - `email`: user email (string)
  - `jti`: unique JWT ID (UUID v4)
  - `role`: user's primary role name (string)
  - `iat`: issued at timestamp (number)
  - `exp`: expiration timestamp (number)
- **AND** the token is signed with `JWT_SECRET`

#### Scenario: Refresh token structure
- **WHEN** the system generates a refresh token
- **THEN** the token payload includes:
  - `sub`: userId (number)
  - `tokenId`: unique token identifier (UUID v4)
  - `type`: "refresh" (string literal)
  - `iat`: issued at timestamp (number)
  - `exp`: expiration timestamp (number)
- **AND** the token is signed with `REFRESH_TOKEN_SECRET`
- **AND** does NOT include email or role (minimize data exposure)

### Requirement: Refresh Token Storage
The system SHALL track refresh tokens in Redis for revocation capabilities.

#### Scenario: Store refresh token metadata
- **WHEN** a refresh token is issued
- **THEN** the system stores metadata in Redis with key pattern `refresh:{userId}:{tokenId}`
- **AND** the value includes:
  - `jti`: current access token JWT ID
  - `issuedAt`: timestamp when refresh token created
  - `userAgent`: request user agent string
  - `ipAddress`: request IP address
- **AND** the Redis key TTL is set to 30 days (matching token expiration)

#### Scenario: Verify refresh token exists in Redis
- **WHEN** a refresh token is used to obtain new access token
- **THEN** the system checks if `refresh:{userId}:{tokenId}` key exists in Redis
- **AND** if not found, rejects the refresh request with 401 Unauthorized
- **AND** returns error message "Invalid or expired refresh token"

### Requirement: Token Refresh Endpoint
The system SHALL provide an endpoint to exchange refresh tokens for new access tokens.

#### Scenario: Successful token refresh
- **WHEN** a client sends POST request to `/auth/refresh` with valid refresh token cookie
- **THEN** the system validates the refresh token signature
- **AND** verifies token not expired
- **AND** checks token exists in Redis
- **AND** generates new access token with new `jti`
- **AND** generates new refresh token with new `tokenId`
- **AND** updates Redis with new refresh token metadata
- **AND** deletes old refresh token from Redis
- **AND** returns new tokens as HTTP-only cookies
- **AND** returns 200 OK with user info in response body

#### Scenario: Refresh with expired refresh token
- **WHEN** a client attempts to refresh with expired refresh token
- **THEN** the system rejects the request with 401 Unauthorized
- **AND** clears both `access_token` and `refresh_token` cookies
- **AND** returns error message "Refresh token expired. Please sign in again."

#### Scenario: Refresh with invalid signature
- **WHEN** a client attempts to refresh with tampered or invalid refresh token
- **THEN** the system rejects the request with 401 Unauthorized
- **AND** clears both cookies
- **AND** logs security warning about invalid token

#### Scenario: Refresh with revoked token
- **WHEN** a client attempts to refresh with a token that's been revoked (deleted from Redis)
- **THEN** the system rejects the request with 401 Unauthorized
- **AND** returns error message "Refresh token has been revoked"
- **AND** does not issue new tokens

#### Scenario: Refresh token reuse detection
- **WHEN** a client attempts to use a refresh token that's already been rotated (no longer in Redis)
- **THEN** the system identifies potential token theft
- **AND** revokes ALL refresh tokens for that user (delete all `refresh:{userId}:*` keys)
- **AND** blacklists ALL current access tokens for that user
- **AND** logs security alert
- **AND** returns 401 Unauthorized with message "Security alert: Token reuse detected. All sessions revoked."

### Requirement: Automatic Token Refresh
The system SHALL support automatic access token refresh in the frontend.

#### Scenario: Proactive token refresh before expiration
- **WHEN** the frontend API client detects access token will expire in less than 5 minutes
- **THEN** the client automatically sends request to `/auth/refresh`
- **AND** if successful, updates tokens and retries original request
- **AND** if failed, redirects to login page

#### Scenario: Reactive token refresh on 401 response
- **WHEN** the frontend receives 401 Unauthorized response from API
- **THEN** the client attempts to refresh access token via `/auth/refresh`
- **AND** if successful, retries the original request with new token
- **AND** if refresh fails, redirects to login page with return URL

#### Scenario: Prevent refresh token retry loops
- **WHEN** token refresh request fails with 401
- **THEN** the client does NOT attempt another refresh
- **AND** immediately redirects to login page
- **AND** clears all stored auth state

### Requirement: Refresh Token Revocation
The system SHALL revoke refresh tokens when user access changes.

#### Scenario: Revoke refresh tokens on logout
- **WHEN** a user explicitly logs out via `/auth/logout`
- **THEN** the system extracts `tokenId` from refresh token cookie
- **AND** deletes `refresh:{userId}:{tokenId}` key from Redis
- **AND** blacklists current access token via `jti`
- **AND** clears both token cookies
- **AND** returns 200 OK

#### Scenario: Revoke all refresh tokens on deactivation
- **WHEN** a user is deactivated
- **THEN** the system finds all Redis keys matching `refresh:{userId}:*`
- **AND** extracts `jti` values from each session
- **AND** blacklists all access tokens
- **AND** deletes all refresh token keys
- **AND** the user cannot refresh or make authenticated requests

#### Scenario: Revoke all refresh tokens on role change
- **WHEN** an ACTIVE user's roles are modified
- **THEN** the system revokes all refresh tokens (delete all `refresh:{userId}:*`)
- **AND** blacklists all current access tokens
- **AND** forces user to re-authenticate to receive token with updated role

#### Scenario: Revoke all refresh tokens on password reset (future)
- **WHEN** a user resets their password (placeholder for future functionality)
- **THEN** the system revokes all refresh tokens for security
- **AND** blacklists all access tokens
- **AND** user must sign in again with new credentials

### Requirement: Refresh Token Security
The system SHALL implement security best practices for refresh tokens.

#### Scenario: Separate signing secrets
- **WHEN** the application starts
- **THEN** access tokens are signed with `JWT_SECRET`
- **AND** refresh tokens are signed with `REFRESH_TOKEN_SECRET`
- **AND** if `REFRESH_TOKEN_SECRET` not set, application fails to start in production
- **AND** in development, logs critical warning if using default secrets

#### Scenario: Refresh token rotation
- **WHEN** a refresh token is successfully used
- **THEN** the old refresh token is immediately invalidated (deleted from Redis)
- **AND** a new refresh token is issued with new `tokenId`
- **AND** only the new refresh token can be used for subsequent refreshes

#### Scenario: Refresh token single-use enforcement
- **WHEN** a refresh token is used more than once
- **THEN** the system treats it as potential theft (see "Refresh token reuse detection")
- **AND** revokes all user sessions

#### Scenario: Token binding to user agent
- **WHEN** a refresh token is used
- **THEN** the system compares request user agent with stored user agent from Redis
- **AND** if mismatch detected, logs warning (but allows refresh for usability)
- **AND** considers stricter binding in future based on security requirements

### Requirement: Configuration and Defaults
The system SHALL use configurable expiration times with secure defaults.

#### Scenario: Access token expiration configuration
- **WHEN** the system generates access tokens
- **THEN** expiration is set to `JWT_EXPIRATION` environment variable value
- **AND** defaults to `12h` if not configured
- **AND** supports formats like `1h`, `30m`, `7d` (parsed by JWT library)

#### Scenario: Refresh token expiration configuration
- **WHEN** the system generates refresh tokens
- **THEN** expiration is set to `REFRESH_TOKEN_EXPIRY` environment variable value
- **AND** defaults to `30d` (30 days) if not configured
- **AND** supports same time format as access tokens

#### Scenario: Maximum refresh token lifetime
- **WHEN** `REFRESH_TOKEN_EXPIRY` is configured
- **THEN** the value must not exceed 90 days
- **AND** if configured above 90 days, application logs warning and uses 90 days
- **AND** in production, rejects values above 90 days at startup
