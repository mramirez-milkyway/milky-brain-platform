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
  description = "Base domain name"
  type        = string
}

variable "subdomain" {
  description = "Subdomain for this environment (e.g., 'qa', 'send'). Leave empty for root domain"
  type        = string
  default     = ""
}

variable "enable_resend" {
  description = "Enable Resend DNS configuration"
  type        = bool
  default     = true
}

variable "dkim_value" {
  description = "DKIM verification value from Resend (e.g., p=MIGfMA0GCSqGSIb3DQEB...)"
  type        = string
}

variable "enable_sending" {
  description = "Enable email sending configuration (SPF records)"
  type        = bool
  default     = true
}

variable "enable_dmarc" {
  description = "Enable DMARC policy"
  type        = bool
  default     = true
}

variable "dmarc_policy" {
  description = "DMARC policy record"
  type        = string
  default     = "v=DMARC1; p=none;"
}

variable "enable_receiving" {
  description = "Enable email receiving configuration (MX record)"
  type        = bool
  default     = false
}
