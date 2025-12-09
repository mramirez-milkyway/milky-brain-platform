## ADDED Requirements

### Requirement: CSV File Upload for Clients

The system SHALL allow users with `client:Import` permission to upload CSV files for bulk client import, with file size and type validation.

#### Scenario: Upload valid CSV file

- **WHEN** a user with `client:Import` permission uploads a CSV file (<10MB) via Import Center UI
- **THEN** the frontend shows column mapping interface for Client fields
- **AND** system auto-matches CSV headers to database fields (e.g., "Company Name" -> name, "Industry" -> industry)
- **AND** user can manually adjust mappings via dropdowns

#### Scenario: Upload file exceeding size limit

- **WHEN** a user attempts to upload a CSV file >10MB
- **THEN** the system shows warning message "File size exceeds recommended 10MB limit. Large files may take longer to process."
- **AND** allows upload to proceed (warning, not rejection)

#### Scenario: Upload non-CSV file

- **WHEN** a user attempts to upload a .xlsx or .pdf file
- **THEN** the system shows error "Invalid file type. Please upload .csv or .txt files only."
- **AND** upload is rejected

#### Scenario: Upload without permission

- **WHEN** a user without `client:Import` permission attempts to access Client Import
- **THEN** the system returns HTTP 403 Forbidden
- **AND** Client Import option is hidden in Import Center

### Requirement: Client Column Mapping Interface

The system SHALL provide an interactive column mapping interface allowing users to map CSV columns to Customer database fields before import.

#### Scenario: Auto-match CSV headers to Client fields

- **WHEN** a CSV file with headers is uploaded: "Company Name, Industry, Country, Contact Name, Contact Email, Contact Phone, Notes"
- **THEN** the system attempts to auto-match headers to fields:
  - "Company Name" -> customer.name
  - "Industry" -> customer.industry
  - "Country" -> customer.country
  - "Contact Name" -> customer.contact_name
  - "Contact Email" -> customer.contact_email
  - "Contact Phone" -> customer.contact_phone
  - "Notes" -> customer.notes

#### Scenario: User adjusts column mapping

- **WHEN** auto-matching maps "Client" to customer.name but user wants to map "Organization" instead
- **THEN** user can click dropdown on the column and select the correct target field
- **AND** mapping is updated

#### Scenario: Required field not mapped

- **WHEN** user attempts to proceed without mapping the required field (name)
- **THEN** the system shows error "Required field 'Name' is not mapped. Please map a CSV column to this field."
- **AND** prevents job creation until fixed

#### Scenario: User confirms mapping

- **WHEN** user reviews mappings and clicks "Confirm Import"
- **THEN** the system creates job with payload: `{ columnMapping: { "Company Name": "name", "Industry": "industry", ... }, duplicateHandling: "skip" }`
- **AND** uploads CSV file to S3
- **AND** redirects to job history panel

### Requirement: Client Duplicate Handling Configuration

The system SHALL allow users to choose how to handle duplicate clients during import, based on the `name` field as the primary key for duplicate detection.

#### Scenario: User selects "Skip Duplicates"

- **WHEN** user selects "Skip duplicates" radio button in mapping interface
- **THEN** job payload includes `duplicateHandling: "skip"`
- **AND** Lambda handler skips rows with existing client name
- **AND** logs skipped rows: `{ level: INFO, message: "Row 5: Duplicate client 'Acme Corp' - skipped", rowNumber: 5 }`

#### Scenario: User selects "Update Existing"

- **WHEN** user selects "Update existing records" radio button
- **THEN** job payload includes `duplicateHandling: "update"`
- **AND** Lambda handler updates existing customer record with new data
- **AND** logs updated rows: `{ level: INFO, message: "Row 5: Updated existing client 'Acme Corp'", rowNumber: 5 }`

#### Scenario: Duplicate detection by name (case-insensitive)

- **WHEN** CSV row has name "ACME CORP"
- **AND** database has existing customer record with name "Acme Corp"
- **THEN** the system detects duplicate (case-insensitive comparison)
- **AND** applies configured duplicate handling (skip or update)

#### Scenario: No duplicate handling specified defaults to skip

- **WHEN** job is created without duplicateHandling in payload
- **THEN** the system defaults to "skip" mode

### Requirement: Client CSV Parsing and Data Insertion

The system SHALL parse CSV files and insert data into the Customer database table based on column mappings.

#### Scenario: Import client with all fields

- **WHEN** CSV row contains: Name="Acme Corp", Industry="Technology", Country="US", Contact Name="John Doe", Contact Email="john@acme.com", Contact Phone="+1234567890", Notes="Key account"
- **THEN** Lambda creates customer record: `{ name: "Acme Corp", industry: "Technology", country: "US", contact_name: "John Doe", contact_email: "john@acme.com", contact_phone: "+1234567890", notes: "Key account" }`

#### Scenario: Import client with partial data

- **WHEN** CSV row contains only: Name="Beta Inc", Industry="Retail"
- **THEN** Lambda creates customer record with available data: `{ name: "Beta Inc", industry: "Retail" }`
- **AND** other fields remain null

#### Scenario: Import client with empty optional fields

- **WHEN** CSV row has Name="Gamma LLC" and empty values for all other fields
- **THEN** Lambda creates customer record: `{ name: "Gamma LLC" }`
- **AND** logs info: `{ level: INFO, message: "Row 10: Created client with partial data", rowNumber: 10 }`

### Requirement: Client Row-Level Validation

The system SHALL validate each CSV row against database schema requirements, logging row-specific errors while continuing to process remaining rows.

#### Scenario: Missing required field

