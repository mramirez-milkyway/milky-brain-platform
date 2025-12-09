# influencer-import Specification

## Purpose
TBD - created by archiving change add-influencer-csv-import. Update Purpose after archive.
## Requirements
### Requirement: CSV File Upload

The system SHALL allow users with `influencer:Import` permission to upload CSV files for bulk influencer import, with file size and type validation.

#### Scenario: Upload valid CSV file

- **WHEN** a user with `influencer:Import` permission uploads a CSV file (<10MB) via Import Center UI
- **THEN** the frontend shows column mapping interface
- **AND** system auto-matches CSV headers to database fields (e.g., "Full Name" → full_name)
- **AND** user can manually adjust mappings via drag-and-drop or dropdowns

#### Scenario: Upload file exceeding size limit

- **WHEN** a user attempts to upload a CSV file >10MB
- **THEN** the system shows warning message "File size exceeds recommended 10MB limit. Large files may take longer to process."
- **AND** allows upload to proceed (warning, not rejection)

#### Scenario: Upload non-CSV file

- **WHEN** a user attempts to upload a .xlsx or .pdf file
- **THEN** the system shows error "Invalid file type. Please upload .csv or .txt files only."
- **AND** upload is rejected

#### Scenario: Upload without permission

- **WHEN** a user without `influencer:Import` permission attempts to access Import Center
- **THEN** the system returns HTTP 403 Forbidden
- **AND** Import Center link is hidden in navigation

#### Scenario: Upload with row count warning

- **WHEN** a user uploads a CSV file with >10,000 rows
- **THEN** the system shows warning "File contains 15,000 rows. Processing may take several minutes."
- **AND** allows upload to proceed

### Requirement: Column Mapping Interface

The system SHALL provide an interactive column mapping interface using `react-spreadsheet-import` library, allowing users to map CSV columns to database fields before import.

#### Scenario: Auto-match CSV headers

- **WHEN** a CSV file with headers is uploaded: "Full Name, Email, Industry, Country, Handle, Social Media"
- **THEN** the system attempts to auto-match headers to fields:
  - "Full Name" → creator.full_name
  - "Email" → creator.email
  - "Industry" → customer.industry
  - "Country" → creator.country
  - "Handle" → creator_social.handle
  - "Social Media" → creator_social.social_media

#### Scenario: User adjusts column mapping

- **WHEN** auto-matching maps "Name" to creator.full_name but user wants creator.contact_name
- **THEN** user can click dropdown on "Name" column and select "Contact Name (customer.contact_name)"
- **AND** mapping is updated

#### Scenario: Required field not mapped

- **WHEN** user attempts to proceed without mapping a required field (e.g., full_name)
- **THEN** the system shows error "Required field 'Full Name' is not mapped. Please map a CSV column to this field."
- **AND** prevents job creation until fixed

#### Scenario: User confirms mapping

- **WHEN** user reviews mappings and clicks "Confirm Import"
- **THEN** the system creates job with payload: `{ columnMapping: { "Full Name": "full_name", "Email": "email", ... }, duplicateHandling: "skip" }`
- **AND** uploads CSV file to S3
- **AND** redirects to job history panel

### Requirement: Duplicate Handling Configuration

The system SHALL allow users to choose how to handle duplicate influencers during import, based on the `handle` field as the primary key for duplicate detection.

#### Scenario: User selects "Skip Duplicates"

- **WHEN** user selects "Skip duplicates" radio button in mapping interface
- **THEN** job payload includes `duplicateHandling: "skip"`
- **AND** Lambda handler skips rows with existing handle
- **AND** logs skipped rows: `{ level: INFO, message: "Row 5: Duplicate handle '@influencer123' - skipped", rowNumber: 5 }`

#### Scenario: User selects "Update Existing"

- **WHEN** user selects "Update existing records" radio button
- **THEN** job payload includes `duplicateHandling: "update"`
- **AND** Lambda handler updates existing creator record with new data
- **AND** logs updated rows: `{ level: INFO, message: "Row 5: Updated existing creator with handle '@influencer123'", rowNumber: 5 }`

#### Scenario: Duplicate detection by handle (case-insensitive)

- **WHEN** CSV row has handle "@Influencer123"
- **AND** database has existing creator_social record with handle "@influencer123"
- **THEN** the system detects duplicate (case-insensitive comparison)
- **AND** applies configured duplicate handling (skip or update)

#### Scenario: No duplicate handling specified defaults to skip

- **WHEN** job is created without duplicateHandling in payload
- **THEN** the system defaults to "skip" mode

### Requirement: CSV Parsing and Data Spreading

The system SHALL parse CSV files and distribute data across multiple database tables (creator, creator_social, customer, campaign, post, campaign_creator) based on column mappings.

#### Scenario: Import creator with basic info

