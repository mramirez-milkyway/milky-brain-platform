# Resend DNS Configuration Module
# This module creates DNS records required for Resend email sending

data "aws_route53_zone" "main" {
  count        = var.zone_id != "" ? 1 : 0
  zone_id      = var.zone_id
  private_zone = false
}

data "aws_route53_zone" "main_by_name" {
  count        = var.zone_id == "" && var.domain_name != "" ? 1 : 0
  name         = var.domain_name
  private_zone = false
}

locals {
  zone_id = var.zone_id != "" ? var.zone_id : (var.domain_name != "" ? data.aws_route53_zone.main_by_name[0].zone_id : "")

  # Determine the sending domain based on environment
  sending_domain = var.subdomain != "" ? "${var.subdomain}.${var.domain_name}" : var.domain_name
}

# ============================================
# Domain Verification (DKIM)
# ============================================

resource "aws_route53_record" "dkim_verification" {
  count   = local.zone_id != "" && var.enable_resend ? 1 : 0
  zone_id = local.zone_id
  name    = "resend._domainkey.${local.sending_domain}"
  type    = "TXT"
  ttl     = 300
  records = [var.dkim_value]
}

# ============================================
# SPF Record (Enable Sending)
# ============================================

resource "aws_route53_record" "spf_mx" {
  count   = local.zone_id != "" && var.enable_sending ? 1 : 0
  zone_id = local.zone_id
  name    = "send.${local.sending_domain}"
  type    = "MX"
  ttl     = 300
  records = ["10 feedback-smtp.us-east-1.amazonses.com"]
}

resource "aws_route53_record" "spf_txt" {
  count   = local.zone_id != "" && var.enable_sending ? 1 : 0
  zone_id = local.zone_id
  name    = "send.${local.sending_domain}"
  type    = "TXT"
  ttl     = 300
  records = ["v=spf1 include:amazonses.com ~all"]
}

# ============================================
# DMARC Record (Optional)
# ============================================

resource "aws_route53_record" "dmarc" {
  count   = local.zone_id != "" && var.enable_dmarc ? 1 : 0
  zone_id = local.zone_id
  name    = "_dmarc.${local.sending_domain}"
  type    = "TXT"
  ttl     = 300
  records = [var.dmarc_policy]
}

# ============================================
# MX Record for Receiving (Optional)
# ============================================

resource "aws_route53_record" "mx_receiving" {
  count   = local.zone_id != "" && var.enable_receiving ? 1 : 0
  zone_id = local.zone_id
  name    = local.sending_domain
  type    = "MX"
  ttl     = 300
  records = ["10 inbound-smtp.us-east-1.amazonaws.com"]
}
