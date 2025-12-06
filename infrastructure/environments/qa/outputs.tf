# QA Environment Outputs

# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

# RDS Outputs
output "db_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.db_instance_endpoint
}

output "db_address" {
  description = "RDS address"
  value       = module.rds.db_instance_address
}

output "database_url" {
  description = "Database connection URL"
  value       = "postgresql://${var.db_master_username}:${var.db_master_password}@${module.rds.db_instance_address}:${module.rds.db_instance_port}/${var.database_name}"
  sensitive   = true
}

# Redis Outputs
output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.redis.redis_endpoint
}

output "redis_url" {
  description = "Redis connection URL"
  value       = "redis://${module.redis.redis_endpoint}:${module.redis.redis_port}"
}

# ECR Outputs
output "ecr_repository_urls" {
  description = "ECR repository URLs"
  value       = module.ecr.repository_urls
}

# EC2 Outputs
output "ec2_instance_ids" {
  description = "EC2 instance IDs"
  value       = module.ec2.instance_ids
}

output "ec2_public_ips" {
  description = "EC2 public IPs"
  value       = module.ec2.instance_public_ips
}

output "ec2_private_ips" {
  description = "EC2 private IPs"
  value       = module.ec2.instance_private_ips
}

# ALB Outputs
output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "alb_url" {
  description = "ALB URL"
  value       = var.enable_https ? "https://${module.alb.alb_dns_name}" : "http://${module.alb.alb_dns_name}"
}

# Route53 Outputs
output "domain_name" {
  description = "Domain name"
  value       = var.domain_name != "" ? module.route53[0].record_fqdn : "Not configured"
}

output "application_url" {
  description = "Application URL"
  value       = var.domain_name != "" ? (var.enable_https ? "https://${module.route53[0].record_fqdn}" : "http://${module.route53[0].record_fqdn}") : module.alb.alb_dns_name
}

# Secrets Outputs
output "secrets_manager_secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = module.secrets.secret_arn
}

output "secrets_manager_secret_name" {
  description = "Secrets Manager secret name"
  value       = module.secrets.secret_name
}

# GitHub OIDC Outputs
output "github_actions_role_arn" {
  description = "GitHub Actions IAM role ARN (use as AWS_ROLE_ARN secret)"
  value       = module.github_oidc.github_actions_role_arn
}

output "github_oidc_provider_arn" {
  description = "GitHub OIDC provider ARN"
  value       = module.github_oidc.oidc_provider_arn
}

# Job Processing Outputs
output "s3_jobs_bucket_name" {
  description = "S3 bucket name for job files"
  value       = module.s3_jobs.bucket_name
}

output "sqs_jobs_queue_url" {
  description = "SQS queue URL for jobs"
  value       = module.sqs_jobs.queue_url
}

output "sqs_jobs_dlq_url" {
  description = "SQS Dead Letter Queue URL"
  value       = module.sqs_jobs.dlq_url
}

output "lambda_job_processor_name" {
  description = "Lambda function name for job processor"
  value       = module.lambda_job_processor.lambda_function_name
}

output "lambda_job_processor_arn" {
  description = "Lambda function ARN for job processor"
  value       = module.lambda_job_processor.lambda_function_arn
}

output "job_processing_config_secret_name" {
  description = "Secrets Manager secret name for job processing config"
  value       = aws_secretsmanager_secret.job_processing.name
}

# Resend DNS Outputs
output "resend_sending_domain" {
  description = "Resend sending domain"
  value       = var.domain_name != "" && var.enable_resend_dns ? module.resend_dns[0].sending_domain : "Not configured"
}

output "resend_dkim_record" {
  description = "Resend DKIM record name"
  value       = var.domain_name != "" && var.enable_resend_dns ? module.resend_dns[0].dkim_record_name : "Not configured"
}

output "resend_spf_record" {
  description = "Resend SPF record name"
  value       = var.domain_name != "" && var.enable_resend_dns ? module.resend_dns[0].spf_record_name : "Not configured"
}

output "resend_dmarc_record" {
  description = "Resend DMARC record name"
  value       = var.domain_name != "" && var.enable_resend_dns ? module.resend_dns[0].dmarc_record_name : "Not configured"
}

# Deployment Information
output "deployment_info" {
  description = "Important deployment information"
  value = {
    environment          = var.environment
    region               = var.aws_region
    alb_dns              = module.alb.alb_dns_name
    ec2_public_ips       = module.ec2.instance_public_ips
    db_endpoint          = module.rds.db_instance_address
    redis_endpoint       = module.redis.redis_endpoint
    ecr_api_repo         = module.ecr.repository_urls["api"]
    ecr_web_repo         = module.ecr.repository_urls["web-admin"]
    secrets_name         = module.secrets.secret_name
    s3_jobs_bucket       = module.s3_jobs.bucket_name
    sqs_jobs_queue_url   = module.sqs_jobs.queue_url
    lambda_job_processor = module.lambda_job_processor.lambda_function_name
  }
}
