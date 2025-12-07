# Job Processing Infrastructure Deployment Guide

This guide explains how to deploy the job processing infrastructure using Terraform.

## Overview

The job processing system consists of three main components:
1. **S3 Bucket** - Stores uploaded files (CSV, etc.)
2. **SQS Queue** - Message queue for job processing
3. **Lambda Function** - Processes jobs asynchronously

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform installed (v1.0+)
3. Lambda deployment package built (`lambda.zip`)
4. Access to the RDS database endpoint
5. VPC with private subnets configured

## Deployment Steps

### Step 1: Build the Lambda Package

Before deploying infrastructure, build the Lambda deployment package:

```bash
cd lambdas/job-processor
npm install
npm run build
```

This creates `lambda.zip` in the `lambdas/job-processor` directory.

### Step 2: Initial Terraform Apply

Navigate to the QA environment directory:

```bash
cd infrastructure/environments/qa
```

Initialize Terraform (first time only):

```bash
terraform init
```

Review the planned changes:

```bash
terraform plan
```

Apply the infrastructure (first pass):

```bash
terraform apply
```

**Note:** On the first apply, the Lambda event source mapping is disabled to avoid circular dependencies. The infrastructure will be created in this order:
1. VPC, subnets, security groups
2. RDS database
3. Redis cluster
4. EC2 instances
5. S3 jobs bucket
6. SQS jobs queue
7. Lambda function (without event source mapping)

### Step 3: Enable Event Source Mapping (Optional - Second Apply)

Once all resources are created, you can enable the SQS event source mapping to have Lambda automatically process jobs from the queue.

Edit `main.tf` and update the Lambda module configuration:

```hcl
module "lambda_job_processor" {
  # ... other config ...
  
  create_event_source_mapping = true  # Change from false to true
}
```

Apply again:

```bash
terraform apply
```

This will create the event source mapping connecting SQS to Lambda.

## Configuration

### Environment Variables

The Lambda function receives these environment variables automatically:

- `NODE_ENV` - Environment name (qa, prod)
- `DATABASE_URL` - PostgreSQL connection string
- `S3_JOBS_BUCKET_NAME` - S3 bucket name for job files
- `SQS_JOBS_QUEUE_URL` - SQS queue URL
- `AWS_REGION_OVERRIDE` - AWS region
- `LOG_LEVEL` - Logging level (debug for qa, info for prod)

### Backend API Configuration

Update your backend's `.env` file with the output values:

```bash
# After terraform apply, get the outputs
terraform output s3_jobs_bucket_name
terraform output sqs_jobs_queue_url
```

Add to `apps/api/.env`:

```env
S3_JOBS_BUCKET_NAME=<bucket_name_from_output>
SQS_JOBS_QUEUE_URL=<queue_url_from_output>
AWS_REGION=eu-south-2
```

## Outputs

After successful deployment, Terraform provides these outputs:

```bash
# S3 Bucket
s3_jobs_bucket_name = "qa-milky-way-admin-panel-jobs"

# SQS Queue
sqs_jobs_queue_url = "https://sqs.eu-south-2.amazonaws.com/.../qa-milky-way-admin-panel-jobs"
sqs_jobs_dlq_url = "https://sqs.eu-south-2.amazonaws.com/.../qa-milky-way-admin-panel-jobs-dlq"

# Lambda Function
lambda_job_processor_name = "qa-milky-way-admin-panel-job-processor"
lambda_job_processor_arn = "arn:aws:lambda:eu-south-2:..."

# Secrets Manager
job_processing_config_secret_name = "qa/job-processing-config"
```

## IAM Permissions

The infrastructure automatically configures these IAM policies:

### EC2 Instance Role

- **S3 Access**: Upload files to jobs bucket
- **SQS Access**: Send messages to jobs queue
- **Secrets Manager**: Read configuration secrets

### Lambda Execution Role

- **S3 Access**: Read/download files from jobs bucket
- **SQS Access**: Receive and delete messages from jobs queue
- **VPC Access**: Connect to RDS database in private subnets
- **CloudWatch Logs**: Write execution logs
- **Secrets Manager**: Read database credentials

## Monitoring

### CloudWatch Alarms

The infrastructure creates these CloudWatch alarms:

1. **DLQ Messages Alarm**: Triggers when messages appear in the Dead Letter Queue
2. **Queue Depth Alarm**: Triggers when queue has >1000 messages
3. **Message Age Alarm**: Triggers when oldest message is >1 hour old
4. **Lambda Errors Alarm**: Triggers on Lambda execution errors
5. **Lambda Duration Alarm**: Triggers when execution time is high
6. **Lambda Throttles Alarm**: Triggers when Lambda is throttled

### CloudWatch Logs

- Lambda logs: `/aws/lambda/qa-milky-way-admin-panel-job-processor`
- Retention: 30 days