- **WHEN** CSV row contains: Full Name="John Doe", Email="john@example.com", Gender="male", Country="US"
- **AND** these fields map to creator table
- **THEN** Lambda creates creator record: `{ full_name: "John Doe", email: "john@example.com", gender: "male", country: "US" }`

#### Scenario: Import creator with social media

- **WHEN** CSV row contains: Full Name="Jane Smith", Handle="@janesmith", Social Media="instagram", Followers="50000"
- **THEN** Lambda creates creator record: `{ full_name: "Jane Smith" }`
- **AND** creates creator_social record: `{ creator_id: <new_id>, handle: "@janesmith", social_media: "instagram", followers: 50000 }`

#### Scenario: Import creator with customer info

- **WHEN** CSV row contains creator fields + customer fields (industry="Fashion", contact_name="Jane Doe Brand")
- **THEN** Lambda creates creator record with creator-specific fields
- **AND** creates customer record with customer-specific fields
- **AND** links records appropriately

#### Scenario: Same creator with multiple social media accounts

- **WHEN** CSV has two rows:
  - Row 1: Handle="@jane_insta", Social Media="instagram", Full Name="Jane Smith"
  - Row 2: Handle="@jane_tiktok", Social Media="tiktok", Full Name="Jane Smith"
- **THEN** Lambda creates one creator record (or finds existing by email/name)
- **AND** creates two creator_social records linked to same creator_id

#### Scenario: Import campaign and post data

- **WHEN** CSV row contains campaign fields (name, budget, status) and post fields (post_url, views, reach)
- **THEN** Lambda creates creator record
- **AND** creates campaign record
- **AND** creates post record
- **AND** creates campaign_creator junction record linking all entities

### Requirement: Row-Level Validation

The system SHALL validate each CSV row against database schema requirements, logging row-specific errors while continuing to process remaining rows.

#### Scenario: Missing required field

- **WHEN** CSV row 5 is missing required field "full_name" (non-nullable in database)
- **THEN** Lambda skips row 5
- **AND** logs error: `{ level: ERROR, message: "Row 5: Missing required field 'full_name'", rowNumber: 5 }`
- **AND** continues processing row 6

#### Scenario: Invalid data type

- **WHEN** CSV row 10 has followers="abc" (non-numeric value for numeric field)
- **THEN** Lambda skips row 10
- **AND** logs error: `{ level: ERROR, message: "Row 10: Invalid value 'abc' for field 'followers' (expected number)", rowNumber: 10 }`

#### Scenario: Invalid enum value

- **WHEN** CSV row 15 has gender="unknown" (not in enum: male, female)
- **THEN** Lambda skips row 15
- **AND** logs error: `{ level: ERROR, message: "Row 15: Invalid value 'unknown' for field 'gender' (allowed: male, female)", rowNumber: 15 }`

#### Scenario: Empty row

- **WHEN** CSV row 20 has all empty fields
- **THEN** Lambda skips row 20
- **AND** logs warning: `{ level: WARNING, message: "Row 20: Empty row - skipped", rowNumber: 20 }`

#### Scenario: Partial data

- **WHEN** CSV row 25 has full_name but missing all other fields
- **THEN** Lambda creates creator record with available data
- **AND** logs warning: `{ level: WARNING, message: "Row 25: Created with partial data (missing optional fields)", rowNumber: 25 }`

### Requirement: Job Summary and Results

The system SHALL generate a comprehensive summary of import results, including total processed, success count, error count, and duplicate count.

#### Scenario: Successful import job result

- **WHEN** an import job completes successfully with 100 rows processed, 95 created, 3 duplicates skipped, 2 errors
- **THEN** job status is updated to COMPLETED
- **AND** job.result contains: `{ totalRows: 100, successCount: 95, errorCount: 2, duplicateCount: 3, skippedCount: 5 }`
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
  - "Successfully Imported: 95"
  - "Errors: 2"
  - "Duplicates Skipped: 3"
- **AND** user can click "View Detailed Logs" to see row-level errors

### Requirement: Job History Panel

The system SHALL provide a job history panel showing all import jobs with status indicators, filterable by status and date.

#### Scenario: View all import jobs

- **WHEN** a user with `influencer:Import` permission visits Import Center
- **THEN** the system displays job history panel with columns: ID, File Name, Status, Created At, Completed At
- **AND** jobs are ordered by createdAt DESC (most recent first)
- **AND** status badges are color-coded: Created (blue), In Progress (yellow), Completed (green), Error (red)

#### Scenario: Filter jobs by status

- **WHEN** user selects "Completed" from status filter dropdown
- **THEN** the system shows only jobs with status COMPLETED

#### Scenario: Polling for in-progress jobs

