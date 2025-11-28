# ACM Certificate Module
# Creates ACM certificate for HTTPS with DNS validation

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

  # Certificate domain name
  cert_domain = var.subdomain != "" ? "${var.subdomain}.${var.domain_name}" : var.domain_name

  # Subject Alternative Names
  subject_alternative_names = var.include_www ? ["www.${local.cert_domain}"] : []
}

# ACM Certificate
resource "aws_acm_certificate" "main" {
  count             = var.create_certificate ? 1 : 0
  domain_name       = local.cert_domain
  validation_method = "DNS"

  subject_alternative_names = local.subject_alternative_names

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.environment}-certificate"
    Environment = var.environment
  }
}

# DNS Validation Records
resource "aws_route53_record" "cert_validation" {
  for_each = var.create_certificate && local.zone_id != "" ? {
    for dvo in aws_acm_certificate.main[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  } : {}

  allow_overwrite = true
  zone_id         = local.zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
}

# Certificate Validation
resource "aws_acm_certificate_validation" "main" {
  count                   = var.create_certificate && local.zone_id != "" ? 1 : 0
  certificate_arn         = aws_acm_certificate.main[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}