View logs:

```bash
make lambda-logs ENV=qa
```

Or using AWS CLI:

```bash
aws logs tail /aws/lambda/qa-milky-way-admin-panel-job-processor --follow --region eu-south-2
```

## Updating Lambda Code

After making changes to the Lambda function:

1. Build the new package:
   ```bash
   make lambda-build
   ```

2. Deploy to AWS:
   ```bash
   make lambda-deploy ENV=qa
   ```

Alternatively, use Terraform to update:

```bash
cd infrastructure/environments/qa
terraform apply -target=module.lambda_job_processor.aws_lambda_function.job_processor
```

## Troubleshooting

### Lambda Can't Connect to Database

**Issue**: Lambda times out when trying to connect to RDS.

**Solution**: Verify the Lambda security group has access to RDS:

```bash
# Check security group rule exists
terraform state show aws_security_group_rule.rds_from_lambda
```

### SQS Messages Not Being Processed

**Issue**: Messages stay in the queue but Lambda is not invoked.

**Solution**: Check if event source mapping is enabled:

```bash
aws lambda list-event-source-mappings \
  --function-name qa-milky-way-admin-panel-job-processor \
  --region eu-south-2
```

If not created, run Step 3 (Enable Event Source Mapping).

### Lambda Out of Memory

**Issue**: Lambda functions fail with "Process exited before completing request".

**Solution**: Increase memory allocation in `main.tf`:

```hcl
module "lambda_job_processor" {
  # ... other config ...
  memory_size = 1024  # Increase from 512 to 1024 MB
}
```

Then apply:

```bash
terraform apply -target=module.lambda_job_processor
```

### S3 Upload Fails with Access Denied

**Issue**: Backend API can't upload files to S3.

**Solution**: Verify EC2 IAM role has S3 permissions:

```bash
terraform state show aws_iam_role_policy.ec2_s3_jobs_access
```

## Cleanup

To destroy all job processing infrastructure:

```bash
cd infrastructure/environments/qa
terraform destroy -target=module.lambda_job_processor -target=module.sqs_jobs -target=module.s3_jobs
```

**Warning**: This will delete the S3 bucket and all uploaded files. Make sure to backup any important data first.

## Architecture Diagram

```
┌─────────────────┐
│   Backend API   │
│   (NestJS)      │
└────────┬────────┘
         │
         │ 1. Upload file & create job record
         ↓
┌─────────────────┐
│   S3 Bucket     │
│   (Job Files)   │
└─────────────────┘
         │
         │ 2. Send SQS message
         ↓
┌─────────────────┐      ┌──────────────┐
│   SQS Queue     │─────→│  Dead Letter │
│   (Jobs)        │      │  Queue (DLQ) │
└────────┬────────┘      └──────────────┘
         │
         │ 3. Trigger Lambda
         ↓
┌─────────────────┐
│ Lambda Function │
│ (Job Processor) │
└────────┬────────┘
         │
         │ 4. Download file from S3
         │ 5. Update job status in DB
         │ 6. Create logs in DB
         ↓
┌─────────────────┐
│   PostgreSQL    │
│   (Jobs + Logs) │
└─────────────────┘
```

## Cost Estimation (QA Environment)

Approximate monthly costs for the job processing infrastructure:

- **S3 Storage**: ~$0.023/GB/month
  - 10GB storage: ~$0.23/month
- **SQS**: First 1M requests free, then $0.40/million
  - 10,000 jobs: ~$0.00/month (within free tier)
- **Lambda**: First 1M requests free, then $0.20/million
  - Compute: $0.0000166667/GB-second
  - 10,000 jobs × 30s × 512MB: ~$0.25/month
- **CloudWatch Logs**: $0.50/GB ingested
  - ~1GB logs: ~$0.50/month

**Total**: ~$1-2/month for QA environment with moderate usage

## Security Best Practices

1. **VPC Isolation**: Lambda runs in private subnets
2. **Encryption**: S3 bucket uses AES-256 encryption at rest
3. **Least Privilege**: IAM roles have minimal required permissions
4. **Secrets Management**: Database credentials stored in Secrets Manager
5. **Network Security**: Security groups restrict access to required ports only
6. **Audit Logging**: All API calls logged via CloudTrail (not shown here)

## Next Steps

After deploying the infrastructure:

1. Run database migration: `npx prisma migrate deploy`
2. Test job creation via API: `POST /api/jobs`
3. Verify Lambda execution in CloudWatch logs
4. Create specific job handlers (e.g., Influencer Import)
5. Set up CloudWatch alarm notifications (SNS topics)

## Support

For issues or questions:
- Check CloudWatch logs for error messages
- Review Terraform state: `terraform show`
- Validate configuration: `terraform validate`
- Check AWS Console for resource status