- **WHEN** user views job history panel
- **AND** there are jobs with status RUNNING
- **THEN** the frontend polls `GET /api/jobs` every 5 seconds
- **AND** updates status badges in real-time
- **AND** stops polling when all jobs are COMPLETED or FAILED

#### Scenario: Non-admin users see only their jobs

- **WHEN** a non-admin user views job history
- **THEN** the system returns only jobs where userId = current user
- **AND** user cannot see imports created by other users

#### Scenario: Admin users see all jobs

- **WHEN** an admin user views job history
- **THEN** the system returns all import jobs from all users
- **AND** displays username column showing who created each job

### Requirement: Job Detail and Log View

The system SHALL provide a detailed view for each job, showing execution logs with filtering capabilities and export functionality.

#### Scenario: View job detail page

- **WHEN** user clicks a job in history panel
- **THEN** the system navigates to `/import-center/{jobId}`
- **AND** displays job metadata: File Name, Status, Created At, Completed At, Duration
- **AND** displays summary: Total Rows, Success, Errors, Duplicates

#### Scenario: View execution logs

- **WHEN** user views job detail page
- **THEN** the system fetches `GET /api/jobs/{jobId}/logs`
- **AND** displays logs in table with columns: Timestamp, Level, Message, Row #
- **AND** ERROR logs are highlighted in red
- **AND** WARNING logs are highlighted in yellow
- **AND** INFO logs are standard color

#### Scenario: Filter logs by level

- **WHEN** user selects "Errors Only" filter
- **THEN** the system shows only logs where level = ERROR
- **AND** displays count: "Showing 5 errors"

#### Scenario: Search logs by message

- **WHEN** user enters "duplicate" in search box
- **THEN** the system filters logs where message contains "duplicate" (case-insensitive)

#### Scenario: Export logs to CSV

- **WHEN** user clicks "Export Logs" button
- **THEN** the system downloads CSV file named `import-job-{jobId}-logs.csv`
- **AND** CSV contains all logs with columns: Timestamp, Level, Message, Row Number

#### Scenario: View row-specific errors

- **WHEN** user views logs for failed job
- **THEN** ERROR logs include rowNumber field
- **AND** user can identify exactly which CSV rows failed: "Row 15: Missing required field 'full_name'"

### Requirement: Permission-Based Access Control

The system SHALL restrict import functionality to users with `influencer:Import` permission, enforced at both API and UI levels.

#### Scenario: User with permission accesses Import Center

- **WHEN** a user with `influencer:Import` permission navigates to `/import-center`
- **THEN** the system renders import UI successfully
- **AND** user can upload CSV and create import jobs

#### Scenario: User without permission denied

- **WHEN** a user without `influencer:Import` permission attempts to navigate to `/import-center`
- **THEN** the system returns HTTP 403 Forbidden
- **AND** redirects to dashboard or shows "Insufficient permissions" message

#### Scenario: Import Center link hidden for unauthorized users

- **WHEN** a user without `influencer:Import` permission views sidebar navigation
- **THEN** the "Import Center" link is not displayed
- **AND** user cannot accidentally discover the route

#### Scenario: API enforces permission

- **WHEN** a user without `influencer:Import` permission attempts `POST /api/jobs` with jobType="influencer_import"
- **THEN** the system returns HTTP 403 Forbidden with error "Insufficient permissions: influencer:Import required"

#### Scenario: Admin and Editor roles have permission

- **WHEN** Admin or Editor role is assigned to user
- **THEN** the role includes `influencer:Import` permission by default
- **AND** user can access Import Center

### Requirement: Data Integrity and Transactions

The system SHALL ensure data integrity during import operations, using database transactions where appropriate to prevent partial updates.

#### Scenario: Creator and social media created atomically

- **WHEN** CSV row requires creating both creator and creator_social records
- **THEN** both inserts are wrapped in a transaction
- **AND** if creator_social insert fails, creator insert is rolled back
- **AND** error is logged: "Row 10: Failed to create social media record - transaction rolled back"

#### Scenario: Partial failure recovery

- **WHEN** job processes 100 rows and row 50 causes transaction failure
- **THEN** rows 1-49 are committed successfully
- **AND** row 50 is logged as error and skipped
- **AND** rows 51-100 continue processing

#### Scenario: Database constraint violations logged

- **WHEN** CSV row violates unique constraint (e.g., duplicate email)
- **THEN** Lambda catches constraint violation error
- **AND** logs error: `{ level: ERROR, message: "Row 25: Email 'john@example.com' already exists", rowNumber: 25 }`
- **AND** continues processing next row

#### Scenario: Foreign key relationships maintained

- **WHEN** CSV row references campaign_id that doesn't exist
- **THEN** Lambda either creates campaign first or logs error
- **AND** ensures referential integrity is maintained

### Requirement: Audit Trail

The system SHALL log all import operations to the audit table for compliance and security monitoring.

