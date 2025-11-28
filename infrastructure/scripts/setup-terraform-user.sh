#!/bin/bash
# Setup Terraform Provisioning User with Minimal Permissions
# This script safely creates an IAM user with split policies to stay under AWS size limits

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IAM_USER="terraform-provisioner"
POLICY_PREFIX="TerraformProvisioningPolicy"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Terraform IAM User Setup Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if AWS CLI is configured
echo -e "${YELLOW}[1/9] Checking AWS CLI configuration...${NC}"
if ! aws sts get-caller-identity &>/dev/null; then
    echo -e "${RED}❌ Error: AWS CLI not configured or credentials invalid${NC}"
    echo "Run: aws configure --profile milkyway"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS CLI configured. Account ID: ${ACCOUNT_ID}${NC}"
echo ""

# Check if user already exists
echo -e "${YELLOW}[2/9] Checking if IAM user exists...${NC}"
if aws iam get-user --user-name $IAM_USER &>/dev/null; then
    echo -e "${YELLOW}⚠️  User '$IAM_USER' already exists${NC}"
    read -p "Do you want to continue and update policies? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Aborted by user${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Creating IAM user: $IAM_USER${NC}"
    aws iam create-user --user-name $IAM_USER
    echo -e "${GREEN}✅ User created${NC}"
fi
echo ""

# Create policy files in /tmp
echo -e "${YELLOW}[3/9] Creating policy documents...${NC}"

cat > /tmp/policy1-core.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "TerraformStateManagement",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketVersioning",
        "s3:GetBucketLogging",
        "s3:GetBucketTagging",
        "s3:GetBucketPolicy",
        "s3:GetBucketPublicAccessBlock",
        "s3:GetEncryptionConfiguration",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::milky-way-terraform-state",
        "arn:aws:s3:::milky-way-terraform-state/*"
      ]
    },
    {
      "Sid": "TerraformStateLocking",
      "Effect": "Allow",
      "Action": [
        "dynamodb:DescribeTable",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/milky-way-terraform-locks"
    },
    {
      "Sid": "VPCAndNetworking",
      "Effect": "Allow",
      "Action": [
        "ec2:*Vpc*",
        "ec2:*Subnet*",
        "ec2:*InternetGateway*",
        "ec2:*NatGateway*",
        "ec2:*Address*",
        "ec2:*RouteTable*",
        "ec2:*Route",
        "ec2:*SecurityGroup*",
        "ec2:*Tags",
        "ec2:Describe*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EC2Instances",
      "Effect": "Allow",
      "Action": [
        "ec2:RunInstances",
        "ec2:TerminateInstances",
        "ec2:StopInstances",
        "ec2:StartInstances",
        "ec2:*KeyPair*",
        "ec2:ModifyInstanceAttribute"
      ],
      "Resource": "*"
    },
    {
      "Sid": "IAMForEC2",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:PassRole",
        "iam:CreateInstanceProfile",
        "iam:DeleteInstanceProfile",
        "iam:GetInstanceProfile",
        "iam:AddRoleToInstanceProfile",
        "iam:RemoveRoleFromInstanceProfile",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:GetRolePolicy",
        "iam:ListRolePolicies",
        "iam:ListInstanceProfiles",
        "iam:ListRoles",
        "iam:TagRole",
        "iam:UntagRole"
      ],
      "Resource": [
        "arn:aws:iam::*:role/*-ec2-role",
        "arn:aws:iam::*:instance-profile/*-ec2-profile"
      ]
    }
  ]
}
EOF

cat > /tmp/policy2-data.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RDSManagement",
      "Effect": "Allow",
      "Action": [
        "rds:*DBInstance*",
        "rds:*DBSubnetGroup*",
        "rds:*DBParameterGroup*",
        "rds:*TagsToResource",
        "rds:ListTagsForResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ElastiCacheManagement",
      "Effect": "Allow",
      "Action": [
        "elasticache:*ReplicationGroup*",
        "elasticache:*CacheSubnetGroup*",
        "elasticache:*CacheParameterGroup*",
        "elasticache:*TagsToResource",
        "elasticache:ListTagsForResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "SecretsAndEncryption",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:*Secret*",
        "kms:CreateKey",
        "kms:CreateAlias",
        "kms:DeleteAlias",
        "kms:DescribeKey",
        "kms:GetKeyPolicy",
        "kms:GetKeyRotationStatus",
        "kms:EnableKeyRotation",
        "kms:ScheduleKeyDeletion",
        "kms:TagResource",
        "kms:UntagResource",
        "kms:ListKeys",
        "kms:ListAliases",
        "kms:ListResourceTags"
      ],
      "Resource": "*"
    }
  ]
}
EOF

