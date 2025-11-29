# QA Environment Main Configuration
# This orchestrates all infrastructure modules for the QA environment

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# VPC Module
module "vpc" {
  source = "../../modules/vpc"

  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  az_count           = var.az_count
  enable_nat_gateway = var.enable_nat_gateway
}

# GitHub OIDC Module
module "github_oidc" {
  source = "../../modules/github-oidc"

  project_name = var.project_name
  environment  = var.environment
  github_org   = var.github_org
  github_repo  = var.github_repo
  secrets_arns = []
}

# Secrets Module
module "secrets" {
  source = "../../modules/secrets"

  environment             = var.environment
  recovery_window_in_days = 7
  create_kms_key          = false
}

# ECR Module
module "ecr" {
  source = "../../modules/ecr"

  environment             = var.environment
  project_name            = var.project_name
  repository_names        = ["api", "web", "web-admin"]
  github_actions_role_arn = module.github_oidc.github_actions_role_arn
}

# ALB Module - Created early to avoid circular dependency
module "alb" {
  source = "../../modules/alb"

  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  instance_ids      = [] # Will be updated after EC2 instances are created

  certificate_arn            = var.enable_https && var.domain_name != "" ? module.acm[0].certificate_arn : ""
  enable_deletion_protection = var.alb_deletion_protection
  access_logs_bucket         = var.alb_access_logs_bucket
}

# EC2 Module
module "ec2" {
  source = "../../modules/ec2"

  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids

  instance_type     = var.ec2_instance_type
  instance_count    = var.ec2_instance_count
  root_volume_size  = var.ec2_root_volume_size
  ssh_allowed_cidrs = var.ssh_allowed_cidrs

  create_key_pair   = var.create_key_pair
  ssh_public_key    = var.ssh_public_key
  existing_key_name = var.existing_key_name

  aws_region       = var.aws_region
  db_endpoint      = "" # Endpoints will be available via AWS Secrets Manager
  redis_endpoint   = "" # Endpoints will be available via AWS Secrets Manager
  ecr_registry_url = split("/", module.ecr.repository_urls["api"])[0]

  alb_security_group_ids = [module.alb.alb_security_group_id]
}

# RDS Module
module "rds" {
  source = "../../modules/rds"

  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  allowed_security_groups = [module.ec2.security_group_id]

  instance_class          = var.rds_instance_class
  allocated_storage       = var.rds_allocated_storage
  max_allocated_storage   = var.rds_max_allocated_storage
  database_name           = var.database_name
  master_username         = var.db_master_username
  master_password         = var.db_master_password
  multi_az                = var.rds_multi_az
  backup_retention_period = var.rds_backup_retention_period
  skip_final_snapshot     = var.rds_skip_final_snapshot
  deletion_protection     = var.rds_deletion_protection
}

# Redis Module
module "redis" {
  source = "../../modules/redis"

  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  allowed_security_groups = [module.ec2.security_group_id]

  node_type                  = var.redis_node_type
  num_cache_nodes            = var.redis_num_nodes
  automatic_failover_enabled = var.redis_automatic_failover
  multi_az_enabled           = var.redis_multi_az
}

# Update ALB target group with actual EC2 instances (API target group)
resource "aws_lb_target_group_attachment" "api" {
  count            = var.ec2_instance_count
  target_group_arn = module.alb.api_target_group_arn
  target_id        = module.ec2.instance_ids[count.index]
  port             = 4000 # API port
}

# Update ALB target group with actual EC2 instances (Web target group)
resource "aws_lb_target_group_attachment" "web" {
  count            = var.ec2_instance_count
  target_group_arn = module.alb.web_target_group_arn
  target_id        = module.ec2.instance_ids[count.index]
  port             = 3000 # Web port
}

# Create separate secrets for database and Redis endpoints
resource "aws_secretsmanager_secret" "database" {
  name                    = "${var.environment}/database-config"
  description             = "Database connection details for ${var.environment}"
  recovery_window_in_days = 7

  tags = merge(
    var.tags,
    {
      Name = "${var.environment}-database-config"
    }
  )
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    host     = module.rds.db_instance_address
    port     = module.rds.db_instance_port
    database = var.database_name
    username = var.db_master_username
    password = var.db_master_password
    endpoint = module.rds.db_instance_endpoint
  })
}

resource "aws_secretsmanager_secret" "redis" {
  name                    = "${var.environment}/redis-config"
  description             = "Redis connection details for ${var.environment}"
  recovery_window_in_days = 7

  tags = merge(
    var.tags,
    {
      Name = "${var.environment}-redis-config"
    }
  )
}

resource "aws_secretsmanager_secret_version" "redis" {
  secret_id = aws_secretsmanager_secret.redis.id
  secret_string = jsonencode({
    host     = module.redis.redis_endpoint
    port     = module.redis.redis_port
    endpoint = "${module.redis.redis_endpoint}:${module.redis.redis_port}"
  })
}

# ACM Module (optional)
module "acm" {
  count  = var.enable_https && var.domain_name != "" ? 1 : 0
  source = "../../modules/acm"

  environment        = var.environment
  create_certificate = true
  zone_id            = var.route53_zone_id
  domain_name        = var.domain_name
  subdomain          = var.subdomain
  include_www        = false
}

# Route53 Module (optional)
module "route53" {
  count  = var.domain_name != "" ? 1 : 0
  source = "../../modules/route53"

  environment       = var.environment
  zone_id           = var.route53_zone_id
  domain_name       = var.domain_name
  subdomain         = var.subdomain
  alb_dns_name      = module.alb.alb_dns_name
  alb_zone_id       = module.alb.alb_zone_id
  enable_ipv6       = false
  create_www_record = false

  depends_on = [module.alb]
}