#### Scenario: Import job creation audited

- **WHEN** a user creates an import job
- **THEN** an audit event is created with:
  - `actorId` = current user ID
  - `action` = "CREATE ImportJob"
  - `entityType` = "job"
  - `entityId` = job ID
  - `afterState` = { jobType: "influencer_import", fileName: "creators.csv", duplicateHandling: "skip" }

#### Scenario: Import completion audited

- **WHEN** an import job completes successfully
- **THEN** an audit event is created with:
  - `action` = "COMPLETE ImportJob"
  - `entityType` = "job"
  - `afterState` = { totalRows: 100, successCount: 95, errorCount: 2, duplicateCount: 3 }

#### Scenario: Import failure audited

- **WHEN** an import job fails
- **THEN** an audit event is created with:
  - `action` = "FAIL ImportJob"
  - `entityType` = "job"
  - `afterState` = { errorReason: "CSV parsing error", rowNumber: 15 }

### Requirement: CSV Template and Documentation

The system SHALL provide a downloadable CSV template with all supported columns and example data to guide users.

#### Scenario: Download CSV template

- **WHEN** user clicks "Download Template" button in Import Center
- **THEN** the system downloads `influencer_import_template.csv`
- **AND** CSV contains headers for all supported fields
- **AND** includes one example row with sample data

#### Scenario: Template includes all field mappings

- **WHEN** user views CSV template
- **THEN** headers include all creator fields: full_name, email, gender, country, phone_number, characteristics, past_clients, past_campaigns, comments
- **AND** headers include creator_social fields: handle, social_media, social_link, followers, engagement_rate, avg_impressions, avg_views
- **AND** headers include customer fields: name, industry, country, contact_name, contact_email, contact_phone, notes
- **AND** headers include campaign fields: customer_id, name, start_date, end_date, budget_total, currency_code, status, notes
- **AND** headers include post fields: campaign_creator_id, post_url, social_media_type, caption, published_at, views, reach, likes, comments, saves, shares, clicks_link, cost

#### Scenario: Template includes field descriptions

- **WHEN** user views template (if using Excel/Sheets with comments)
- **THEN** headers have comments explaining: field type (text/number/date), required vs optional, enum values (e.g., gender: male/female)

### Requirement: Error Message Clarity

The system SHALL provide clear, actionable error messages for common failure scenarios to help users resolve issues quickly.

#### Scenario: Missing required field error

- **WHEN** import fails due to missing full_name
- **THEN** error message is: "Row 5: Missing required field 'Full Name'. Please ensure all rows have a value for this field."

#### Scenario: Invalid data type error

- **WHEN** import fails due to non-numeric followers value
- **THEN** error message is: "Row 10: Invalid value 'abc' for 'Followers'. Expected a number (e.g., 50000)."

#### Scenario: Duplicate handle error

- **WHEN** import encounters duplicate with "skip" mode
- **THEN** message is: "Row 5: Duplicate handle '@influencer123' - skipped. Change duplicate handling to 'Update' to modify existing records."

#### Scenario: CSV parsing error

- **WHEN** CSV file has malformed data (unclosed quotes, inconsistent columns)
- **THEN** error message is: "CSV parsing failed at row 15. Please check file formatting (e.g., properly escaped quotes, consistent column count)."

#### Scenario: File size warning

- **WHEN** file exceeds 10MB
- **THEN** warning message is: "File size is 15MB (recommended: <10MB). Large imports may take 5-10 minutes. Consider splitting into smaller files for faster processing."

### Requirement: Performance and Scalability

The system SHALL handle CSV files up to 10,000 rows efficiently, processing within reasonable timeframes without timing out.

#### Scenario: Process 1000 rows in <60 seconds

- **WHEN** import job processes CSV with 1000 valid rows
- **THEN** Lambda completes processing within 60 seconds
- **AND** job status updates from RUNNING to COMPLETED

#### Scenario: Process 10,000 rows in <5 minutes

- **WHEN** import job processes CSV with 10,000 rows
- **THEN** Lambda completes processing within 5 minutes (300 seconds, within Lambda timeout)

#### Scenario: Batch database inserts

- **WHEN** Lambda processes CSV rows
- **THEN** rows are inserted in batches of 100 (not one-by-one)
- **AND** batch inserts use Prisma's `createMany()` for efficiency

#### Scenario: Lambda memory and timeout

- **WHEN** Lambda is configured for import jobs
- **THEN** memory is set to 1024MB (sufficient for CSV parsing)
- **AND** timeout is set to 300 seconds (5 minutes)
- **AND** reserved concurrency is 10 (prevent overwhelming DB)

#### Scenario: Progress indication

- **WHEN** user views in-progress job
- **THEN** UI shows "In Progress" status
- **AND** optionally shows estimated time remaining (if result includes progressCount)

