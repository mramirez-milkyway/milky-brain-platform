# S3 Bucket Module for Job File Storage
# Stores CSV files and other job-related files with versioning and encryption

resource "aws_s3_bucket" "jobs" {
  bucket = "${var.environment}-${var.project_name}-jobs"

  tags = {
    Name        = "${var.environment}-${var.project_name}-jobs"
    Environment = var.environment
    Purpose     = "Job file storage"
  }
}

# Enable versioning for file recovery
resource "aws_s3_bucket_versioning" "jobs" {
  bucket = aws_s3_bucket.jobs.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}

# Enable server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "jobs" {
  bucket = aws_s3_bucket.jobs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "jobs" {
  bucket = aws_s3_bucket.jobs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle rule to manage old files
resource "aws_s3_bucket_lifecycle_configuration" "jobs" {
  count  = var.lifecycle_days > 0 ? 1 : 0
  bucket = aws_s3_bucket.jobs.id

  rule {
    id     = "delete-old-files"
    status = "Enabled"

    expiration {
      days = var.lifecycle_days
    }

    noncurrent_version_expiration {
      noncurrent_days = var.noncurrent_version_expiration_days
    }
  }
}

# CORS configuration for presigned URLs
resource "aws_s3_bucket_cors_configuration" "jobs" {
  bucket = aws_s3_bucket.jobs.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
