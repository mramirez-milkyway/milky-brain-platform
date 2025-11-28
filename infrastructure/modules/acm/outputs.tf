output "certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = var.create_certificate ? aws_acm_certificate.main[0].arn : ""
}

output "certificate_domain" {
  description = "Domain name of the certificate"
  value       = var.create_certificate ? aws_acm_certificate.main[0].domain_name : ""
}

output "certificate_status" {
  description = "Status of the certificate"
  value       = var.create_certificate ? aws_acm_certificate.main[0].status : ""
}
