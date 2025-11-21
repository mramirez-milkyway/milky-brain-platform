# session-management Specification

## Purpose
TBD - created by archiving change add-user-management-panel. Update Purpose after archive.
## Requirements
### Requirement: Session Revocation Infrastructure
The system SHALL maintain a Redis-based token blacklist for immediate session revocation.

#### Scenario: JWT contains unique identifier
- **WHEN** the system issues a new JWT token
- **THEN** the token includes a unique `jti` (JWT ID) claim
- **AND** the `jti` is a UUID v4 or equivalent unique identifier

#### Scenario: Blacklist token on revocation
- **WHEN** a user's session needs to be revoked
- **THEN** the system adds the token's `jti` to the Redis blacklist
- **AND** sets the Redis key TTL to match the token's remaining lifetime
- **AND** stores metadata including userId, reason, and revokedAt timestamp

#### Scenario: Check blacklist on authentication
- **WHEN** a JWT token is validated during request authentication
- **THEN** the system checks if the token's `jti` exists in the Redis blacklist
- **AND** if blacklisted, rejects the request with 401 Unauthorized
- **AND** if not blacklisted, proceeds with normal authentication

#### Scenario: Redis connection failure
- **WHEN** Redis is unavailable during blacklist check
- **THEN** the system logs a critical error
- **AND** allows the request to proceed (fail-open for availability)
- **AND** monitors Redis health and alerts on persistent failures

### Requirement: Automatic Session Revocation
The system SHALL automatically revoke sessions when user access changes.

#### Scenario: Revoke on user deactivation
- **WHEN** a user is deactivated
- **THEN** the system identifies all active JWT tokens for that user
- **AND** adds all tokens to the Redis blacklist
- **AND** the user cannot make authenticated requests with existing tokens
- **AND** receives 401 Unauthorized on next request

#### Scenario: Revoke on role change
- **WHEN** an ACTIVE user's roles are modified (added or removed)
- **THEN** the system revokes all active sessions for that user
- **AND** the user must re-authenticate to receive a new token with updated permissions

#### Scenario: Skip revocation for invited users
- **WHEN** an INVITED user's roles are modified
- **THEN** the system does not attempt session revocation
- **AND** no Redis operations are performed (no sessions exist)

### Requirement: Blacklist Key Pattern
The system SHALL use a consistent Redis key pattern for token blacklisting.

#### Scenario: Key format
- **WHEN** storing a blacklisted token in Redis
- **THEN** the key follows the pattern `blacklist:jwt:{jti}`
- **AND** the value is a JSON string containing `{userId, reason, revokedAt}`

#### Scenario: TTL calculation
- **WHEN** blacklisting a token
- **THEN** the system calculates TTL as `token.exp - current_time`
- **AND** sets the Redis key to expire automatically after TTL seconds
- **AND** tokens are automatically removed from blacklist after natural expiration

### Requirement: Session Tracking
The system SHALL track active sessions for revocation purposes.

#### Scenario: Record session on login
- **WHEN** a user successfully authenticates
- **THEN** the system records the session metadata in Redis
- **AND** uses key pattern `session:{userId}:{jti}`
- **AND** stores metadata including IP address, user agent, and issued timestamp
- **AND** sets TTL to match JWT expiration

#### Scenario: Enumerate user sessions
- **WHEN** revoking all sessions for a user
- **THEN** the system queries Redis for all keys matching `session:{userId}:*`
- **AND** extracts the `jti` from each session key
- **AND** blacklists all extracted `jti` values

#### Scenario: Clean up on logout
- **WHEN** a user explicitly logs out
- **THEN** the system removes the session key from Redis
- **AND** adds the token to the blacklist
- **AND** returns success confirmation

