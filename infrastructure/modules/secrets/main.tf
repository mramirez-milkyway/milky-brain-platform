# Secrets Manager Module
# Creates AWS Secrets Manager secret for application configuration

resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${var.environment}/app-secrets"
  description             = "Application secrets for ${var.environment} environment"
  recovery_window_in_days = var.recovery_window_in_days

  tags = {
    Name        = "${var.environment}-app-secrets"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  count         = var.secret_string != "" ? 1 : 0
  secret_id     = aws_secretsmanager_secret.app_secrets.id
  secret_string = var.secret_string
}

# KMS key for encryption (optional)
resource "aws_kms_key" "secrets" {
  count                   = var.create_kms_key ? 1 : 0
  description             = "KMS key for ${var.environment} secrets encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "${var.environment}-secrets-key"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "secrets" {
  count         = var.create_kms_key ? 1 : 0
  name          = "alias/${var.environment}-secrets"
  target_key_id = aws_kms_key.secrets[0].key_id
}
