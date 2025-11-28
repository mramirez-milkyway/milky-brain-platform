#!/bin/bash

set -e

echo "=========================================="
echo "Destroying QA Infrastructure"
echo "=========================================="

# Set AWS profile
export AWS_PROFILE=milkyway

# Navigate to QA environment directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "Step 1: Destroying Terraform-managed resources..."
terraform destroy -auto-approve || echo "Terraform destroy completed with warnings"

echo ""
echo "Step 2: Cleaning up IAM roles..."
# Remove role from instance profiles
aws iam list-instance-profiles-for-role --role-name qa-ec2-role --query 'InstanceProfiles[*].InstanceProfileName' --output text 2>/dev/null | xargs -I {} aws iam remove-role-from-instance-profile --instance-profile-name {} --role-name qa-ec2-role 2>/dev/null || echo "No instance profiles to remove"

# Delete instance profiles
aws iam list-instance-profiles --query 'InstanceProfiles[?starts_with(InstanceProfileName, `qa`)].InstanceProfileName' --output text 2>/dev/null | xargs -I {} aws iam delete-instance-profile --instance-profile-name {} 2>/dev/null || echo "No instance profiles to delete"

# Delete inline policies
aws iam list-role-policies --role-name qa-ec2-role --query 'PolicyNames' --output text 2>/dev/null | xargs -I {} aws iam delete-role-policy --role-name qa-ec2-role --policy-name {} 2>/dev/null || echo "No inline policies to delete"

# Delete role
aws iam delete-role --role-name qa-ec2-role 2>/dev/null || echo "Role qa-ec2-role already deleted or doesn't exist"

echo ""
echo "Step 3: Cleaning up Secrets Manager secrets..."
aws secretsmanager delete-secret --secret-id qa/app-secrets --region eu-south-2 --force-delete-without-recovery 2>/dev/null || echo "Secret qa/app-secrets already deleted or doesn't exist"
aws secretsmanager delete-secret --secret-id qa/database-config --region eu-south-2 --force-delete-without-recovery 2>/dev/null || echo "Secret qa/database-config already deleted or doesn't exist"
aws secretsmanager delete-secret --secret-id qa/redis-config --region eu-south-2 --force-delete-without-recovery 2>/dev/null || echo "Secret qa/redis-config already deleted or doesn't exist"

echo ""
echo "Step 4: Deleting SSH key pair..."
aws ec2 delete-key-pair --key-name milky-way-qa --region eu-south-2 2>/dev/null || echo "Key pair milky-way-qa already deleted or doesn't exist"
rm -f ~/.ssh/milky-way-qa.pem 2>/dev/null || echo "Local key file already deleted or doesn't exist"

echo ""
echo "=========================================="
echo "QA Infrastructure Destruction Complete!"
echo "=========================================="
