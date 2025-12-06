output "sending_domain" {
  description = "The configured sending domain"
  value       = local.sending_domain
}

output "dkim_record_name" {
  description = "DKIM record name"
  value       = var.enable_resend ? "resend._domainkey.${local.sending_domain}" : ""
}

output "spf_record_name" {
  description = "SPF record name"
  value       = var.enable_sending ? "send.${local.sending_domain}" : ""
}

output "dmarc_record_name" {
  description = "DMARC record name"
  value       = var.enable_dmarc ? "_dmarc.${local.sending_domain}" : ""
}
