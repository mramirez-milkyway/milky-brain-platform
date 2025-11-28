variable "environment" {
  description = "Environment name"
  type        = string
}

variable "secret_string" {
  description = "JSON string containing secrets (optional, can be set manually)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "recovery_window_in_days" {
  description = "Number of days to retain secret after deletion"
  type        = number
  default     = 7
}

variable "create_kms_key" {
  description = "Create a KMS key for encryption"
  type        = bool
  default     = false
}
