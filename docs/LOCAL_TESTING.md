# Local Testing Guide

Complete guide for running and testing the Milky Way Admin Panel locally with full AWS infrastructure simulation.

---

## Table of Contents

1. [Quick Start (5 Minutes)](#quick-start-5-minutes)
2. [Prerequisites](#prerequisites)
3. [Local Environment Setup](#local-environment-setup)
4. [Testing Strategies](#testing-strategies)
5. [Common Testing Scenarios](#common-testing-scenarios)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Topics](#advanced-topics)

---

## Quick Start (5 Minutes)

Get the full system running locally in 3 commands:

```bash
# 1. Start LocalStack (simulated AWS)
make localstack-up

# 2. Setup infrastructure (S3, SQS, Lambda)
make localstack-setup

# 3. Start all services
docker-compose up -d
```

**That's it!** You now have:
- ✅ PostgreSQL database
- ✅ Redis cache
- ✅ LocalStack (S3, SQS, Lambda)
- ✅ NestJS API
- ✅ Next.js Web App

**Access URLs:**
- API: http://localhost:4000
- Web App: http://localhost:3000
- LocalStack: http://localhost:4566
- PostgreSQL: localhost:5432

---

## Prerequisites

### Required Software

```bash
# Docker Desktop (required)
# Download from: https://www.docker.com/products/docker-desktop

# Terraform (for infrastructure)
brew install terraform

# AWS CLI (for LocalStack interaction)
brew install awscli

# jq (for JSON parsing in scripts)
brew install jq

# Node.js 18+ (if running outside Docker)
brew install node@18
```

### Verify Installation

```bash
docker --version          # Should be 20.10+
terraform --version       # Should be 1.0+
aws --version            # Should be 2.0+
jq --version             # Any version
node --version           # Should be 18+
```

---

## Local Environment Setup

### 1. Start Core Services

```bash
# Start PostgreSQL, Redis, LocalStack
docker-compose up -d postgres redis localstack

# Verify services are running
docker-compose ps
```

### 2. Setup LocalStack Infrastructure

LocalStack simulates AWS services locally (S3, SQS, Lambda).

```bash
# Build Lambda function and provision infrastructure
make localstack-setup
```

**What this does:**
1. Builds Lambda package from `lambdas/job-processor/`
2. Creates S3 bucket: `local-milky-way-admin-panel-jobs`
3. Creates SQS queue + Dead Letter Queue
4. Deploys Lambda function
5. Sets up event source mapping (SQS → Lambda)

### 3. Verify Infrastructure

```bash
# Run automated tests
make localstack-test

# Expected output:
# ✅ S3 upload/list works
# ✅ SQS send message works  
# ✅ Lambda invocation works
# ✅ All tests passed!
```

### 4. Initialize Database

```bash
# Run Prisma migrations
cd apps/api
npx prisma migrate deploy

# Seed initial data (roles, policies)
make db-init
```

### 5. Start Application Services

```bash
# Start API and Web app
docker-compose up -d api web

# Or run locally for development
make api    # Terminal 1: API with hot reload
make web    # Terminal 2: Web with hot reload
```

---

## Testing Strategies

### Strategy 1: Mock Services (Fastest - No AWS)

**Best for:** Quick API testing, unit tests, rapid iteration

```bash
# Set environment variable
export USE_MOCK_AWS=true

# Start only database
docker-compose up -d postgres redis

# Run API locally
cd apps/api
npm run dev
```

**What happens:**
- Files stored in `tmp/mock-s3/` directory (not S3)
- SQS messages logged to console (not sent to queue)
- No Lambda execution
- Database updates work normally

**Use when:**
- Testing API endpoints
- Testing validation logic
- Running unit tests
- Database operations

### Strategy 2: LocalStack (Full Local AWS)

**Best for:** End-to-end testing, Lambda testing, integration testing

```bash
# Full setup (already done in Quick Start)
make localstack-up
make localstack-setup
docker-compose up -d
```

**What happens:**
- Files uploaded to local S3 (LocalStack)
- SQS messages sent to local queue
- Lambda function executes locally
- Database updates from Lambda
- Complete job processing flow

**Use when:**
- Testing complete job flow
- Testing Lambda functions
- Testing S3/SQS integration
- Pre-deployment validation

### Strategy 3: AWS QA Environment

**Best for:** Final validation before production

```bash
# Deploy to QA (requires AWS credentials)
cd infrastructure/environments/qa
terraform init
terraform apply
```

**Use when:**
- Final integration testing
- Performance testing
- Testing with real AWS services
- Before production deployment

---

## Common Testing Scenarios

### Scenario 1: Test Job Creation API

```bash
# Get auth token (login via web UI or API)
TOKEN="your-jwt-token"

# Create simple job
curl -X POST http://localhost:4000/api/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobType": "example",
    "payload": {"test": true},
    "maxAttempts": 3
  }'

# Expected response:
{
  "id": 1,
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "jobType": "example",
  "status": "PENDING",
  "createdAt": "2025-12-06T..."
}
```

### Scenario 2: Test Job with File Upload

```bash
# Create test CSV file
echo "name,email,handle
John Doe,john@example.com,johndoe
Jane Smith,jane@example.com,janesmith" > test.csv

# Upload with job creation
curl -X POST http://localhost:4000/api/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -F "jobType=example" \
  -F "payload={\"test\":true}" \
  -F "file=@test.csv"

# Expected: File uploaded to S3, job created
```

### Scenario 3: Verify File in S3

```bash
# List files in LocalStack S3
aws --endpoint-url=http://localhost:4566 \
  s3 ls s3://local-milky-way-admin-panel-jobs/jobs/ \
  --recursive \
  --region eu-south-2

# Download a file
aws --endpoint-url=http://localhost:4566 \
  s3 cp s3://local-milky-way-admin-panel-jobs/jobs/YOUR_FILE.csv \
  downloaded.csv \
  --region eu-south-2
```

### Scenario 4: Monitor Job Processing

```bash
# Watch job status change
JOB_ID=1

# Poll job status (watch for PENDING → RUNNING → COMPLETED)
while true; do
  curl -s http://localhost:4000/api/jobs/$JOB_ID \
    -H "Authorization: Bearer $TOKEN" | jq '.status'
  sleep 2
done

# Get execution logs
curl http://localhost:4000/api/jobs/$JOB_ID/logs \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Scenario 5: Test Lambda Function Locally

```bash
# Create test event file
cat > test-event.json <<EOF
{
  "Records": [{
    "messageId": "test-1",
    "body": "{\"taskId\":\"test-123\",\"jobType\":\"example\",\"payload\":{\"test\":true}}"
  }]
}
EOF

# Invoke Lambda directly via LocalStack
aws --endpoint-url=http://localhost:4566 \
  lambda invoke \
  --function-name local-milky-way-admin-panel-job-processor \
  --payload file://test-event.json \
  --region eu-south-2 \
  response.json

# Check response
cat response.json | jq
```

### Scenario 6: Check Database State

```bash
# Connect to PostgreSQL
docker exec -it admin_panel_postgres psql -U admin -d admin_panel

# View recent jobs
SELECT id, task_id, job_type, status, created_at, completed_at 
FROM jobs 
ORDER BY id DESC 
LIMIT 10;

# View job logs
SELECT j.task_id, l.level, l.message, l.created_at
FROM job_logs l
JOIN jobs j ON l.job_id = j.id
WHERE j.id = 1
ORDER BY l.created_at ASC;

# Exit
\q
```

### Scenario 7: Test Error Handling

```bash
# Send message with invalid job type
curl -X POST http://localhost:4000/api/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobType": "nonexistent_handler",
    "payload": {}
  }'

# Job will retry 3 times then fail
# Check Dead Letter Queue
aws --endpoint-url=http://localhost:4566 \
  sqs receive-message \
  --queue-url http://localhost:4566/000000000000/local-milky-way-admin-panel-jobs-dlq \
  --region eu-south-2
```

---

## Troubleshooting

### Issue: LocalStack won't start

```bash
# Check Docker is running
docker ps

# Check port 4566 is available
lsof -i :4566

# If port is in use, kill the process
kill -9 $(lsof -t -i:4566)

# Restart LocalStack
docker-compose restart localstack

# Check logs
make localstack-logs
```

### Issue: Database connection failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
docker exec -it admin_panel_postgres pg_isready -U admin

# Restart database
docker-compose restart postgres

# Verify environment variables
grep DATABASE_URL .env
```

### Issue: API can't reach LocalStack

**Problem:** API container can't connect to LocalStack

**Solution:** Use `localstack` hostname (not `localhost`) in docker-compose:

```yaml
# ✅ Correct (from API container)
AWS_ENDPOINT_URL: http://localstack:4566

# ❌ Wrong (only works from host)
AWS_ENDPOINT_URL: http://localhost:4566
```

### Issue: Lambda can't connect to database

**Problem:** Lambda in LocalStack can't reach PostgreSQL on host

**Solution:** Use `host.docker.internal`:

```typescript
// In Lambda function
const databaseUrl = process.env.DATABASE_URL?.replace(
  'localhost',
  'host.docker.internal'
);
```

**Docker Desktop Settings:**
1. Open Docker Desktop
2. Settings → Resources → Network
3. Enable "host.docker.internal"

### Issue: Terraform fails with "connection refused"

```bash
# Ensure LocalStack is fully started
curl http://localhost:4566/_localstack/health

# Wait 10 seconds for full initialization
sleep 10

# Retry setup
make localstack-setup
```

### Issue: Lambda not processing jobs

```bash
# Check event source mapping exists
aws --endpoint-url=http://localhost:4566 \
  lambda list-event-source-mappings \
  --region eu-south-2

# Should show mapping between SQS queue and Lambda
# If missing, redeploy infrastructure:
make localstack-destroy
make localstack-setup
```

### Issue: Jobs stuck in PENDING status

```bash
# 1. Check SQS messages
aws --endpoint-url=http://localhost:4566 \
  sqs get-queue-attributes \
  --queue-url http://localhost:4566/000000000000/local-milky-way-admin-panel-jobs \
  --attribute-names ApproximateNumberOfMessages \
  --region eu-south-2

# 2. Check Lambda logs
make localstack-logs | grep "job-processor"

# 3. Manually invoke Lambda
aws --endpoint-url=http://localhost:4566 \
  lambda invoke \
  --function-name local-milky-way-admin-panel-job-processor \
  --payload file://test-event.json \
  --region eu-south-2 \
  response.json
```

---

## Advanced Topics

### View All LocalStack Resources

```bash
# S3 buckets
aws --endpoint-url=http://localhost:4566 s3 ls --region eu-south-2

# SQS queues
aws --endpoint-url=http://localhost:4566 sqs list-queues --region eu-south-2

# Lambda functions
aws --endpoint-url=http://localhost:4566 lambda list-functions --region eu-south-2

# IAM roles
aws --endpoint-url=http://localhost:4566 iam list-roles --region eu-south-2
```

### Create Bash Alias for LocalStack AWS CLI

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
alias awslocal='aws --endpoint-url=http://localhost:4566 --region eu-south-2'

# Usage:
awslocal s3 ls
awslocal sqs list-queues
awslocal lambda list-functions
```

### Update Lambda Function Code

```bash
# 1. Make changes to Lambda code
cd lambdas/job-processor/src

# 2. Rebuild
cd ../
npm run build

# 3. Redeploy to LocalStack
aws --endpoint-url=http://localhost:4566 \
  lambda update-function-code \
  --function-name local-milky-way-admin-panel-job-processor \
  --zip-file fileb://lambda.zip \
  --region eu-south-2
```

### Clean Up Everything

```bash
# Stop all containers
docker-compose down

# Remove volumes (DATABASE WILL BE DELETED)
docker-compose down -v

# Remove LocalStack data
rm -rf tmp/localstack/

# Remove node_modules and rebuild
make clean
make install
```

### Run Integration Tests

```bash
# Run backend tests
cd apps/api
npm test

# Run E2E tests
cd apps/web
npm run test:e2e

# Test specific module
cd apps/api
npm test -- jobs
```

### Monitor LocalStack Health

```bash
# Check health status
curl http://localhost:4566/_localstack/health | jq

# Expected output:
{
  "services": {
    "s3": "running",
    "sqs": "running",
    "lambda": "running",
    "logs": "running",
    "iam": "running"
  }
}
```

---

## Development Workflow

### Daily Development Cycle

```bash
# Morning: Start services (if not running)
make localstack-up
docker-compose up -d

# Make code changes
# ... edit files ...

# Restart API to apply changes
docker-compose restart api

# Test changes
curl -X POST http://localhost:4000/api/jobs ...

# View logs
docker-compose logs -f api

# Evening: Stop services (optional - they can run overnight)
docker-compose stop
```

### Recommended Testing Sequence

1. **Start:** Mock services testing (fastest feedback)
2. **Validate:** LocalStack integration testing
3. **Deploy:** QA environment testing
4. **Ship:** Production deployment

### Performance Baselines

**Expected Metrics (LocalStack):**
- Job creation API: < 200ms
- S3 upload: < 100ms
- Lambda cold start: < 3s
- Lambda warm execution: < 500ms
- End-to-end (PENDING → COMPLETED): < 5s

**If slower:**
- Check Docker Desktop resource allocation
- Ensure LocalStack is healthy
- Check database connection pool

---

## Quick Reference

### Essential Commands

```bash
# LocalStack
make localstack-up           # Start LocalStack
make localstack-setup        # Create infrastructure
make localstack-test         # Verify setup
make localstack-logs         # View logs
make localstack-destroy      # Clean up

# Docker Compose
docker-compose up -d         # Start all services
docker-compose ps            # Check status
docker-compose logs -f api   # View API logs
docker-compose restart api   # Restart API
docker-compose down          # Stop all

# Database
make migrate                 # Run migrations
make db-init                 # Seed initial data
make db-studio               # Open Prisma Studio

# Development
make api                     # Run API locally
make web                     # Run Web locally
make dev                     # Run both via turbo
```

### Service Ports

| Service    | Port | URL                          |
|------------|------|------------------------------|
| API        | 4000 | http://localhost:4000        |
| Web        | 3000 | http://localhost:3000        |
| LocalStack | 4566 | http://localhost:4566        |
| PostgreSQL | 5432 | localhost:5432               |
| Redis      | 6379 | localhost:6379               |

### Environment Variables

**For Mock Services (no AWS):**
```env
USE_MOCK_AWS=true
DATABASE_URL=postgresql://admin:password@localhost:5432/admin_panel
NODE_ENV=development
```

**For LocalStack (simulated AWS):**
```env
AWS_ENDPOINT_URL=http://localstack:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=eu-south-2
S3_JOBS_BUCKET_NAME=local-milky-way-admin-panel-jobs
SQS_JOBS_QUEUE_URL=http://localstack:4566/000000000000/local-milky-way-admin-panel-jobs
DATABASE_URL=postgresql://admin:password@postgres:5432/admin_panel
```

---

## Success Criteria

### ✅ Local Environment is Ready When:

- [ ] `docker-compose ps` shows all services healthy
- [ ] `curl http://localhost:4566/_localstack/health` returns all services running
- [ ] `curl http://localhost:4000/api/health` returns 200 OK
- [ ] `make localstack-test` passes all checks
- [ ] Database migrations completed successfully
- [ ] Can create a job via API
- [ ] Job status changes from PENDING to COMPLETED
- [ ] Job logs are captured in database

### ✅ Ready for QA Deployment When:

- [ ] All local tests pass
- [ ] End-to-end flow works in LocalStack
- [ ] Lambda processes jobs correctly
- [ ] Error handling works (retry logic, DLQ)
- [ ] No TypeScript compilation errors
- [ ] All linting passes
- [ ] Unit tests pass

---

## Next Steps

After local testing is complete:

1. **Deploy to QA:**
   ```bash
   cd infrastructure/environments/qa
   terraform init
   terraform apply
   ```

2. **Run QA tests:**
   - Same test scenarios as local
   - Using real AWS services
   - Monitor CloudWatch logs

3. **Deploy to Production:**
   ```bash
   cd infrastructure/environments/prod
   terraform init
   terraform apply
   ```

---

## Additional Resources

- **Makefile:** Run `make help` for all available commands
- **Scripts:** Check `/scripts` folder for automation scripts
- **OpenSpec:** See `/openspec/changes/add-async-job-processing` for design docs
- **Terraform:** Infrastructure code in `/infrastructure`

---

**Happy Local Testing! 🚀**

*Need help? Check the troubleshooting section or run `make help` for available commands.*