cat > /tmp/policy3-services.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRManagement",
      "Effect": "Allow",
      "Action": [
        "ecr:*Repository*",
        "ecr:*LifecyclePolicy*",
        "ecr:TagResource",
        "ecr:UntagResource",
        "ecr:ListTagsForResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "LoadBalancers",
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:*LoadBalancer*",
        "elasticloadbalancing:*TargetGroup*",
        "elasticloadbalancing:*Listener*",
        "elasticloadbalancing:*Rule*",
        "elasticloadbalancing:*Targets",
        "elasticloadbalancing:*Tags"
      ],
      "Resource": "*"
    },
    {
      "Sid": "DNSAndSSL",
      "Effect": "Allow",
      "Action": [
        "route53:GetHostedZone",
        "route53:ListHostedZones*",
        "route53:ListResourceRecordSets",
        "route53:ChangeResourceRecordSets",
        "route53:GetChange",
        "acm:RequestCertificate",
        "acm:DescribeCertificate",
        "acm:DeleteCertificate",
        "acm:ListCertificates",
        "acm:*TagsToCertificate",
        "acm:ListTagsForCertificate"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:DeleteLogGroup",
        "logs:DescribeLogGroups",
        "logs:PutRetentionPolicy",
        "logs:DeleteRetentionPolicy",
        "logs:TagLogGroup",
        "logs:UntagLogGroup",
        "logs:ListTagsLogGroup"
      ],
      "Resource": "*"
    }
  ]
}
EOF

echo -e "${GREEN}✅ Policy documents created in /tmp${NC}"
echo ""

# Create or update policies
echo -e "${YELLOW}[4/9] Creating IAM policies...${NC}"

POLICIES=("Core" "Data" "Services")
for policy_suffix in "${POLICIES[@]}"; do
    POLICY_NAME="${POLICY_PREFIX}-${policy_suffix}"
    POLICY_FILE="/tmp/policy$(echo $policy_suffix | tr '[:upper:]' '[:lower:]' | sed 's/core/1-core/;s/data/2-data/;s/services/3-services/').json"

    # Check if policy exists
    if aws iam get-policy --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}" &>/dev/null; then
        echo -e "${YELLOW}⚠️  Policy '${POLICY_NAME}' already exists, skipping...${NC}"
    else
        echo -e "${YELLOW}Creating policy: ${POLICY_NAME}${NC}"
        aws iam create-policy \
            --policy-name "${POLICY_NAME}" \
            --policy-document "file://${POLICY_FILE}" \
            --description "Terraform provisioning permissions - ${policy_suffix}" \
            > /dev/null
        echo -e "${GREEN}✅ Created ${POLICY_NAME}${NC}"
    fi
done
echo ""

# Attach policies to user
echo -e "${YELLOW}[5/9] Attaching policies to user...${NC}"

for policy_suffix in "${POLICIES[@]}"; do
    POLICY_NAME="${POLICY_PREFIX}-${policy_suffix}"
    POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"

    # Check if already attached
    if aws iam list-attached-user-policies --user-name $IAM_USER | grep -q "${POLICY_NAME}"; then
        echo -e "${YELLOW}⚠️  Policy '${POLICY_NAME}' already attached${NC}"
    else
        echo -e "${YELLOW}Attaching policy: ${POLICY_NAME}${NC}"
        aws iam attach-user-policy \
            --user-name $IAM_USER \
            --policy-arn "${POLICY_ARN}"
        echo -e "${GREEN}✅ Attached ${POLICY_NAME}${NC}"
    fi
done
echo ""

# Check if access key already exists
echo -e "${YELLOW}[6/9] Checking for existing access keys...${NC}"
EXISTING_KEYS=$(aws iam list-access-keys --user-name $IAM_USER --query 'AccessKeyMetadata[].AccessKeyId' --output text)

if [ -n "$EXISTING_KEYS" ]; then
    echo -e "${YELLOW}⚠️  User already has access key(s): ${EXISTING_KEYS}${NC}"
    read -p "Do you want to create a new access key? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Skipping access key creation${NC}"
        SKIP_KEY_CREATION=true
    fi
