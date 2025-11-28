# Root Terragrunt configuration
# This file contains shared configuration for all environments

locals {
  # Load common variables
  project_name = "milky-way-admin-panel"
}

# Configure Terragrunt to automatically store tfstate files in an S3 bucket
remote_state {
  backend = "s3"

  config = {
    encrypt        = true
    bucket         = "${get_env("TF_STATE_BUCKET", "milky-way-terraform-state")}"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = "${get_env("AWS_REGION", "eu-south-2")}"
    dynamodb_table = "${get_env("TF_STATE_LOCK_TABLE", "milky-way-terraform-locks")}"

    # S3 bucket versioning
    s3_bucket_tags = {
      Project    = local.project_name
      ManagedBy  = "terraform"
      Purpose    = "terraform-state"
    }

    # DynamoDB table tags
    dynamodb_table_tags = {
      Project    = local.project_name
      ManagedBy  = "terraform"
      Purpose    = "terraform-lock"
    }
  }

  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
}

# Generate an AWS provider block
generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project    = var.project_name
      ManagedBy  = "terraform"
      Environment = var.environment
    }
  }
}
EOF
}

# Generate common variables
generate "common_vars" {
  path      = "common_vars.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
}

variable "environment" {
  description = "Environment name (qa, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "${local.project_name}"
}
EOF
}
