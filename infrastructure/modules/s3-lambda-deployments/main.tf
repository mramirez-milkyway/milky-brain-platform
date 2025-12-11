# S3 Bucket for Lambda Deployment Packages
# Stores Lambda zip files uploaded during CI/CD deployments

resource "aws_s3_bucket" "lambda_deployments" {
  bucket = "${var.environment}-${var.project_name}-lambda-deployments"

  tags = {
    Name        = "${var.environment}-${var.project_name}-lambda-deployments"
    Environment = var.environment
    Purpose     = "Lambda deployment packages"
  }
}

resource "aws_s3_bucket_versioning" "lambda_deployments" {
  bucket = aws_s3_bucket.lambda_deployments.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "lambda_deployments" {
  bucket = aws_s3_bucket.lambda_deployments.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "lambda_deployments" {
  bucket = aws_s3_bucket.lambda_deployments.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle rule to clean up old deployment packages
resource "aws_s3_bucket_lifecycle_configuration" "lambda_deployments" {
  bucket = aws_s3_bucket.lambda_deployments.id

  rule {
    id     = "cleanup-old-deployments"
    status = "Enabled"

    # Keep only last 30 days of deployment packages
    expiration {
      days = var.retention_days
    }

    # Clean up incomplete multipart uploads
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}
