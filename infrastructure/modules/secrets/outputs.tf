output "secret_arn" {
  description = "ARN of the secrets manager secret"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

output "secret_name" {
  description = "Name of the secrets manager secret"
  value       = aws_secretsmanager_secret.app_secrets.name
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = var.create_kms_key ? aws_kms_key.secrets[0].id : ""
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = var.create_kms_key ? aws_kms_key.secrets[0].arn : ""
}
