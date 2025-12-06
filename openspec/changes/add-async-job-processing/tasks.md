# Implementation Tasks

## 1. Database Schema
- [x] 1.1 Add Job model to Prisma schema with fields (taskId, jobType, status, queue, attempts, maxAttempts, errorReason, fileUrl, fileKey, fileName, payload, result, meta, userId, timestamps)
- [x] 1.2 Add JobLog model to Prisma schema with fields (jobId, level, message, rowNumber, meta, createdAt)
- [x] 1.3 Add LogLevel enum (DEBUG, INFO, WARNING, ERROR)
- [x] 1.4 Add JobStatus enum (PENDING, RUNNING, COMPLETED, FAILED, RETRYING)
- [x] 1.5 Add jobs relation to User model
- [x] 1.6 Generate and run Prisma migration: `npx prisma migrate dev --name="add_job_processing_system"`

## 2. Terraform Infrastructure
- [x] 2.1 Create `infrastructure/modules/s3-jobs/` module (bucket with versioning, encryption, lifecycle, CORS)
- [x] 2.2 Create `infrastructure/modules/sqs-jobs/` module (queue + DLQ + CloudWatch alarms)
- [x] 2.3 Create `infrastructure/modules/lambda-job-processor/` module (function + IAM + VPC + event source mapping)
- [x] 2.4 Integrate modules in `infrastructure/environments/qa/main.tf`
- [x] 2.5 Add S3/SQS IAM policies to EC2 role (added in qa/main.tf)
- [x] 2.6 Add RDS security group rule to allow Lambda access
- [x] 2.7 Add outputs for job processing resources
- [x] 2.8 Store job processing config in AWS Secrets Manager
- [ ] 2.9 Run `terraform init && terraform apply` for QA environment (requires AWS access)

## 3. Backend Services (NestJS)
- [x] 3.1 Create `apps/api/src/jobs/jobs.repository.ts` (database access layer)
- [x] 3.2 Create `apps/api/src/jobs/jobs.service.ts` (business logic)
- [x] 3.3 Create `apps/api/src/common/services/s3.service.ts` (S3 operations)
- [x] 3.4 Create `apps/api/src/common/services/sqs.service.ts` (SQS message publishing)
- [x] 3.5 Create `apps/api/src/jobs/dto/create-job.dto.ts` (validation)
- [x] 3.6 Create `apps/api/src/jobs/dto/job-response.dto.ts` (response format)
- [x] 3.7 Create `apps/api/src/jobs/dto/job-query.dto.ts` (query parameters)
- [x] 3.8 Create `apps/api/src/jobs/jobs.controller.ts` (REST endpoints)
- [x] 3.9 Create `apps/api/src/jobs/jobs.module.ts` (module registration)
- [x] 3.10 Register JobsModule in `apps/api/src/app.module.ts`

## 4. Lambda Function
- [x] 4.1 Create `lambdas/job-processor/src/index.ts` (SQS batch handler)
- [x] 4.2 Create `lambdas/job-processor/src/job-processor.ts` (core processing logic)
- [x] 4.3 Create `lambdas/job-processor/src/handlers/base-handler.ts` (IJobHandler interface)
- [x] 4.4 Create `lambdas/job-processor/src/handlers/handler-registry.ts` (Strategy pattern registry)
- [x] 4.5 Create `lambdas/job-processor/src/handlers/example-handler.ts` (example implementation)
- [x] 4.6 Create `lambdas/job-processor/src/database/client.ts` (Prisma singleton)
- [x] 4.7 Create `lambdas/job-processor/src/services/s3.service.ts` (S3 download)
- [x] 4.8 Create `lambdas/job-processor/src/services/logger.service.ts` (structured logging)
- [x] 4.9 Create `lambdas/job-processor/package.json` (dependencies)
- [x] 4.10 Create `lambdas/job-processor/tsconfig.json` (TypeScript config)
- [x] 4.11 Create `lambdas/job-processor/build.sh` (build and package script)
- [ ] 4.12 Build Lambda: `cd lambdas/job-processor && npm run build` (requires npm install first)
- [ ] 4.13 Deploy Lambda: `aws lambda update-function-code --function-name qa-milky-way-admin-panel-job-processor --zip-file fileb://lambda.zip` (requires AWS infrastructure)

## 5. Testing
- [ ] 5.1 Create `apps/api/src/jobs/tests/unit/jobs.service.spec.ts` (service unit tests)
- [ ] 5.2 Create `apps/api/src/jobs/tests/unit/jobs.repository.spec.ts` (repository unit tests)
- [ ] 5.3 Run backend tests: `cd apps/api && npm test`

## 6. Configuration
- [x] 6.1 Add environment variables to `.env.example`: S3_JOBS_BUCKET_NAME, SQS_JOBS_QUEUE_URL, AWS_REGION
- [x] 6.2 Add Makefile targets: lambda-build, lambda-deploy, lambda-logs
- [ ] 6.3 Update local .env with Terraform outputs (requires infrastructure deployment)

## 7. Documentation
- [x] 7.1 Update AGENTS.md to reflect Lambda + SQS usage (already done - no Celery)
- [x] 7.2 Document job handler creation process in `lambdas/job-processor/README.md`
- [x] 7.3 Create system overview documentation in `docs/JOB_PROCESSING_SYSTEM.md`
- [x] 7.4 Create Terraform deployment guide in `infrastructure/DEPLOYMENT_GUIDE.md`
- [ ] 7.5 Add CloudWatch dashboard for monitoring job processing metrics (optional enhancement)

## 8. Validation
- [ ] 8.1 Test job creation via API: `POST /api/jobs` with file upload
- [ ] 8.2 Verify file uploaded to S3
- [ ] 8.3 Verify message in SQS queue
- [ ] 8.4 Verify Lambda triggered and processed job
- [ ] 8.5 Verify job status updated (PENDING → RUNNING → COMPLETED)
- [ ] 8.6 Verify logs created in JobLog table
- [ ] 8.7 Test job status retrieval: `GET /api/jobs/:id`
- [ ] 8.8 Test job logs retrieval: `GET /api/jobs/:id/logs`
- [ ] 8.9 Test pagination and filtering: `GET /api/jobs?jobType=example&status=COMPLETED&page=1&pageSize=20`
- [ ] 8.10 Test permission enforcement (job:Create, job:Read)
- [ ] 8.11 Test failure scenario and retry logic (max 3 attempts)
- [ ] 8.12 Verify CloudWatch alarms trigger for DLQ messages
