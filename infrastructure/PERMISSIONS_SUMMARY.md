# IAM Permissions Summary

## TL;DR

Your AWS credentials need permissions to create and manage:
- ✅ VPCs, Subnets, NAT Gateways, Internet Gateways, Route Tables
- ✅ EC2 Instances, Security Groups, Key Pairs
- ✅ IAM Roles and Instance Profiles (for EC2)
- ✅ RDS PostgreSQL Instances
- ✅ ElastiCache Redis Clusters
- ✅ ECR Repositories
- ✅ Application Load Balancers
- ✅ Route53 DNS Records
- ✅ ACM SSL Certificates
- ✅ Secrets Manager
- ✅ KMS Keys (optional)
- ✅ CloudWatch Log Groups
- ✅ S3 (for Terraform state)
- ✅ DynamoDB (for Terraform state locking)

## Services Required

| Service | Purpose | Permissions Level |
|---------|---------|-------------------|
| **S3** | Terraform state storage | Read/Write on specific bucket |
| **DynamoDB** | Terraform state locking | Read/Write on specific table |
| **EC2** | VPC, Subnets, Instances, Security Groups | Full for tagged resources |
| **IAM** | EC2 instance roles | Limited to `*-ec2-role` pattern |
| **RDS** | PostgreSQL database | Full create/modify/delete |
| **ElastiCache** | Redis cache | Full create/modify/delete |
| **ECR** | Container registry | Full create/modify/delete |
| **ELB** | Application Load Balancer | Full create/modify/delete |
| **Route53** | DNS management | Read hosted zones, modify records |
| **ACM** | SSL certificates | Request/describe/delete certificates |
| **Secrets Manager** | Secure secrets | Full create/modify/delete |
| **KMS** | Encryption keys | Create/manage keys (optional) |
| **CloudWatch Logs** | Application logging | Create/manage log groups |

## Estimated Permission Count

The minimal policy includes approximately **150+ specific permissions** across 14 AWS services.

## Why Not Use AdministratorAccess?

❌ **AdministratorAccess is overly permissive** and violates the principle of least privilege:
- Can delete ANY resource in your account
- Can modify IAM policies for privilege escalation
- Can access billing information
- Can affect resources managed by other teams

✅ **Our minimal policy:**
- Only affects infrastructure resources
- Cannot access other teams' resources
- Cannot escalate privileges
- Cannot modify billing or account settings
- Limited to specific resource patterns

## Resource Restrictions

Where possible, we restrict permissions to specific resources:

```json
{
  "Resource": [
    "arn:aws:iam::*:role/*-ec2-role",           // Only EC2 roles
    "arn:aws:s3:::milky-way-terraform-state",    // Only our state bucket
    "arn:aws:s3:::milky-way-terraform-state/*"   // Only state objects
  ]
}
```

## Security Layers

### Layer 1: Resource Naming Patterns
IAM roles are restricted to `*-ec2-role` and `*-ec2-profile` patterns.

### Layer 2: Environment Tags
All resources are tagged with:
- `Project: milky-way-admin-panel`
- `Environment: qa|prod`
- `ManagedBy: terraform`

### Layer 3: Region Restriction (Optional)
You can add region restriction:
```json
{
  "Condition": {
    "StringEquals": {
      "aws:RequestedRegion": "eu-south-2"
    }
  }
}
```

### Layer 4: MFA for Production (Optional)
Require MFA for production changes:
```json
{
  "Condition": {
    "Bool": {
      "aws:MultiFactorAuthPresent": "true"
    }
  }
}
```

## Cost Implications

The permissions themselves have **no cost**. However, the resources they create will incur costs:

- **QA Environment:** ~$63/month
- **Production Environment:** ~$268/month

See the main [README.md](README.md) for detailed cost breakdown.

## Audit Trail

All actions using these credentials are logged in:
- **CloudTrail** - API calls and resource changes
- **AWS Config** - Resource configuration history
- **VPC Flow Logs** - Network traffic (if enabled)

## Validation

Test your permissions before applying:

```bash
# Test S3 state access
aws s3 ls s3://milky-way-terraform-state

# Test EC2 permissions
aws ec2 describe-vpcs --region eu-south-2

# Test RDS permissions
aws rds describe-db-instances --region eu-south-2

# Test IAM permissions
aws iam list-roles --query 'Roles[?contains(RoleName, `ec2-role`)]'
```

## What This Policy CANNOT Do

❌ Cannot access other AWS accounts  
❌ Cannot modify IAM users or groups  
❌ Cannot access S3 buckets outside the state bucket  
❌ Cannot modify billing or cost allocation  
❌ Cannot access AWS Organizations settings  
❌ Cannot create VPCs in other regions (if region-restricted)  
❌ Cannot modify resources not tagged with `ManagedBy: terraform`  
❌ Cannot access other teams' infrastructure  

## Comparison with AWS Managed Policies

| Policy | Permissions | Our Use Case |
|--------|-------------|--------------|
| **AdministratorAccess** | Everything | ❌ Too broad |
| **PowerUserAccess** | Everything except IAM | ❌ Still too broad |
| **Custom (Ours)** | Only infrastructure services | ✅ Just right |

## GitHub Actions OIDC vs IAM User

### IAM User (Local Development)
```
✅ Simple setup
✅ Long-lived credentials
✅ Good for personal testing
⚠️  Must rotate keys regularly
⚠️  Keys can leak if not secured
```

### OIDC Role (CI/CD)
```
✅ No long-lived credentials
✅ Temporary tokens only
✅ Automatically rotated
✅ Cannot leak permanent credentials
✅ Best practice for automation
```

**Recommendation:** Use IAM User locally, OIDC for GitHub Actions.

## Next Steps

1. **Review the full policy:** [terraform-provisioning-policy.json](iam-policies/terraform-provisioning-policy.json)
2. **Read the complete guide:** [iam-policies/README.md](iam-policies/README.md)
3. **Create IAM user or role** with the minimal policy
4. **Test permissions** before running Terraform
5. **Set up MFA** for production credentials (optional but recommended)

## Support

If you encounter permission errors:
1. Check CloudTrail for the specific denied action
2. Review the [IAM Policies Guide](iam-policies/README.md)
3. Add only the missing permission (don't use wildcard `*`)

## References

- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Terraform AWS Provider Permissions](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Principle of Least Privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege)
