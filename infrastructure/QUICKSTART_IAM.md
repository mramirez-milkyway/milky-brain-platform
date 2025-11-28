# Quick Start: IAM Setup (5 Minutes)

## For Local Development

```bash
# 1. Navigate to infrastructure directory
cd infrastructure

# 2. Create IAM user
aws iam create-user --user-name terraform-provisioner

# 3. Attach policy (minimal permissions)
aws iam put-user-policy \
  --user-name terraform-provisioner \
  --policy-name TerraformProvisioningPolicy \
  --policy-document file://iam-policies/terraform-provisioning-policy.json

# 4. Create access keys
aws iam create-access-key --user-name terraform-provisioner
# ⚠️ SAVE THE OUTPUT - you won't see the secret again!

# 5. Configure AWS CLI
aws configure --profile terraform
# Paste: Access Key ID from step 4
# Paste: Secret Access Key from step 4
# Region: eu-south-2 (or your preferred region)
# Output format: json

# 6. Test permissions
export AWS_PROFILE=terraform
aws sts get-caller-identity
aws s3 ls  # Should work

# 7. You're ready! Start provisioning:
cd environments/qa
terraform init
```

## For GitHub Actions (OIDC - No Keys!)

```bash
# 1. Create OIDC provider (one-time, if not exists)
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# 2. Create trust policy (replace YOUR_ACCOUNT_ID, YOUR_ORG, YOUR_REPO)
cat > /tmp/github-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {"token.actions.githubusercontent.com:aud": "sts.amazonaws.com"},
      "StringLike": {"token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/YOUR_REPO:*"}
    }
  }]
}
EOF

# 3. Create role
aws iam create-role \
  --role-name GitHubActionsTerraformRole \
  --assume-role-policy-document file:///tmp/github-trust.json

# 4. Attach permissions
aws iam put-role-policy \
  --role-name GitHubActionsTerraformRole \
  --policy-name TerraformProvisioningPolicy \
  --policy-document file://iam-policies/terraform-provisioning-policy.json

# 5. Get role ARN
aws iam get-role --role-name GitHubActionsTerraformRole --query 'Role.Arn' --output text
# Copy this ARN to GitHub Secrets as AWS_ROLE_ARN

# 6. Done! GitHub Actions can now deploy without keys
```

## What Permissions Does This Give?

✅ Create VPCs, subnets, route tables  
✅ Launch EC2 instances  
✅ Create RDS databases  
✅ Create Redis clusters  
✅ Manage ECR repositories  
✅ Configure load balancers  
✅ Manage DNS records  
✅ Create SSL certificates  
✅ Store/retrieve secrets  

❌ Cannot access other teams' resources  
❌ Cannot modify IAM users/groups  
❌ Cannot access billing  
❌ Cannot delete resources outside Terraform state  

## Troubleshooting

**"Access Denied" error?**
```bash
# Check which user you're using
aws sts get-caller-identity

# Verify policy is attached
aws iam get-user-policy --user-name terraform-provisioner --policy-name TerraformProvisioningPolicy

# Check CloudTrail for specific denied action
aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=AccessDenied --max-items 5
```

**Want to add MFA for production?**
```bash
# Enable MFA on user
aws iam enable-mfa-device \
  --user-name terraform-provisioner \
  --serial-number arn:aws:iam::ACCOUNT_ID:mfa/terraform-provisioner \
  --authentication-code-1 123456 \
  --authentication-code-2 789012
```

## Cost

**IAM Users/Roles:** FREE  
**Permissions:** FREE  
**Resources created:** ~$63/month (QA) or ~$268/month (Prod)

## Security Tips

🔒 **Use IAM user for local dev, OIDC for CI/CD**  
🔒 **Enable MFA for production credentials**  
🔒 **Rotate access keys every 90 days**  
🔒 **Never commit AWS keys to Git**  
🔒 **Use AWS Secrets Manager for app secrets**  

## Next Steps

1. ✅ Set up IAM (you just did this!)
2. 📖 Read full guide: [README.md](README.md)
3. 🚀 Provision infrastructure: `make infra-apply ENV=qa`
4. 🔐 Sync secrets: `make sync-secrets ENV=qa`
5. 🐳 Deploy app: [GitHub Actions workflows](.github/workflows/)

## Full Documentation

- 📘 [Complete IAM Guide](iam-policies/README.md) - Detailed permissions breakdown
- 📄 [Policy JSON](iam-policies/terraform-provisioning-policy.json) - Full policy document
- 📊 [Permissions Summary](PERMISSIONS_SUMMARY.md) - What you can/cannot do
- 🏗️ [Main README](README.md) - Complete infrastructure guide