- **WHEN** CSV row 5 is missing required field "name" (non-nullable in database)
- **THEN** Lambda skips row 5
- **AND** logs error: `{ level: ERROR, message: "Row 5: Missing required field 'name'", rowNumber: 5 }`
- **AND** continues processing row 6

#### Scenario: Empty row

- **WHEN** CSV row 20 has all empty fields
- **THEN** Lambda skips row 20
- **AND** logs warning: `{ level: WARNING, message: "Row 20: Empty row - skipped", rowNumber: 20 }`

#### Scenario: Invalid email format

- **WHEN** CSV row 15 has contact_email="not-an-email"
- **THEN** Lambda skips row 15
- **AND** logs error: `{ level: ERROR, message: "Row 15: Invalid email format for 'contact_email'", rowNumber: 15 }`

### Requirement: Client Import Job Summary and Results

The system SHALL generate a comprehensive summary of import results, including total processed, success count, error count, and duplicate count.

#### Scenario: Successful import job result

- **WHEN** an import job completes successfully with 100 rows processed, 95 created, 3 duplicates skipped, 2 errors
- **THEN** job status is updated to COMPLETED
- **AND** job.result contains: `{ totalRows: 100, successCount: 95, errorCount: 2, duplicateCount: 3, skippedCount: 5, createdClients: 95, updatedClients: 0 }`
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

### Requirement: Client Import Job History in Import Center

The system SHALL display client import jobs in the existing Import Center job history panel alongside influencer import jobs.

#### Scenario: View all import jobs

- **WHEN** a user with `client:Import` permission visits Import Center
- **THEN** the system displays job history panel with columns: ID, File Name, Job Type, Status, Created At, Completed At
- **AND** client_import jobs are included alongside influencer_import jobs
- **AND** jobs are ordered by createdAt DESC (most recent first)
- **AND** status badges are color-coded: Pending (blue), Running (yellow), Completed (green), Failed (red)

#### Scenario: Filter jobs by type

- **WHEN** user selects "Client Import" from job type filter dropdown
- **THEN** the system shows only jobs with jobType = "client_import"

#### Scenario: Polling for in-progress jobs

- **WHEN** user views job history panel
- **AND** there are jobs with status RUNNING
- **THEN** the frontend polls `GET /api/jobs` every 5 seconds
- **AND** updates status badges in real-time
- **AND** stops polling when all jobs are COMPLETED or FAILED

### Requirement: Client Import Job Detail and Log View

The system SHALL provide a detailed view for each client import job, showing execution logs with filtering capabilities.

#### Scenario: View job detail page

- **WHEN** user clicks a client import job in history panel
- **THEN** the system navigates to `/import-center/{jobId}`
- **AND** displays job metadata: File Name, Job Type (Client Import), Status, Created At, Completed At, Duration
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

### Requirement: Client Import Permission-Based Access Control

The system SHALL restrict client import functionality to users with `client:Import` permission, enforced at both API and UI levels.

#### Scenario: User with permission accesses Client Import

- **WHEN** a user with `client:Import` permission navigates to Import Center
- **THEN** the system displays "Client Import" option in the import type selector
- **AND** user can upload CSV and create client import jobs

#### Scenario: User without permission denied

- **WHEN** a user without `client:Import` permission attempts to create a client_import job via API
- **THEN** the system returns HTTP 403 Forbidden with error "Insufficient permissions: client:Import required"

#### Scenario: Client Import option hidden for unauthorized users

- **WHEN** a user without `client:Import` permission views Import Center
- **THEN** the "Client Import" option is not displayed in the import type selector

#### Scenario: Admin and Editor roles have permission

- **WHEN** Admin or Editor role is assigned to user
- **THEN** the role includes `client:Import` permission by default
- **AND** user can access Client Import functionality

### Requirement: Client Import Audit Trail

The system SHALL log all client import operations to the audit table for compliance and security monitoring.

#### Scenario: Import job creation audited

- **WHEN** a user creates a client import job
- **THEN** an audit event is created with:
  - `actorId` = current user ID
  - `action` = "CREATE ImportJob"
  - `entityType` = "job"
  - `entityId` = job ID
  - `afterState` = { jobType: "client_import", fileName: "clients.csv", duplicateHandling: "skip" }

#### Scenario: Import completion audited

- **WHEN** a client import job completes successfully
- **THEN** an audit event is created with:
  - `action` = "COMPLETE ImportJob"
  - `entityType` = "job"
  - `afterState` = { totalRows: 100, successCount: 95, errorCount: 2, duplicateCount: 3 }

#### Scenario: Import failure audited

- **WHEN** a client import job fails
- **THEN** an audit event is created with:
  - `action` = "FAIL ImportJob"
  - `entityType` = "job"
  - `afterState` = { errorReason: "CSV parsing error", rowNumber: 15 }

### Requirement: Client CSV Template

The system SHALL provide a downloadable CSV template with all supported Client columns and example data.

#### Scenario: Download CSV template

- **WHEN** user selects "Client Import" and clicks "Download Template" button
- **THEN** the system downloads `client_import_template.csv`
- **AND** CSV contains headers for all Customer fields: name, industry, country, contact_name, contact_email, contact_phone, notes
- **AND** includes one example row with sample data

#### Scenario: Template includes required field indicator

- **WHEN** user views CSV template
- **THEN** the first column is "name" (required)
- **AND** template header row includes: name*, industry, country, contact_name, contact_email, contact_phone, notes

### Requirement: Client Import Performance

The system SHALL handle CSV files up to 10,000 rows efficiently, processing within reasonable timeframes.

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
