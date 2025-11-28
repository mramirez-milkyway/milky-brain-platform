# IAM Permissions for Terraform Provisioning

This guide explains the minimal IAM permissions required for Terraform to provision the infrastructure.

## Quick Setup

### Option 1: Create IAM User (Recommended for local development)

```bash
# 1. Create IAM user
aws iam create-user --user-name terraform-provisioner

# 2. Attach the policy
aws iam put-user-policy \
  --user-name terraform-provisioner \
  --policy-name TerraformProvisioningPolicy \
  --policy-document file://iam-policies/terraform-provisioning-policy.json

# 3. Create access key
aws iam create-access-key --user-name terraform-provisioner

# 4. Configure AWS CLI
aws configure --profile terraform
# Enter the access key ID and secret when prompted
```

### Option 2: Create IAM Role (Recommended for GitHub Actions)

For GitHub Actions using OIDC:

```bash
# 1. Create the trust policy
cat > github-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/YOUR_REPO:*"
        }
      }
    }
  ]
}
EOF

# 2. Create the role
aws iam create-role \
  --role-name GitHubActionsTerraformRole \
  --assume-role-policy-document file://github-trust-policy.json

# 3. Attach the provisioning policy
aws iam put-role-policy \
  --role-name GitHubActionsTerraformRole \
  --policy-name TerraformProvisioningPolicy \
  --policy-document file://iam-policies/terraform-provisioning-policy.json
```

## Required Permissions Breakdown

### 1. Terraform State Management (S3 & DynamoDB)

**Why:** Terraform needs to store and lock state files.

```json
{
  "Effect": "Allow",
  "Action": [
    "s3:ListBucket", "s3:GetObject", "s3:PutObject", "s3:DeleteObject",
    "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem"
  ],
  "Resource": [
    "arn:aws:s3:::milky-way-terraform-state",
    "arn:aws:s3:::milky-way-terraform-state/*",
    "arn:aws:dynamodb:*:*:table/milky-way-terraform-locks"
  ]
}
```

### 2. VPC & Networking (EC2)

**Why:** Create VPCs, subnets, route tables, NAT gateways, etc.

**Actions:** `ec2:CreateVpc`, `ec2:CreateSubnet`, `ec2:CreateInternetGateway`, `ec2:CreateNatGateway`, `ec2:AllocateAddress`, `ec2:CreateRouteTable`, etc.

### 3. Security Groups (EC2)

**Why:** Create and manage security groups for EC2, RDS, Redis, ALB.

**Actions:** `ec2:CreateSecurityGroup`, `ec2:AuthorizeSecurityGroupIngress/Egress`, etc.

### 4. EC2 Instances

**Why:** Launch and manage EC2 instances for application hosting.

**Actions:** `ec2:RunInstances`, `ec2:TerminateInstances`, `ec2:DescribeInstances`, `ec2:CreateKeyPair`, etc.

### 5. IAM Roles (EC2 Instance Profile)

**Why:** Create IAM roles for EC2 instances to access ECR, Secrets Manager, CloudWatch.

**Actions:** `iam:CreateRole`, `iam:CreateInstanceProfile`, `iam:PassRole`, `iam:PutRolePolicy`, etc.

**Resource Restriction:** Limited to `*-ec2-role` and `*-ec2-profile` patterns.

### 6. RDS (PostgreSQL Database)

**Why:** Provision RDS PostgreSQL instances, subnet groups, parameter groups.

**Actions:** `rds:CreateDBInstance`, `rds:CreateDBSubnetGroup`, `rds:CreateDBParameterGroup`, etc.

### 7. ElastiCache (Redis)

**Why:** Provision Redis clusters, subnet groups, parameter groups.

**Actions:** `elasticache:CreateReplicationGroup`, `elasticache:CreateCacheSubnetGroup`, etc.

### 8. ECR (Container Registry)

**Why:** Create ECR repositories for Docker images.

**Actions:** `ecr:CreateRepository`, `ecr:PutLifecyclePolicy`, `ecr:SetRepositoryPolicy`, etc.

### 9. Load Balancer (ALB)

**Why:** Create Application Load Balancers, target groups, listeners.

**Actions:** `elasticloadbalancing:CreateLoadBalancer`, `elasticloadbalancing:CreateTargetGroup`, etc.

### 10. Route53 (DNS)

**Why:** Manage DNS records for custom domains (optional).

**Actions:** `route53:ListHostedZones`, `route53:ChangeResourceRecordSets`, etc.

### 11. ACM (SSL Certificates)

**Why:** Request and manage SSL certificates (optional).

**Actions:** `acm:RequestCertificate`, `acm:DescribeCertificate`, etc.

### 12. Secrets Manager

**Why:** Store and retrieve application secrets securely.

**Actions:** `secretsmanager:CreateSecret`, `secretsmanager:GetSecretValue`, etc.

