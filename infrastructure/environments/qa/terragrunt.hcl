# QA Environment Configuration

include "root" {
  path = find_in_parent_folders()
}

locals {
  environment = "qa"
  aws_region  = get_env("AWS_REGION", "eu-south-2")

  # Common tags
  common_tags = {
    Environment = local.environment
    ManagedBy   = "terraform"
    Project     = "milky-way-admin-panel"
  }
}

inputs = {
  environment = local.environment
  aws_region  = local.aws_region
}
