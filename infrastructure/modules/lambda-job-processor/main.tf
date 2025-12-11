# Lambda Module for Job Processing
# Creates Lambda function with IAM role, VPC access, and SQS event source mapping

# IAM Role for Lambda
resource "aws_iam_role" "lambda" {
  name = "${var.environment}-${var.project_name}-job-processor-role"

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

  tags = {
    Name        = "${var.environment}-${var.project_name}-job-processor-role"
    Environment = var.environment
  }
}

# IAM Policy for CloudWatch Logs
resource "aws_iam_role_policy" "lambda_logs" {
  name = "${var.environment}-lambda-logs"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:log-group:/aws/lambda/${var.environment}-${var.project_name}-job-processor:*"
      }
    ]
  })
}

# IAM Policy for VPC access (required for RDS connection)
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# IAM Policy for S3 access
resource "aws_iam_role_policy" "lambda_s3" {
  name = "${var.environment}-lambda-s3"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${var.s3_bucket_arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = var.s3_bucket_arn
      }
    ]
  })
}

# IAM Policy for SQS access
resource "aws_iam_role_policy" "lambda_sqs" {
  name = "${var.environment}-lambda-sqs"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:ChangeMessageVisibility"
        ]
        Resource = var.sqs_queue_arn
      }
    ]
  })
}

# IAM Policy for Secrets Manager access
resource "aws_iam_role_policy" "lambda_secrets" {
  name = "${var.environment}-lambda-secrets"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = "arn:aws:secretsmanager:${var.aws_region}:*:secret:${var.environment}/*"
      }
    ]
  })
}

# Security Group for Lambda
resource "aws_security_group" "lambda" {
  name        = "${var.environment}-${var.project_name}-lambda-sg"
  description = "Security group for Lambda job processor"
  vpc_id      = var.vpc_id

  # Allow all outbound traffic
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-${var.project_name}-lambda-sg"
    Environment = var.environment
  }
}

# Placeholder Lambda package for initial creation
# CI/CD will replace this with the real code via UpdateFunctionCode
data "archive_file" "placeholder" {
  type        = "zip"
  output_path = "${path.module}/placeholder.zip"

  source {
    content  = <<-EOF
      exports.handler = async (event) => {
        console.log('Placeholder Lambda - deploy real code via CI/CD');
        return { statusCode: 200, body: 'Placeholder - awaiting deployment' };
      };
    EOF
    filename = "index.js"
  }
}

# Lambda Function
# Terraform creates with placeholder code, CI/CD deploys real code
resource "aws_lambda_function" "job_processor" {
  function_name = "${var.environment}-${var.project_name}-job-processor"
  description   = "Processes async jobs from SQS queue"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = var.runtime
  timeout       = var.timeout
  memory_size   = var.memory_size

  # Use placeholder for initial creation - CI/CD handles real deployments
  filename         = data.archive_file.placeholder.output_path
  source_code_hash = data.archive_file.placeholder.output_base64sha256

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = merge(
      {
        NODE_ENV            = var.environment
        DATABASE_URL        = var.database_url
        S3_JOBS_BUCKET_NAME = var.s3_bucket_name
        SQS_JOBS_QUEUE_URL  = var.sqs_queue_url
        AWS_REGION_OVERRIDE = var.aws_region
        LOG_LEVEL           = var.log_level
      },
      var.additional_environment_variables
    )
  }

  reserved_concurrent_executions = var.reserved_concurrent_executions

  tags = {
    Name        = "${var.environment}-${var.project_name}-job-processor"
    Environment = var.environment
  }

  # Ignore code changes - CI/CD handles Lambda deployments via UpdateFunctionCode
  lifecycle {
    ignore_changes = [
      filename,
      source_code_hash,
      s3_bucket,
      s3_key,
      s3_object_version,
    ]
  }

  depends_on = [
    aws_iam_role_policy.lambda_logs,
    aws_iam_role_policy.lambda_s3,
    aws_iam_role_policy.lambda_sqs,
    aws_iam_role_policy.lambda_secrets,
    aws_iam_role_policy_attachment.lambda_vpc
  ]
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.environment}-${var.project_name}-job-processor"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "${var.environment}-${var.project_name}-job-processor-logs"
    Environment = var.environment
  }
}

# SQS Event Source Mapping
# Note: This will fail on first apply since SQS queue doesn't exist yet
# Run terraform apply twice: once to create Lambda, once to add event source mapping
resource "aws_lambda_event_source_mapping" "sqs" {
  count = var.create_event_source_mapping ? 1 : 0

  event_source_arn = var.sqs_queue_arn
  function_name    = aws_lambda_function.job_processor.arn
  batch_size       = var.sqs_batch_size
  enabled          = var.enable_sqs_trigger

  # Partial batch response - allows individual message failures
  function_response_types = ["ReportBatchItemFailures"]

  scaling_config {
    maximum_concurrency = var.maximum_concurrency
  }

  depends_on = [
    aws_iam_role_policy.lambda_sqs
  ]
}

# CloudWatch alarm for Lambda errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  count               = var.enable_error_alarm ? 1 : 0
  alarm_name          = "${var.environment}-${var.project_name}-job-processor-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = var.error_threshold
  alarm_description   = "Alert when Lambda function has errors"
  alarm_actions       = var.alarm_actions

  dimensions = {
    FunctionName = aws_lambda_function.job_processor.function_name
  }

  tags = {
    Name        = "${var.environment}-${var.project_name}-job-processor-errors-alarm"
    Environment = var.environment
  }
}

# CloudWatch alarm for Lambda duration
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  count               = var.enable_duration_alarm ? 1 : 0
  alarm_name          = "${var.environment}-${var.project_name}-job-processor-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Average"
  threshold           = var.duration_threshold
  alarm_description   = "Alert when Lambda function duration is high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    FunctionName = aws_lambda_function.job_processor.function_name
  }

  tags = {
    Name        = "${var.environment}-${var.project_name}-job-processor-duration-alarm"
    Environment = var.environment
  }
}

# CloudWatch alarm for Lambda throttles
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  count               = var.enable_throttle_alarm ? 1 : 0
  alarm_name          = "${var.environment}-${var.project_name}-job-processor-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Alert when Lambda function is throttled"
  alarm_actions       = var.alarm_actions

  dimensions = {
    FunctionName = aws_lambda_function.job_processor.function_name
  }

  tags = {
    Name        = "${var.environment}-${var.project_name}-job-processor-throttles-alarm"
    Environment = var.environment
  }
}
