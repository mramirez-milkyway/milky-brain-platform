variable "environment" {
  description = "Environment name"
  type        = string
}

variable "zone_id" {
  description = "Route53 hosted zone ID"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name (used if zone_id is not provided)"
  type        = string
  default     = ""
}

variable "subdomain" {
  description = "Subdomain for this environment (e.g., 'qa', 'prod'). Leave empty for root domain"
  type        = string
  default     = ""
}

variable "alb_dns_name" {
  description = "DNS name of the ALB"
  type        = string
}

variable "alb_zone_id" {
  description = "Zone ID of the ALB"
  type        = string
}

variable "enable_ipv6" {
  description = "Enable IPv6 AAAA record"
  type        = bool
  default     = false
}

variable "create_www_record" {
  description = "Create www CNAME record"
  type        = bool
  default     = false
}
