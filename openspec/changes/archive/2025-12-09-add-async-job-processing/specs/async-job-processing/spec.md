# async-job-processing Specification

## Purpose
Provides a scalable, generic infrastructure for processing long-running background tasks asynchronously using AWS Lambda + SQS + S3, with comprehensive job tracking, logging, and monitoring capabilities.

## ADDED Requirements

### Requirement: Job Creation with File Upload

The system SHALL allow authenticated users to create asynchronous jobs with optional file uploads, immediately returning a job ID without blocking for completion.

#### Scenario: Create job without file

- **WHEN** an authenticated user sends `POST /api/jobs` with payload: `{ jobType: "example", payload: { test: "data" } }`
- **THEN** the system creates a Job record with status PENDING
- **AND** generates a unique taskId (UUID v4)
- **AND** publishes a message to SQS queue
- **AND** returns HTTP 201 with: `{ id: 1, taskId: "uuid", jobType: "example", status: "PENDING", createdAt: "2025-12-02T10:00:00Z" }`
- **AND** response time is <500ms (non-blocking)

#### Scenario: Create job with file upload

- **WHEN** an authenticated user sends `POST /api/jobs` with multipart/form-data containing: `jobType: "csv_import"`, `file: test.csv (5MB)`
- **THEN** the system uploads file to S3 bucket at path `jobs/{taskId}/{timestamp}-test.csv`
- **AND** creates Job record with fileUrl, fileKey, fileName populated
- **AND** publishes SQS message including fileUrl
- **AND** returns job ID immediately

#### Scenario: File upload size exceeded

- **WHEN** a user attempts to upload a file >10MB
- **THEN** the system returns HTTP 413 with error "File size exceeds 10MB limit"
- **AND** no Job record is created
- **AND** no file is uploaded to S3

#### Scenario: Invalid job type rejected

- **WHEN** a user sends `POST /api/jobs` with `jobType: "nonexistent_type"`
- **THEN** the system returns HTTP 400 with error "Invalid job type"

#### Scenario: Unauthenticated request rejected

- **WHEN** an unauthenticated request is sent to `POST /api/jobs`
- **THEN** the system returns HTTP 401 Unauthorized

#### Scenario: Insufficient permissions rejected

- **WHEN** an authenticated user without `job:Create` permission attempts to create a job
- **THEN** the system returns HTTP 403 Forbidden with error "Insufficient permissions"

### Requirement: Asynchronous Job Processing

The system SHALL process jobs asynchronously via AWS Lambda triggered by SQS messages, updating job status and logging execution details to the database.

#### Scenario: Successful job processing

- **WHEN** a SQS message is delivered to Lambda for a PENDING job
- **THEN** Lambda fetches the Job record by taskId
- **AND** updates status to RUNNING with startedAt timestamp
- **AND** increments attempts counter
- **AND** downloads file from S3 if fileKey is present
- **AND** retrieves appropriate handler from registry based on jobType
- **AND** executes handler with job context (taskId, payload, fileBuffer, Prisma client, logger)
- **AND** handler returns result object
- **AND** Lambda updates status to COMPLETED with completedAt timestamp and result
- **AND** creates JobLog entries (level: INFO, message: "Job started", "Job completed")

#### Scenario: Job processing with file download

- **WHEN** a job with fileKey is processed
- **THEN** Lambda downloads file from S3 before executing handler
- **AND** passes fileBuffer to handler in JobContext
- **AND** logs file size: `JobLog { level: INFO, message: "Downloaded file: 5242880 bytes" }`

#### Scenario: Job processing failure

- **WHEN** a handler throws an error during execution
- **AND** attempts < maxAttempts (3)
- **THEN** Lambda creates JobLog with level ERROR and error message
- **AND** updates job status to RETRYING
- **AND** Lambda throws error to trigger SQS retry mechanism
- **AND** SQS redelivers message after visibility timeout

#### Scenario: Job exceeds maximum retries

- **WHEN** a job fails and attempts >= maxAttempts (3)
- **THEN** Lambda updates status to FAILED with errorReason
- **AND** sets completedAt timestamp
- **AND** creates final JobLog: `{ level: ERROR, message: "Job failed after 3 attempts" }`
- **AND** does not throw error (SQS deletes message)

