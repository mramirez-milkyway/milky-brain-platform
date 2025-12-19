## MODIFIED Requirements

### Requirement: Duplicate Handling Configuration

The system SHALL allow users to choose how to handle duplicate influencers during import, based on the `handle` field as the primary key for duplicate detection. When a soft-deleted record matches, it is automatically restored and updated.

#### Scenario: User selects "Skip Duplicates"

- **WHEN** user selects "Skip duplicates" radio button in mapping interface
- **THEN** job payload includes `duplicateHandling: "skip"`
- **AND** Lambda handler skips rows with existing active handle
- **AND** logs skipped rows: `{ level: INFO, message: "Row 5: Duplicate handle '@influencer123' - skipped", rowNumber: 5 }`

#### Scenario: User selects "Update Existing"

- **WHEN** user selects "Update existing records" radio button
- **THEN** job payload includes `duplicateHandling: "update"`
- **AND** Lambda handler updates existing active creator record with new data
- **AND** logs updated rows: `{ level: INFO, message: "Row 5: Updated existing creator with handle '@influencer123'", rowNumber: 5 }`

#### Scenario: Duplicate detection by handle (case-insensitive)

- **WHEN** CSV row has handle "@Influencer123"
- **AND** database has existing active creator_social record with handle "@influencer123"
- **THEN** the system detects duplicate (case-insensitive comparison)
- **AND** applies configured duplicate handling (skip or update)

#### Scenario: No duplicate handling specified defaults to skip

- **WHEN** job is created without duplicateHandling in payload
- **THEN** the system defaults to "skip" mode

#### Scenario: Restore soft-deleted record on import

- **WHEN** CSV row has handle "@deleted_user"
- **AND** database has creator_social record with handle "@deleted_user" and `deleted_at` IS NOT NULL
- **THEN** the system clears `deleted_at` on the creator and creator_social records
- **AND** updates the records with CSV data
- **AND** logs: `{ level: INFO, message: "Row 5: Restored soft-deleted creator '@deleted_user'", rowNumber: 5 }`
- **AND** increments `restoredCount` in job summary

#### Scenario: Restore takes precedence over skip mode

- **WHEN** duplicate handling is set to "skip"
- **AND** CSV row matches a soft-deleted record
- **THEN** the system restores the soft-deleted record (does not skip)
- **AND** updates with CSV data
- **AND** logs restoration

### Requirement: Job Summary and Results

The system SHALL generate a comprehensive summary of import results, including total processed, success count, error count, duplicate count, and restored count.

#### Scenario: Successful import job result

- **WHEN** an import job completes successfully with 100 rows processed, 90 created, 5 restored, 3 duplicates skipped, 2 errors
- **THEN** job status is updated to COMPLETED
- **AND** job.result contains: `{ totalRows: 100, successCount: 95, createdCount: 90, restoredCount: 5, errorCount: 2, duplicateCount: 3, skippedCount: 5 }`
- **AND** job.completedAt timestamp is set

#### Scenario: Failed import job result

- **WHEN** an import job fails due to critical error (e.g., S3 download failure)
- **THEN** job status is updated to FAILED
- **AND** job.errorReason contains error message
- **AND** job.result contains partial counts up to point of failure

#### Scenario: Job result displayed in UI

- **WHEN** user views completed job in Import Center
- **THEN** UI shows summary card:
  - "Total Rows: 100"
  - "Created: 90"
  - "Restored: 5"
  - "Errors: 2"
  - "Duplicates Skipped: 3"
- **AND** user can click "View Detailed Logs" to see row-level errors
