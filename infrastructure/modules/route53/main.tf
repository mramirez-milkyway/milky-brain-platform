# Route53 Module
# Creates DNS records for environment-specific subdomains

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

  # Determine the record name based on environment
  record_name = var.subdomain != "" ? "${var.subdomain}.${var.domain_name}" : var.domain_name
}

# A Record pointing to ALB
resource "aws_route53_record" "main" {
  count   = local.zone_id != "" ? 1 : 0
  zone_id = local.zone_id
  name    = local.record_name
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

# AAAA Record (IPv6) pointing to ALB
resource "aws_route53_record" "main_ipv6" {
  count   = local.zone_id != "" && var.enable_ipv6 ? 1 : 0
  zone_id = local.zone_id
  name    = local.record_name
  type    = "AAAA"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

# WWW CNAME record (optional)
resource "aws_route53_record" "www" {
  count   = local.zone_id != "" && var.create_www_record ? 1 : 0
  zone_id = local.zone_id
  name    = "www.${local.record_name}"
  type    = "CNAME"
  ttl     = 300
  records = [local.record_name]
}
