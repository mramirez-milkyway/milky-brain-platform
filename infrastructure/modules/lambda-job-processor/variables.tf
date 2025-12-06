variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for Lambda"
  type        = list(string)
}

variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket for job files"
  type        = string
}

variable "s3_bucket_name" {
  description = "Name of the S3 bucket for job files"
  type        = string
}

variable "sqs_queue_arn" {
  description = "ARN of the SQS queue"
  type        = string
}

variable "sqs_queue_url" {
  description = "URL of the SQS queue"
  type        = string
}

variable "database_url" {
  description = "PostgreSQL connection string"
  type        = string
  sensitive   = true
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "nodejs20.x"
}

variable "timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 900 # 15 minutes
}

variable "memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 512
}

variable "lambda_zip_path" {
  description = "Path to Lambda deployment package"
  type        = string
  default     = "../../lambdas/job-processor/lambda.zip"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "log_level" {
  description = "Log level for Lambda function"
  type        = string
  default     = "info"
}

variable "sqs_batch_size" {
  description = "Number of messages to process in a single Lambda invocation"
  type        = number
  default     = 10
}

variable "create_event_source_mapping" {
  description = "Create SQS event source mapping (set to false on first apply)"
  type        = bool
  default     = false
}

variable "enable_sqs_trigger" {
  description = "Enable SQS trigger for Lambda"
  type        = bool
  default     = true
}

variable "maximum_concurrency" {
  description = "Maximum concurrent Lambda invocations from SQS"
  type        = number
  default     = 10
}

variable "reserved_concurrent_executions" {
  description = "Reserved concurrent executions for Lambda (-1 for unreserved)"
  type        = number
  default     = -1
}

variable "additional_environment_variables" {
  description = "Additional environment variables for Lambda"
  type        = map(string)
  default     = {}
}

variable "enable_error_alarm" {
  description = "Enable CloudWatch alarm for Lambda errors"
  type        = bool
  default     = true
}

variable "enable_duration_alarm" {
  description = "Enable CloudWatch alarm for Lambda duration"
  type        = bool
  default     = true
}

variable "enable_throttle_alarm" {
  description = "Enable CloudWatch alarm for Lambda throttles"
  type        = bool
  default     = true
}

variable "error_threshold" {
  description = "Threshold for error alarm"
  type        = number
  default     = 5
}

variable "duration_threshold" {
  description = "Threshold for duration alarm (in milliseconds)"
  type        = number
  default     = 600000 # 10 minutes
}

variable "alarm_actions" {
  description = "List of ARNs to notify when alarm triggers"
  type        = list(string)
  default     = []
}
