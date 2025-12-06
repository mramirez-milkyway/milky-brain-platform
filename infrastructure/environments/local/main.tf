# Local Development Environment (LocalStack)
# Simplified infrastructure for local testing

locals {
  environment  = "local"
  project_name = "milky-way-admin-panel"
}

# S3 Jobs Module
module "s3_jobs" {
  source = "../../modules/s3-jobs"

  environment  = local.environment
  project_name = local.project_name

  enable_versioning = false # Disable for local
  lifecycle_days    = 0     # Disable for local

  cors_allowed_origins = ["*"]
}

# SQS Jobs Module
module "sqs_jobs" {
  source = "../../modules/sqs-jobs"

  environment  = local.environment
  project_name = local.project_name

  visibility_timeout_seconds = 900
  max_receive_count          = 3

  enable_dlq_alarm         = false # No alarms in LocalStack
  enable_queue_depth_alarm = false
  enable_message_age_alarm = false
}

# Lambda Job Processor Module (simplified for local)
# Note: LocalStack Lambda has limitations, so we keep this minimal
resource "aws_iam_role" "lambda" {
  name = "${local.environment}-${local.project_name}-job-processor-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_lambda_function" "job_processor" {
  function_name = "${local.environment}-${local.project_name}-job-processor"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 900
  memory_size   = 512

  # Use pre-built lambda.zip
  filename         = "../../../lambdas/job-processor/lambda.zip"
  source_code_hash = fileexists("../../../lambdas/job-processor/lambda.zip") ? filebase64sha256("../../../lambdas/job-processor/lambda.zip") : null

  environment {
    variables = {
      NODE_ENV            = "local"
      DATABASE_URL        = "postgresql://admin:admin123@host.docker.internal:5432/admin_panel"
      S3_JOBS_BUCKET_NAME = module.s3_jobs.bucket_name
      SQS_JOBS_QUEUE_URL  = module.sqs_jobs.queue_url
      AWS_REGION_OVERRIDE = "eu-south-2"
      LOG_LEVEL           = "debug"
    }
  }
}

# SQS Event Source Mapping
resource "aws_lambda_event_source_mapping" "sqs" {
  event_source_arn = module.sqs_jobs.queue_arn
  function_name    = aws_lambda_function.job_processor.arn
  batch_size       = 10
  enabled          = true

  function_response_types = ["ReportBatchItemFailures"]
}
