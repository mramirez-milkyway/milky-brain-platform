variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name for repository naming"
  type        = string
}

variable "repository_names" {
  description = "List of repository names to create"
  type        = list(string)
  default     = ["api", "web"]
}

variable "github_actions_role_arn" {
  description = "ARN of GitHub Actions IAM role for ECR access"
  type        = string
  default     = ""
}