fi
echo ""

# Create access key
if [ "$SKIP_KEY_CREATION" != "true" ]; then
    echo -e "${YELLOW}[7/9] Creating access key...${NC}"

    KEY_OUTPUT=$(aws iam create-access-key --user-name $IAM_USER --output json)
    ACCESS_KEY_ID=$(echo $KEY_OUTPUT | jq -r '.AccessKey.AccessKeyId')
    SECRET_ACCESS_KEY=$(echo $KEY_OUTPUT | jq -r '.AccessKey.SecretAccessKey')

    echo -e "${GREEN}✅ Access key created${NC}"
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}IMPORTANT: Save these credentials NOW!${NC}"
    echo -e "${RED}You won't be able to see them again!${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${GREEN}Access Key ID:${NC}     ${ACCESS_KEY_ID}"
    echo -e "${GREEN}Secret Access Key:${NC} ${SECRET_ACCESS_KEY}"
    echo ""

    # Save to file
    CREDENTIALS_FILE="$HOME/.aws/terraform-provisioner-credentials.txt"
    cat > "$CREDENTIALS_FILE" << CREDS
AWS Account ID: ${ACCOUNT_ID}
IAM User: ${IAM_USER}
Access Key ID: ${ACCESS_KEY_ID}
Secret Access Key: ${SECRET_ACCESS_KEY}
Created: $(date)
CREDS
    chmod 600 "$CREDENTIALS_FILE"
    echo -e "${YELLOW}📝 Credentials also saved to: ${CREDENTIALS_FILE}${NC}"
    echo ""
else
    echo -e "${YELLOW}[7/9] Skipped - Using existing access key${NC}"
    echo ""
fi

# Configure AWS CLI profile
echo -e "${YELLOW}[8/9] Configuring AWS CLI profile 'terraform'...${NC}"

if [ "$SKIP_KEY_CREATION" != "true" ]; then
    # Configure profile with new keys
    aws configure set aws_access_key_id "$ACCESS_KEY_ID" --profile terraform
    aws configure set aws_secret_access_key "$SECRET_ACCESS_KEY" --profile terraform
    aws configure set region "eu-south-2" --profile terraform
    aws configure set output "json" --profile terraform
    echo -e "${GREEN}✅ Profile 'terraform' configured${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping profile configuration (using existing keys)${NC}"
    echo "To configure manually: aws configure --profile terraform"
fi
echo ""

# Verify permissions
echo -e "${YELLOW}[9/9] Verifying permissions...${NC}"

if [ "$SKIP_KEY_CREATION" != "true" ]; then
    # Wait a moment for credentials to propagate
    echo -e "${YELLOW}Waiting 5 seconds for credentials to propagate...${NC}"
    sleep 5

    # Test with new profile
    if AWS_PROFILE=terraform aws sts get-caller-identity &>/dev/null; then
        echo -e "${GREEN}✅ Credentials verified!${NC}"
        AWS_PROFILE=terraform aws sts get-caller-identity
    else
        echo -e "${RED}⚠️  Warning: Credentials not yet active. Try again in a few seconds.${NC}"
    fi
else
    echo -e "${YELLOW}Skipping verification (no new keys created)${NC}"
fi
echo ""

# Cleanup temp files
rm -f /tmp/policy1-core.json /tmp/policy2-data.json /tmp/policy3-services.json

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Setup Complete! 🎉${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}IAM User:${NC} ${IAM_USER}"
echo -e "${GREEN}Policies Attached:${NC}"
echo "  - ${POLICY_PREFIX}-Core"
echo "  - ${POLICY_PREFIX}-Data"
echo "  - ${POLICY_PREFIX}-Services"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Add to your ~/.zshrc:"
echo "   alias aws-terraform='export AWS_PROFILE=terraform'"
echo ""
echo "2. Use the profile:"
echo "   aws-terraform"
echo "   aws sts get-caller-identity"
echo ""
echo "3. Start provisioning infrastructure:"
echo "   cd infrastructure/environments/qa"
echo "   terraform init"
echo "   terraform plan"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo "  - IAM Guide: infrastructure/iam-policies/README.md"
echo "  - Quick Start: infrastructure/QUICKSTART_IAM.md"
echo "  - Full Guide: infrastructure/README.md"
echo ""