#### Scenario: No handler registered for job type

- **WHEN** Lambda processes a job with jobType "unknown_type"
- **AND** handler registry has no handler for this type
- **THEN** Lambda creates JobLog: `{ level: ERROR, message: "No handler registered for job type: unknown_type" }`
- **AND** updates status to FAILED
- **AND** does not retry

#### Scenario: Job not found in database

- **WHEN** Lambda receives SQS message with taskId that doesn't exist in database
- **THEN** Lambda logs error and throws exception
- **AND** SQS moves message to Dead Letter Queue after max receive count (3)

### Requirement: Job Status Tracking

The system SHALL allow users to query job status, details, and execution logs via REST API.

#### Scenario: Get job by ID

- **WHEN** an authenticated user sends `GET /api/jobs/1`
- **AND** the job belongs to the user (or user is admin)
- **THEN** the system returns HTTP 200 with full job details: `{ id, taskId, jobType, status, queue, attempts, maxAttempts, errorReason, fileName, payload, result, meta, startedAt, completedAt, createdAt, updatedAt }`

#### Scenario: Get job not owned by user

- **WHEN** a non-admin user sends `GET /api/jobs/5` for a job created by another user
- **THEN** the system returns HTTP 404 Not Found

#### Scenario: Admin can view any job

- **WHEN** a user with Admin role sends `GET /api/jobs/5` for another user's job
- **THEN** the system returns HTTP 200 with full job details

#### Scenario: Job not found

- **WHEN** a user sends `GET /api/jobs/999` for a non-existent job
- **THEN** the system returns HTTP 404 Not Found

#### Scenario: Insufficient permissions to read job

- **WHEN** an authenticated user without `job:Read` permission sends `GET /api/jobs/1`
- **THEN** the system returns HTTP 403 Forbidden

### Requirement: Job Execution Logs

The system SHALL record detailed execution logs for each job in the JobLog table, including info, warnings, and errors.

#### Scenario: Get job logs

- **WHEN** an authenticated user sends `GET /api/jobs/1/logs`
- **AND** the job belongs to the user (or user is admin)
- **THEN** the system returns HTTP 200 with array of logs ordered by createdAt ASC: `[{ id, jobId, level, message, rowNumber, meta, createdAt }]`

#### Scenario: Job logs include processing steps

- **WHEN** retrieving logs for a completed job
- **THEN** the logs include entries like:
  - `{ level: INFO, message: "Job started (attempt 1/3)" }`
  - `{ level: INFO, message: "Downloading file from S3" }`
  - `{ level: INFO, message: "Executing job handler" }`
  - `{ level: INFO, message: "Job completed successfully" }`

#### Scenario: Job logs include errors

- **WHEN** retrieving logs for a failed job
- **THEN** the logs include entries like:
  - `{ level: ERROR, message: "Job failed: Invalid CSV format" }`
  - `{ level: ERROR, message: "Job failed after 3 attempts" }`

#### Scenario: Row-specific logs for CSV processing

- **WHEN** a CSV import job logs row-level issues
- **THEN** logs include rowNumber field: `{ level: WARNING, message: "Row 5: Missing required field 'email'", rowNumber: 5 }`

#### Scenario: Logs not accessible to other users

- **WHEN** a non-admin user sends `GET /api/jobs/5/logs` for another user's job
- **THEN** the system returns HTTP 404 Not Found

### Requirement: Job Listing and Filtering

The system SHALL allow users to list jobs with pagination and filtering by job type, status, and user.

#### Scenario: List jobs with default pagination

- **WHEN** an authenticated user sends `GET /api/jobs`
- **THEN** the system returns HTTP 200 with paginated response: `{ data: [jobs], total: 100, page: 1, pageSize: 20 }`
- **AND** data includes up to 20 most recent jobs ordered by createdAt DESC
- **AND** non-admin users see only their own jobs
- **AND** admin users see all jobs

#### Scenario: Filter jobs by type

- **WHEN** a user sends `GET /api/jobs?jobType=csv_import`
- **THEN** the system returns only jobs where jobType = "csv_import"

