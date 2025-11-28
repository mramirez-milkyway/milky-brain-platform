variable "environment" {
  description = "Environment name"
  type        = string
}

variable "create_certificate" {
  description = "Create ACM certificate"
  type        = bool
  default     = true
}

variable "zone_id" {
  description = "Route53 hosted zone ID"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name"
  type        = string
}

variable "subdomain" {
  description = "Subdomain for this environment (e.g., 'qa', 'prod'). Leave empty for root domain"
  type        = string
  default     = ""
}

variable "include_www" {
  description = "Include www subdomain in certificate"
  type        = bool
  default     = false
}
