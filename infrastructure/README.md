# Milky Way Admin Panel - Infrastructure

This directory contains Infrastructure as Code (IaC) using Terraform and Terragrunt to provision and manage AWS infrastructure.

> 🔐 **NEW TO AWS IAM?** Start here: [5-Minute IAM Setup Guide](QUICKSTART_IAM.md)

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Directory Structure](#directory-structure)
- [Getting Started](#getting-started)
- [Deployment Guide](#deployment-guide)
- [Environment Configuration](#environment-configuration)
- [Secrets Management](#secrets-management)
- [CI/CD Pipeline](#cicd-pipeline)
- [Troubleshooting](#troubleshooting)
- [Cost Optimization](#cost-optimization)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Terraform** >= 1.6.0 ([Installation Guide](https://developer.hashicorp.com/terraform/downloads))
- **Terragrunt** >= 0.54.0 ([Installation Guide](https://terragrunt.gruntwork.io/docs/getting-started/install/))
- **AWS CLI** v2 ([Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html))
- **Docker** ([Installation Guide](https://docs.docker.com/get-docker/))
- **jq** - For JSON processing

### AWS IAM Permissions

**IMPORTANT:** Before provisioning infrastructure, you need AWS credentials with appropriate permissions.

#### Quick Setup (Minimal Permissions)

```bash
# 1. Create IAM user for Terraform
aws iam create-user --user-name terraform-provisioner

# 2. Attach the minimal permissions policy
aws iam put-user-policy \
  --user-name terraform-provisioner \
  --policy-name TerraformProvisioningPolicy \
  --policy-document file://iam-policies/terraform-provisioning-policy.json

# 3. Create access key
aws iam create-access-key --user-name terraform-provisioner

# 4. Configure AWS CLI
aws configure --profile terraform
```

📖 **See [IAM Policies Guide](iam-policies/README.md) for:**
- Complete policy JSON with minimal permissions
- GitHub Actions OIDC setup
- Security best practices
- Troubleshooting permission issues

### AWS Configuration

Configure your AWS credentials:

```bash
aws configure
```

Or export environment variables:

```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=eu-south-2
```

Or use AWS profile:

```bash
export AWS_PROFILE=terraform
```

## Architecture Overview

The infrastructure consists of:

### Networking
- **VPC** with public and private subnets across 2 AZs
- **Internet Gateway** for public subnet internet access
- **NAT Gateway** (optional, for private subnet internet access)

### Compute
- **EC2 instances** running Docker containers
- **Application Load Balancer** distributing traffic
- Security groups with least-privilege access

### Database & Cache
- **RDS PostgreSQL 15** in private subnets
- **ElastiCache Redis** for session storage and caching
- Automated backups and Multi-AZ support (prod)

### Container Registry
- **Amazon ECR** repositories for API and Web images
- Lifecycle policies for image cleanup

### DNS & SSL
- **Route53** for DNS management (optional)
- **ACM certificates** for HTTPS (optional)

### Security & Monitoring
- **AWS Secrets Manager** for sensitive data
- **CloudWatch Logs** for application logging
- **CloudWatch Alarms** for monitoring

## Directory Structure

```
infrastructure/
├── modules/                    # Reusable Terraform modules
│   ├── vpc/                   # VPC and networking
│   ├── rds/                   # RDS PostgreSQL
│   ├── redis/                 # ElastiCache Redis
│   ├── ecr/                   # Container registry
│   ├── ec2/                   # EC2 instances
│   ├── alb/                   # Application Load Balancer
│   ├── route53/               # DNS records
│   ├── acm/                   # SSL certificates
│   ├── secrets/               # Secrets Manager
│   └── state-backend/         # Terraform state storage
├── environments/
│   ├── qa/                    # QA environment
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── terragrunt.hcl
│   │   └── terraform.tfvars.example
│   └── prod/                  # Production environment
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       ├── terragrunt.hcl
│       └── terraform.tfvars.example
├── scripts/
│   └── sync-secrets.sh        # Sync .env to Secrets Manager
├── terragrunt.hcl             # Root Terragrunt config
└── README.md                  # This file
```

## Getting Started

### 1. Initialize State Backend

First, you need to create the S3 bucket and DynamoDB table for Terraform state management:

```bash
# Set environment variables
export TF_STATE_BUCKET="milky-way-terraform-state"
export TF_STATE_LOCK_TABLE="milky-way-terraform-locks"
export AWS_REGION="eu-south-2"

# Create S3 bucket for state
aws s3 mb s3://$TF_STATE_BUCKET --region $AWS_REGION

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket $TF_STATE_BUCKET \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket $TF_STATE_BUCKET \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name $TF_STATE_LOCK_TABLE \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $AWS_REGION
```

### 2. Configure Environment

Choose your environment (qa or prod) and configure:

```bash
cd environments/qa  # or cd environments/prod

# Copy the example tfvars file
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
vim terraform.tfvars
```

Required variables:
- `db_master_password` - Strong database password
- `ssh_public_key` or `existing_key_name` - SSH access
- `domain_name` and `route53_zone_id` (if using custom domain)

### 3. Initialize Terraform

```bash
terraform init
```

Or using Terragrunt:

```bash
terragrunt init
```

### 4. Plan Infrastructure

Review the changes before applying:

```bash
terraform plan
```

Or using Terragrunt:

```bash
terragrunt plan
```

### 5. Apply Infrastructure

Deploy the infrastructure:

```bash
terraform apply
```

Or using Terragrunt:

```bash
terragrunt apply
```

## Deployment Guide

### Initial Deployment

1. **Provision Infrastructure** (as shown above)

2. **Sync Application Secrets**

```bash
# Create .env file for your environment
cp ../../.env.example ../../.env.qa

# Edit with production values
vim ../../.env.qa

# Sync to AWS Secrets Manager
cd ../scripts
./sync-secrets.sh qa
```

3. **Build and Push Docker Images**

```bash
# Login to ECR
aws ecr get-login-password --region eu-south-2 | \
  docker login --username AWS --password-stdin <ECR_REGISTRY>

# Build and push API
cd ../../apps/api
docker build -t <ECR_REGISTRY>/milky-way-admin-panel-api:latest --target production .
docker push <ECR_REGISTRY>/milky-way-admin-panel-api:latest

# Build and push Web
cd ../web
docker build -t <ECR_REGISTRY>/milky-way-admin-panel-web:latest --target production .
docker push <ECR_REGISTRY>/milky-way-admin-panel-web:latest
```

4. **Deploy to EC2**

SSH into your EC2 instance:

```bash
ssh -i ~/.ssh/your-key.pem ec2-user@<EC2_PUBLIC_IP>
```

The deployment script will be available at `/opt/app/deploy.sh`:

```bash
cd /opt/app
./deploy.sh
```

### Continuous Deployment with GitHub Actions

The repository includes GitHub Actions workflows for automated deployments:

1. **Setup GitHub Secrets**

Required secrets:
- `AWS_ROLE_ARN` - IAM role for GitHub Actions OIDC
- `AWS_REGION` - AWS region
- `SSH_PRIVATE_KEY` - Private key for EC2 SSH access
- `QA_EC2_HOST` - QA EC2 public IP
- `PROD_EC2_HOST` - Production EC2 public IP

2. **Automatic Deployments**

- Push to `develop` → Deploys to QA
- Push to `main` → Deploys to Production (requires approval)

3. **Manual Deployment**

Go to Actions → Deploy to Environment → Run workflow

## Environment Configuration

### QA Environment

**Purpose:** Testing and quality assurance

**Configuration:**
- Single AZ deployment
- Smaller instance sizes (t3.small, db.t3.micro)
- NAT Gateway disabled (cost savings)
- No Multi-AZ for RDS/Redis
- Relaxed deletion protection

### Production Environment

**Purpose:** Live production workload

**Configuration:**
- Multi-AZ deployment
- Larger instance sizes (t3.medium, db.t3.small)
- NAT Gateway enabled
- Multi-AZ for RDS and Redis
- Deletion protection enabled
- Enhanced monitoring and logging

## Secrets Management

### Storing Secrets

Application secrets are stored in AWS Secrets Manager:

```bash
# Sync from .env file
./infrastructure/scripts/sync-secrets.sh qa

# Or manually create
aws secretsmanager create-secret \
  --name qa/app-secrets \
  --secret-string file://.env.qa
```

### Retrieving Secrets

```bash
# Get secret value
aws secretsmanager get-secret-value \
  --secret-id qa/app-secrets \
  --query SecretString \
  --output text | jq .
```

### Required Secrets

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `REFRESH_TOKEN_SECRET` - Refresh token secret
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret
- `RESEND_API_KEY` - Email service API key

## CI/CD Pipeline

### Build and Push Workflow

Triggers on push to `main` or `develop`:

1. Checkout code
2. Configure AWS credentials (OIDC)
3. Login to ECR
4. Build Docker images (multi-stage)
5. Push to ECR with tags

### Deploy Workflow

Triggers after successful build:

1. SSH into EC2 instance
2. Authenticate with ECR
3. Fetch latest secrets from AWS
4. Pull latest images
5. Run database migrations
6. Restart containers
7. Health check verification

## Troubleshooting

### Common Issues

**1. Terraform State Lock**

If terraform is stuck with a state lock:

```bash
# List locks
aws dynamodb scan --table-name milky-way-terraform-locks

# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

**2. ECR Authentication Expired**

ECR tokens expire after 12 hours:

```bash
aws ecr get-login-password --region eu-south-2 | \
  docker login --username AWS --password-stdin <ECR_REGISTRY>
```

**3. Database Connection Issues**

Check security groups:

```bash
# Verify EC2 can reach RDS
aws ec2 describe-security-groups --group-ids <RDS_SG_ID>
```

**4. Application Not Starting**

Check logs:

```bash
# On EC2 instance
docker-compose -f /opt/app/docker-compose.prod.yml logs

# Or CloudWatch
aws logs tail /aws/ec2/qa/api --follow
```

### Debugging Commands

```bash
# Check EC2 instance status
aws ec2 describe-instances --instance-ids <INSTANCE_ID>

# Check RDS status
aws rds describe-db-instances --db-instance-identifier qa-postgres

# Check Redis status
aws elasticache describe-replication-groups --replication-group-id qa-redis

# Check ALB target health
aws elbv2 describe-target-health --target-group-arn <TARGET_GROUP_ARN>
```

## Cost Optimization

### QA Environment Savings

- **Disable NAT Gateway** - Save ~$32/month per AZ
- **Single AZ** - No cross-AZ data transfer costs
- **Smaller instances** - t3.micro/small instead of medium
- **No Multi-AZ RDS** - Save 50% on database costs
- **Scheduled shutdown** - Stop instances during non-work hours

### General Tips

- Use spot instances for non-critical workloads
- Enable RDS storage autoscaling
- Set up CloudWatch alarms for cost anomalies
- Regular review of unused resources
- Use AWS Cost Explorer

### Estimated Monthly Costs

**QA Environment:**
- EC2 t3.small: ~$15
- RDS db.t3.micro: ~$15
- Redis cache.t3.micro: ~$12
- ALB: ~$16
- Data transfer: ~$5
- **Total: ~$63/month**

**Production Environment:**
- EC2 t3.medium (2x): ~$60
- RDS db.t3.small (Multi-AZ): ~$60
- Redis cache.t3.small (Multi-AZ): ~$48
- NAT Gateway (2x): ~$64
- ALB: ~$16
- Data transfer: ~$20
- **Total: ~$268/month**

## Additional Resources

- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terragrunt Documentation](https://terragrunt.gruntwork.io/docs/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review CloudWatch logs
3. Open an issue in the repository