#### Scenario: Filter jobs by status

- **WHEN** a user sends `GET /api/jobs?status=COMPLETED`
- **THEN** the system returns only jobs where status = "COMPLETED"

#### Scenario: Combined filters

- **WHEN** a user sends `GET /api/jobs?jobType=csv_import&status=FAILED&page=2&pageSize=50`
- **THEN** the system returns page 2 of failed csv_import jobs (up to 50 results)

#### Scenario: Custom pagination

- **WHEN** a user sends `GET /api/jobs?page=3&pageSize=10`
- **THEN** the system returns 10 jobs starting from offset 20 (page 3)

#### Scenario: Empty result set

- **WHEN** a user queries for jobs that don't exist (e.g., `GET /api/jobs?status=FAILED` but no failed jobs)
- **THEN** the system returns HTTP 200 with `{ data: [], total: 0, page: 1, pageSize: 20 }`

### Requirement: Job Handler Registry

The system SHALL support pluggable job handlers using the Strategy pattern, allowing new job types to be added without modifying core processing logic.

#### Scenario: Register new job handler

- **WHEN** a developer creates a new handler class implementing IJobHandler interface
- **AND** registers it in HandlerRegistry: `registry.register("new_job_type", new NewJobHandler())`
- **THEN** Lambda can process jobs with jobType = "new_job_type"
- **AND** no changes to core JobProcessor are required

#### Scenario: Handler receives job context

- **WHEN** a handler's execute() method is called
- **THEN** it receives JobContext containing: `{ taskId, jobType, payload, fileBuffer?, fileName?, prisma, logger }`
- **AND** handler can use Prisma client to access database
- **AND** handler can log via logger function: `await logger(LogLevel.INFO, "Processing row 5")`

#### Scenario: Handler returns result

- **WHEN** a handler completes successfully
- **THEN** it returns result object: `{ success: true, recordsProcessed: 100 }`
- **AND** Lambda stores result in Job.result field

#### Scenario: Handler logs execution details

- **WHEN** a handler executes
- **THEN** it can log at various levels: `await logInfo(context, "Starting import")`, `await logWarning(context, "Duplicate found")`, `await logError(context, "Invalid data")`
- **AND** logs are stored in JobLog table

### Requirement: Infrastructure Security

The system SHALL enforce least-privilege IAM policies, encryption at rest, and VPC isolation for all job processing infrastructure.

#### Scenario: S3 bucket is private and encrypted

- **WHEN** S3 bucket is provisioned via Terraform
- **THEN** public access is blocked (BlockPublicAcls, BlockPublicPolicy, IgnorePublicAcls, RestrictPublicBuckets)
- **AND** server-side encryption (AES-256) is enabled
- **AND** versioning is enabled

#### Scenario: SQS messages are encrypted

- **WHEN** SQS queue is provisioned
- **THEN** SQS-managed encryption is enabled
- **AND** message retention is 14 days
- **AND** Dead Letter Queue is configured with max receive count = 3

#### Scenario: Lambda has minimum IAM permissions

- **WHEN** Lambda IAM role is provisioned
- **THEN** it has permissions for:
  - S3: GetObject, PutObject, DeleteObject on jobs bucket only
  - SQS: ReceiveMessage, DeleteMessage, GetQueueAttributes on jobs queue only
  - RDS: Network access via security group ingress rule
  - CloudWatch: Logs creation via AWSLambdaVPCAccessExecutionRole
- **AND** no wildcard permissions (*) are granted

#### Scenario: Lambda runs in private subnets

- **WHEN** Lambda function is provisioned
- **THEN** it is configured with VPC: private subnet IDs
- **AND** Lambda security group allows outbound traffic
- **AND** RDS security group allows inbound from Lambda security group on port 5432

#### Scenario: EC2 (API) has minimum S3/SQS permissions

- **WHEN** EC2 IAM role is updated
- **THEN** it has permissions for:
  - S3: PutObject, GetObject, DeleteObject, ListBucket on jobs bucket only
  - SQS: SendMessage, GetQueueUrl, GetQueueAttributes on jobs queue only
