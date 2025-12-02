# Milky Way Admin Panel - Infrastructure

Simple guide to deploy infrastructure using Terraform.

## Prerequisites

- Terraform >= 1.6.0
- AWS CLI v2 configured with credentials
- AWS profile named `milkyway` (use `aws configure --profile milkyway`)

## Quick Start

### Step 1: Configure Environment

```bash
cd infrastructure/environments/qa  # or prod

# Edit terraform.tfvars with your values
vim terraform.tfvars

# Required: Set db_master_password and domain settings
# See terraform.tfvars.example for all options
```

### Step 2: Initialize Terraform

```bash
AWS_PROFILE=milkyway terraform init
```

### Step 3: Create Infrastructure

**For domains with HTTPS (recommended):**

```bash
# First, create ACM certificate (requires DNS to be configured)
AWS_PROFILE=milkyway terraform apply -target=module.acm

# Wait 5-10 minutes for certificate validation

# Then, apply everything else
AWS_PROFILE=milkyway terraform apply
```

**Without HTTPS (testing only):**

```bash
AWS_PROFILE=milkyway terraform apply
```

## What Gets Created

- **VPC** - Networking (public/private subnets)
- **EC2** - Application servers with Docker
- **RDS** - PostgreSQL database
- **Redis** - Cache/sessions
- **ALB** - Load balancer with HTTPS
- **ECR** - Docker image registry
- **Route53** - DNS records (if domain configured)
- **ACM** - SSL certificate (if domain configured)

## DNS Setup (Optional)

If using a custom domain:

1. Create Route53 hosted zone (can be done manually or via Terraform)
2. Update domain registrar (e.g., GoDaddy) with Route53 nameservers
3. Wait for DNS propagation (1-24 hours)
4. Set `domain_name`, `subdomain`, and `route53_zone_id` in terraform.tfvars
5. Apply Terraform

## Deploy Production

Production doesn't exist yet. To create it:

```bash
cd infrastructure/environments/prod

# Create terraform.tfvars from example
cp terraform.tfvars.example terraform.tfvars

# Edit with production values
vim terraform.tfvars

# Important: Generate strong db_master_password

# Initialize and apply
AWS_PROFILE=milkyway terraform init
AWS_PROFILE=milkyway terraform apply -target=module.acm  # If using HTTPS
AWS_PROFILE=milkyway terraform apply
```

## Secrets Management

Update application secrets in AWS Secrets Manager:

```bash
# Update QA secrets
AWS_PROFILE=milkyway aws secretsmanager update-secret \
  --secret-id qa/app-secrets \
  --region eu-south-2 \
  --secret-string file://.env.qa

# Update production secrets
AWS_PROFILE=milkyway aws secretsmanager update-secret \
  --secret-id prod/app-secrets \
  --region eu-south-2 \
  --secret-string file://.env.prod
```

## Common Commands

```bash
# View current infrastructure
AWS_PROFILE=milkyway terraform show

# View outputs (IPs, endpoints, etc.)
AWS_PROFILE=milkyway terraform output

# Destroy environment (careful!)
AWS_PROFILE=milkyway terraform destroy

# Update single module
AWS_PROFILE=milkyway terraform apply -target=module.ec2
```

## Troubleshooting

**Certificate stuck in "Pending Validation":**
- Verify DNS nameservers are updated at your domain registrar
- Check with: `dig NS yourdomain.com +short`

**"Invalid count argument" error:**
- Apply ACM module first: `terraform apply -target=module.acm`
- Then apply everything: `terraform apply`

**State lock error:**
- Someone else is running Terraform, or previous run crashed
- Force unlock (careful!): `terraform force-unlock <LOCK_ID>`

**Check infrastructure status:**
```bash
# EC2 instances
AWS_PROFILE=milkyway aws ec2 describe-instances --region eu-south-2

# RDS database
AWS_PROFILE=milkyway aws rds describe-db-instances --region eu-south-2

# ALB health
AWS_PROFILE=milkyway aws elbv2 describe-target-health --target-group-arn <ARN>
```

## Cost Estimates

**QA:** ~$63/month (t3.small, single AZ, no NAT)  
**Production:** ~$268/month (t3.medium x2, Multi-AZ, NAT Gateway)

## Directory Structure

```
environments/
├── qa/          # QA environment
│   ├── main.tf
│   ├── variables.tf
│   ├── terraform.tfvars  # Your config here
│   └── backend.tf
└── prod/        # Production environment
    ├── main.tf
    ├── variables.tf
    ├── terraform.tfvars  # Your config here
    └── backend.tf
```

## Need Help?

- Check Terraform output for detailed error messages
- Review CloudWatch logs in AWS Console
- Ensure AWS credentials are correct: `aws sts get-caller-identity --profile milkyway`
