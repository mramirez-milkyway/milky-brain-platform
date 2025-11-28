output "record_name" {
  description = "DNS record name"
  value       = try(aws_route53_record.main[0].name, "")
}

output "record_fqdn" {
  description = "Fully qualified domain name"
  value       = try(aws_route53_record.main[0].fqdn, "")
}

output "zone_id" {
  description = "Route53 zone ID used"
  value       = try(data.aws_route53_zone.main[0].zone_id, try(data.aws_route53_zone.main_by_name[0].zone_id, ""))
}