- **AND** API can upload files and publish messages, but not receive/process them

### Requirement: Monitoring and Alerting

The system SHALL provide CloudWatch monitoring and alerting for job processing failures, performance issues, and Dead Letter Queue messages.

#### Scenario: DLQ alarm triggers

- **WHEN** a message appears in Dead Letter Queue
- **THEN** CloudWatch alarm triggers immediately
- **AND** alarm status changes to ALARM
- **AND** notification is sent (if SNS topic configured)

#### Scenario: Lambda error alarm triggers

- **WHEN** Lambda errors exceed 5 in 5 minutes
- **THEN** CloudWatch alarm for lambda-jobs-errors triggers
- **AND** alarm status changes to ALARM

#### Scenario: Lambda duration alarm triggers

- **WHEN** average Lambda duration exceeds 270 seconds (90% of 300s timeout) over 10 minutes
- **THEN** CloudWatch alarm for lambda-jobs-duration triggers
- **AND** indicates potential timeout issues

#### Scenario: CloudWatch logs retained

- **WHEN** Lambda function executes
- **THEN** structured JSON logs are sent to CloudWatch log group `/aws/lambda/qa-milky-way-admin-panel-job-processor`
- **AND** logs are retained for 30 days
- **AND** logs include: level, context, message, meta, timestamp

#### Scenario: Job metrics available

- **WHEN** jobs are processed
- **THEN** CloudWatch metrics track:
  - Lambda invocations count
  - Lambda errors count
  - Lambda duration (average, p50, p99)
  - SQS messages sent, visible, in-flight
  - DLQ message count

### Requirement: File Lifecycle Management

The system SHALL automatically delete job files from S3 after 30 days to manage storage costs.

#### Scenario: S3 lifecycle policy expires files

- **WHEN** a file is uploaded to S3 jobs bucket
- **THEN** lifecycle policy is applied
- **AND** file is automatically deleted after 30 days
- **AND** non-current versions are deleted after 7 days

#### Scenario: Job record persists after file deletion

- **WHEN** a file is deleted by lifecycle policy after 30 days
- **THEN** Job record remains in database
- **AND** fileUrl and fileKey fields still reference original location
- **AND** attempting to download results in S3 NoSuchKey error (acceptable - files are ephemeral)

### Requirement: Retry Logic and Dead Letter Queue

The system SHALL implement exponential backoff retry logic for transient failures and route permanently failed jobs to a Dead Letter Queue.

#### Scenario: Transient failure triggers retry

- **WHEN** Lambda execution fails due to transient error (e.g., database connection timeout)
- **AND** job attempts = 1
- **THEN** Lambda throws error to SQS
- **AND** SQS hides message for visibility timeout (330 seconds)
- **AND** SQS redelivers message to Lambda
- **AND** Job.attempts is incremented to 2

#### Scenario: Permanent failure routes to DLQ

- **WHEN** SQS delivers message 3 times and Lambda fails each time
- **THEN** SQS moves message to Dead Letter Queue
- **AND** message is not reprocessed automatically
- **AND** CloudWatch alarm triggers

#### Scenario: Manual DLQ processing

- **WHEN** an admin reviews DLQ messages
- **THEN** admin can manually reprocess by creating new job or fixing underlying issue
- **AND** messages remain in DLQ for 14 days before automatic deletion

### Requirement: Job Concurrency Control

The system SHALL limit concurrent Lambda executions to prevent database connection pool exhaustion.

#### Scenario: Reserved concurrency enforced

- **WHEN** Lambda function is provisioned
- **THEN** reserved concurrency is set to 10
- **AND** maximum 10 Lambda instances can execute simultaneously
- **AND** additional SQS messages wait in queue

#### Scenario: Database connection pooling

- **WHEN** Lambda function initializes Prisma client
- **THEN** connection pooling is configured for Lambda environment
- **AND** connections are reused across warm invocations
- **AND** connections are closed on function shutdown

#### Scenario: SQS scaling configuration

- **WHEN** SQS event source mapping is configured
- **THEN** batch size is set to 1 (process one job at a time)
- **AND** maximum concurrency is set to 10
- **AND** batching window is 5 seconds
