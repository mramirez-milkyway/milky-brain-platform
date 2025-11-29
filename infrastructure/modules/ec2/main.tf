# EC2 Module
# Creates EC2 instances with Docker and IAM roles for ECR access

data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Security Group for EC2
resource "aws_security_group" "ec2" {
  name        = "${var.environment}-ec2-sg"
  description = "Security group for EC2 instances"
  vpc_id      = var.vpc_id

  # SSH access
  ingress {
    description = "SSH from specified IPs"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_cidrs
  }

  # HTTP from ALB
  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = var.alb_security_group_ids
  }

  # HTTPS from ALB
  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = var.alb_security_group_ids
  }

  # API port from ALB
  ingress {
    description     = "API from ALB"
    from_port       = 4000
    to_port         = 4000
    protocol        = "tcp"
    security_groups = var.alb_security_group_ids
  }

  # API port from internet (for testing)
  ingress {
    description = "API from internet"
    from_port   = 4000
    to_port     = 4000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Web port from ALB
  ingress {
    description     = "Web from ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = var.alb_security_group_ids
  }

  # Web port from internet (for testing)
  ingress {
    description = "Web from internet"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-ec2-sg"
  }
}

# IAM Role for EC2
resource "aws_iam_role" "ec2" {
  name = "${var.environment}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.environment}-ec2-role"
  }
}

# IAM Policy for ECR access
resource "aws_iam_role_policy" "ecr_access" {
  name = "${var.environment}-ecr-access"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Policy for Secrets Manager access
resource "aws_iam_role_policy" "secrets_access" {
  name = "${var.environment}-secrets-access"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = "arn:aws:secretsmanager:*:*:secret:${var.environment}/*"
      }
    ]
  })
}

# IAM Policy for CloudWatch Logs
resource "aws_iam_role_policy" "cloudwatch_logs" {
  name = "${var.environment}-cloudwatch-logs"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:log-group:/aws/ec2/${var.environment}/*"
      }
    ]
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2" {
  name = "${var.environment}-ec2-profile"
  role = aws_iam_role.ec2.name

  tags = {
    Name = "${var.environment}-ec2-profile"
  }
}

# Key Pair
resource "aws_key_pair" "deployer" {
  count      = var.create_key_pair ? 1 : 0
  key_name   = "${var.environment}-deployer-key"
  public_key = var.ssh_public_key

  tags = {
    Name = "${var.environment}-deployer-key"
  }
}

# EC2 Instance
resource "aws_instance" "main" {
  count         = var.instance_count
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type

  subnet_id                   = var.public_subnet_ids[count.index % length(var.public_subnet_ids)]
  vpc_security_group_ids      = [aws_security_group.ec2.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2.name
  key_name                    = var.create_key_pair ? aws_key_pair.deployer[0].key_name : var.existing_key_name
  associate_public_ip_address = true

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_size
    delete_on_termination = true
    encrypted             = true
  }

  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    environment    = var.environment
    aws_region     = var.aws_region
    db_endpoint    = var.db_endpoint
    redis_endpoint = var.redis_endpoint
    ecr_registry   = var.ecr_registry_url
  }))

  tags = {
    Name = "${var.environment}-ec2-${count.index + 1}"
  }

  lifecycle {
    create_before_destroy = true
  }
}
