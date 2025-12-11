# GitHub OIDC Provider for GitHub Actions
resource "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  # GitHub's thumbprint - verified and stable
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1"
  ]

  tags = {
    Name        = "${var.project_name}-github-oidc"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# IAM Role for GitHub Actions
resource "aws_iam_role" "github_actions" {
  name               = "${var.project_name}-github-actions-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role.json

  tags = {
    Name        = "${var.project_name}-github-actions-${var.environment}"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Trust policy for GitHub Actions to assume the role
data "aws_iam_policy_document" "github_actions_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_org}/${var.github_repo}:*"]
    }
  }
}

# Policy for GitHub Actions (ECR, EC2, Secrets Manager access)
data "aws_iam_policy_document" "github_actions_permissions" {
  # ECR permissions
  statement {
    sid    = "ECRAccess"
    effect = "Allow"
    actions = [
      "ecr:GetAuthorizationToken",
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:DescribeRepositories",
      "ecr:ListImages"
    ]
    resources = ["*"]
  }

  # Secrets Manager permissions (only if secrets_arns is provided)
  dynamic "statement" {
    for_each = length(var.secrets_arns) > 0 ? [1] : []
    content {
      sid    = "SecretsManagerAccess"
      effect = "Allow"
      actions = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ]
      resources = var.secrets_arns
    }
  }

  # EC2 read permissions (for deployment verification)
  statement {
    sid    = "EC2ReadAccess"
    effect = "Allow"
    actions = [
      "ec2:DescribeInstances",
      "ec2:DescribeInstanceStatus"
    ]
    resources = ["*"]
  }

  # S3 permissions for Lambda deployment bucket
  dynamic "statement" {
    for_each = var.lambda_deployment_bucket_arn != "" ? [1] : []
    content {
      sid    = "S3LambdaDeploymentAccess"
      effect = "Allow"
      actions = [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ]
      resources = [
        var.lambda_deployment_bucket_arn,
        "${var.lambda_deployment_bucket_arn}/*"
      ]
    }
  }

  # Lambda deployment permissions
  dynamic "statement" {
    for_each = length(var.lambda_function_arns) > 0 ? [1] : []
    content {
      sid    = "LambdaDeploymentAccess"
      effect = "Allow"
      actions = [
        "lambda:UpdateFunctionCode",
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration"
      ]
      resources = var.lambda_function_arns
    }
  }
}

# Attach the permissions policy to the role
resource "aws_iam_role_policy" "github_actions" {
  name   = "github-actions-permissions"
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.github_actions_permissions.json
}
