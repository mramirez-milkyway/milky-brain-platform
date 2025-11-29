# QA Environment Variables

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-south-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "qa"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "milky-way-admin-panel"
}

# VPC Variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "az_count" {
  description = "Number of availability zones"
  type        = number
  default     = 2
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway (set to false for cost savings in QA)"
  type        = bool
  default     = false
}

# RDS Variables
variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_allocated_storage" {
  description = "Initial allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_max_allocated_storage" {
  description = "Maximum allocated storage for autoscaling in GB"
  type        = number
  default     = 50
}

variable "database_name" {
  description = "Database name"
  type        = string
  default     = "admin_panel"
}

variable "db_master_username" {
  description = "Master username for database"
  type        = string
  default     = "admin"
}

variable "db_master_password" {
  description = "Master password for database"
  type        = string
  sensitive   = true
}

variable "rds_multi_az" {
  description = "Enable Multi-AZ for RDS"
  type        = bool
  default     = false
}

variable "rds_backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 3
}

variable "rds_skip_final_snapshot" {
  description = "Skip final snapshot on deletion"
  type        = bool
  default     = true
}

variable "rds_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

# Redis Variables
variable "redis_node_type" {
  description = "Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_nodes" {
  description = "Number of Redis nodes"
  type        = number
  default     = 1
}

variable "redis_automatic_failover" {
  description = "Enable automatic failover"
  type        = bool
  default     = false
}

variable "redis_multi_az" {
  description = "Enable Multi-AZ for Redis"
  type        = bool
  default     = false
}

# EC2 Variables
variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "ec2_instance_count" {
  description = "Number of EC2 instances"
  type        = number
  default     = 1
}

variable "ec2_root_volume_size" {
  description = "Root volume size in GB"
  type        = number
  default     = 30
}

variable "ssh_allowed_cidrs" {
  description = "CIDR blocks allowed for SSH"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "create_key_pair" {
  description = "Create new SSH key pair"
  type        = bool
  default     = false
}

variable "ssh_public_key" {
  description = "SSH public key content"
  type        = string
  default     = ""
}

variable "existing_key_name" {
  description = "Existing SSH key pair name"
  type        = string
  default     = ""
}

# ALB Variables
variable "alb_deletion_protection" {
  description = "Enable ALB deletion protection"
  type        = bool
  default     = false
}

variable "alb_access_logs_bucket" {
  description = "S3 bucket for ALB access logs"
  type        = string
  default     = ""
}

# DNS and SSL Variables
variable "enable_https" {
  description = "Enable HTTPS with ACM certificate"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Domain name for Route53 and ACM"
  type        = string
  default     = ""
}

variable "subdomain" {
  description = "Subdomain for QA environment"
  type        = string
  default     = "qa"
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID"
  type        = string
  default     = ""
}

# GitHub Actions
variable "github_org" {
  description = "GitHub organization or username"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

# Tags
variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
