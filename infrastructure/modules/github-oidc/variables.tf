variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment (qa, prod)"
  type        = string
}

variable "github_org" {
  description = "GitHub organization or username"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

variable "secrets_arns" {
  description = "List of Secrets Manager ARNs that GitHub Actions can access"
  type        = list(string)
  default     = []
}
