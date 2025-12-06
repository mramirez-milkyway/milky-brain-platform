# Change: Add Async Job Processing System

## Why

The platform requires a scalable, generic infrastructure to handle long-running background tasks (CSV imports, bulk operations, data migrations) without blocking HTTP requests or timing out. Currently, there is no mechanism to process asynchronous workloads that exceed typical request timeouts.

## What Changes

- Add **generic async job processing infrastructure** using AWS Lambda + SQS + S3
- Create database schema for job tracking (`Job` model) and execution logs (`JobLog` model)
- Provision AWS infrastructure (S3 bucket, SQS queue, Lambda function) via Terraform
- Implement backend services for job creation, status tracking, and log retrieval
- Create Lambda processor with pluggable handler architecture (Strategy pattern)
- Add REST API endpoints for job management (`POST /api/jobs`, `GET /api/jobs`, `GET /api/jobs/:id`, `GET /api/jobs/:id/logs`)
- Implement security (IAM least privilege, encryption, VPC isolation)
- Add CloudWatch monitoring and alerting

**Architecture:**
1. User submits job via API → API creates Job record (PENDING) + uploads file to S3 + publishes to SQS → returns job ID
2. SQS triggers Lambda → Lambda updates status (RUNNING) + downloads file + executes handler → updates status (COMPLETED/FAILED)
3. User polls API for job status and execution logs

**This is infrastructure-only** - no specific job types are implemented in this change. Handlers are pluggable and will be added in subsequent changes.

## Impact

**Affected specs:**
- NEW: `async-job-processing` (this change creates the capability)

**Affected code:**
- Database: `apps/api/prisma/schema.prisma` (add Job, JobLog models)
- Backend: `apps/api/src/jobs/` (new module with service, repository, controller, DTOs)
- Backend: `apps/api/src/common/services/` (new S3Service, SqsService)
- Lambda: `lambdas/job-processor/` (new Lambda function)
- Infrastructure: `infrastructure/modules/` (new s3-jobs, sqs-jobs, lambda-jobs modules)
- Infrastructure: `infrastructure/environments/qa/main.tf` (integrate new modules)
- Infrastructure: `infrastructure/modules/ec2/main.tf` (add IAM policies for S3/SQS)
- Configuration: `.env.example`, `Makefile`

**Breaking changes:** None (this is a new capability)

**Dependencies:**
- AWS SDK (`@aws-sdk/client-s3`, `@aws-sdk/client-sqs`)
- Prisma Client (existing)
- NestJS Multer (file uploads)

**Security considerations:**
- All S3 objects encrypted at rest (AES-256)
- SQS messages encrypted at rest
- IAM least-privilege policies (Lambda: S3/SQS/RDS access only, EC2: S3/SQS send only)
- Lambda in private subnets with VPC security groups
- Job access restricted by user ownership (users see only their jobs, admins see all)
- New permissions: `job:Create`, `job:Read`
