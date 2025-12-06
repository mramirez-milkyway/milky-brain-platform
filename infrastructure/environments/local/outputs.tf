# Local Environment Outputs

output "s3_jobs_bucket_name" {
  description = "S3 bucket name for job files"
  value       = module.s3_jobs.bucket_name
}

output "sqs_jobs_queue_url" {
  description = "SQS queue URL for jobs"
  value       = module.sqs_jobs.queue_url
}

output "sqs_jobs_queue_arn" {
  description = "SQS queue ARN"
  value       = module.sqs_jobs.queue_arn
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.job_processor.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.job_processor.arn
}

# Formatted info for easy copying to .env
output "env_config" {
  description = "Environment variables for local .env file"
  value       = <<-EOT

    # LocalStack Configuration (add to apps/api/.env)
    AWS_ENDPOINT_URL=http://localhost:4566
    AWS_ACCESS_KEY_ID=test
    AWS_SECRET_ACCESS_KEY=test
    AWS_REGION=eu-south-2
    S3_JOBS_BUCKET_NAME=${module.s3_jobs.bucket_name}
    SQS_JOBS_QUEUE_URL=${module.sqs_jobs.queue_url}
  EOT
}
