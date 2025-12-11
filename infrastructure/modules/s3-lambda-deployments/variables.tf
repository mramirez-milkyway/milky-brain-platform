variable "environment" {
  description = "Environment name (e.g., qa, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "milky-way"
}

variable "retention_days" {
  description = "Number of days to retain deployment packages"
  type        = number
  default     = 30
}