### 13. KMS (Encryption Keys)

**Why:** Create KMS keys for encrypting secrets (optional but recommended for production).

**Actions:** `kms:CreateKey`, `kms:CreateAlias`, `kms:EnableKeyRotation`, etc.

### 14. CloudWatch Logs

**Why:** Create log groups for application logging.

**Actions:** `logs:CreateLogGroup`, `logs:PutRetentionPolicy`, etc.

## Security Best Practices

### 1. Use Separate Credentials per Environment

```bash
# QA User
aws iam create-user --user-name terraform-qa

# Production User (more restrictive)
aws iam create-user --user-name terraform-prod
```

### 2. Add Resource Tags Condition (Optional)

Restrict Terraform to only manage resources with specific tags:

```json
{
  "Condition": {
    "StringEquals": {
      "aws:RequestedRegion": "eu-south-2",
      "aws:ResourceTag/ManagedBy": "terraform"
    }
  }
}
```

### 3. Use MFA for Production

Require MFA for production infrastructure changes:

```json
{
  "Condition": {
    "Bool": {
      "aws:MultiFactorAuthPresent": "true"
    }
  }
}
```

### 4. Restrict by IP Address

Limit access to your office/VPN IP:

```json
{
  "Condition": {
    "IpAddress": {
      "aws:SourceIp": "YOUR_IP/32"
    }
  }
}
```

### 5. Time-Based Access (Optional)

For production, require approvals during business hours only:

```json
{
  "Condition": {
    "DateGreaterThan": {"aws:CurrentTime": "2024-01-01T09:00:00Z"},
    "DateLessThan": {"aws:CurrentTime": "2024-01-01T17:00:00Z"}
  }
}
```

## GitHub Actions OIDC Setup

### Step 1: Create OIDC Provider (One-time setup)

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### Step 2: Create Role with Trust Policy

```bash
# Replace YOUR_ACCOUNT_ID, YOUR_ORG, YOUR_REPO
cat > github-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/YOUR_REPO:*"
        }
      }
    }
  ]
}
EOF

aws iam create-role \
  --role-name GitHubActionsTerraformRole \
  --assume-role-policy-document file://github-trust-policy.json

aws iam put-role-policy \
  --role-name GitHubActionsTerraformRole \
  --policy-name TerraformProvisioningPolicy \
  --policy-document file://iam-policies/terraform-provisioning-policy.json
```

### Step 3: Configure GitHub Secrets

Add to your repository secrets:
- `AWS_ROLE_ARN`: `arn:aws:iam::YOUR_ACCOUNT_ID:role/GitHubActionsTerraformRole`
- `AWS_REGION`: `eu-south-2` (or your preferred region)

## Additional Permissions for CI/CD

If using GitHub Actions to also push Docker images and deploy:

```json
{
  "Sid": "ECRPushAccess",
  "Effect": "Allow",
  "Action": [
    "ecr:GetAuthorizationToken",
    "ecr:BatchCheckLayerAvailability",
    "ecr:GetDownloadUrlForLayer",
    "ecr:BatchGetImage",
    "ecr:PutImage",
    "ecr:InitiateLayerUpload",
    "ecr:UploadLayerPart",
    "ecr:CompleteLayerUpload"
  ],
  "Resource": "*"
}
```

## Verifying Permissions

Test that your credentials have the required permissions:

```bash
# Test S3 access
aws s3 ls s3://milky-way-terraform-state

# Test EC2 describe
aws ec2 describe-vpcs

# Test RDS describe
aws rds describe-db-instances

# Test ECR describe
aws ecr describe-repositories
```

## Troubleshooting

### Access Denied Errors

1. **Check IAM policy is attached:**
   ```bash
   aws iam list-user-policies --user-name terraform-provisioner
   aws iam get-user-policy --user-name terraform-provisioner --policy-name TerraformProvisioningPolicy
   ```

2. **Verify credentials:**
   ```bash
   aws sts get-caller-identity
   ```

3. **Enable CloudTrail** to see which permission is missing:
   ```bash
   aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=AccessDenied
   ```

### Common Missing Permissions

- **iam:PassRole** - Required when creating EC2 instances with instance profiles
- **ec2:DescribeImages** - Required when launching EC2 instances
- **route53:GetChange** - Required when waiting for DNS changes to propagate

## Cleanup

To remove the IAM user/role when no longer needed:

```bash
# Remove user
aws iam delete-user-policy --user-name terraform-provisioner --policy-name TerraformProvisioningPolicy
aws iam delete-user --user-name terraform-provisioner

# Remove role
aws iam delete-role-policy --role-name GitHubActionsTerraformRole --policy-name TerraformProvisioningPolicy
aws iam delete-role --role-name GitHubActionsTerraformRole
```

## References

- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
