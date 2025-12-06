# Resend DNS Module

This Terraform module configures DNS records required for sending emails through [Resend](https://resend.com/).

## Features

- **DKIM Verification**: Adds domain verification record for email authentication
- **SPF Configuration**: Sets up Sender Policy Framework for authorized sending
- **DMARC Policy**: Implements email authentication, policy, and reporting protocol
- **MX Records**: Optional receiving configuration

## DNS Records Created

### 1. DKIM Verification (Domain Verification)
- **Type**: TXT
- **Name**: `resend._domainkey.{your-domain}`
- **Purpose**: Verifies domain ownership and enables DKIM signing

### 2. SPF Records (Enable Sending)
- **MX Record**:
  - **Name**: `send.{your-domain}`
  - **Value**: `10 feedback-smtp.us-east-1.amazonses.com`
- **TXT Record**:
  - **Name**: `send.{your-domain}`
  - **Value**: `v=spf1 include:amazonses.com ~all`
- **Purpose**: Authorizes Resend to send emails on behalf of your domain

### 3. DMARC Policy (Optional)
- **Type**: TXT
- **Name**: `_dmarc.{your-domain}`
- **Value**: `v=DMARC1; p=none;` (default, configurable)
- **Purpose**: Defines email authentication policy

### 4. MX Records for Receiving (Optional)
- **Type**: MX
- **Name**: `{your-domain}`
- **Value**: `10 inbound-smtp.us-east-1.amazonaws.com`
- **Purpose**: Enables email receiving (disabled by default)

## Usage

### Basic Configuration

```hcl
module "resend_dns" {
  source = "../../modules/resend-dns"

  environment  = "qa"
  domain_name  = "example.com"
  subdomain    = "qa"
  zone_id      = "Z1234567890ABC"
  dkim_value   = "p=MIGfMA0GCSqGSIb3DQEB..."
  
  enable_resend    = true
  enable_sending   = true
  enable_dmarc     = true
  enable_receiving = false
}
```

### Advanced Configuration

```hcl
module "resend_dns" {
  source = "../../modules/resend-dns"

  environment  = "prod"
  domain_name  = "example.com"
  subdomain    = ""  # Root domain
  zone_id      = "Z1234567890ABC"
  dkim_value   = "p=MIGfMA0GCSqGSIb3DQEB..."
  
  enable_resend    = true
  enable_sending   = true
  enable_dmarc     = true
  dmarc_policy     = "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"
  enable_receiving = true
}
```

## Setup Guide

### Step 1: Get DKIM Value from Resend

1. Log in to your [Resend dashboard](https://resend.com/domains)
2. Navigate to **Domains** section
3. Add your domain (e.g., `qa.example.com` for QA environment)
4. Copy the **DKIM verification value** (starts with `p=MIGfMA0GCSqGSIb3DQEB...`)

### Step 2: Configure Terraform Variables

Add to your `terraform.tfvars`:

```hcl
# For QA Environment
enable_resend_dns   = true
resend_dkim_value   = "p=MIGfMA0GCSqGSIb3DQEB..."  # From Resend dashboard
resend_dmarc_policy = "v=DMARC1; p=none;"
```

### Step 3: Apply Terraform

```bash
cd infrastructure/environments/qa
terraform init
terraform plan
terraform apply
```

### Step 4: Verify in Resend Dashboard

1. Wait 5-10 minutes for DNS propagation
2. Return to Resend dashboard
3. Click **Verify Domain**
4. All checks should pass:
   - ✅ Domain Verification (DKIM)
   - ✅ Enable Sending (SPF)
   - ✅ DMARC (if enabled)

## Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `environment` | string | - | Environment name (e.g., qa, prod) |
| `zone_id` | string | "" | Route53 hosted zone ID |
| `domain_name` | string | - | Base domain name |
| `subdomain` | string | "" | Subdomain prefix (e.g., "qa", "send") |
| `dkim_value` | string | - | DKIM verification value from Resend |
| `enable_resend` | bool | true | Enable Resend DNS configuration |
| `enable_sending` | bool | true | Enable email sending (SPF records) |
| `enable_dmarc` | bool | true | Enable DMARC policy |
| `dmarc_policy` | string | "v=DMARC1; p=none;" | DMARC policy string |
| `enable_receiving` | bool | false | Enable email receiving (MX records) |

## Outputs

| Output | Description |
|--------|-------------|
| `sending_domain` | The configured sending domain |
| `dkim_record_name` | DKIM record name created |
| `spf_record_name` | SPF record name created |
| `dmarc_record_name` | DMARC record name created |

## DMARC Policy Options

### Development/QA (Monitoring Only)
```hcl
dmarc_policy = "v=DMARC1; p=none;"
```

### Production (Quarantine)
```hcl
dmarc_policy = "v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc-reports@example.com"
```

### Production (Strict - Reject)
```hcl
dmarc_policy = "v=DMARC1; p=reject; pct=100; rua=mailto:dmarc-reports@example.com"
```

## Troubleshooting

### DNS Records Not Verifying

1. **Check DNS Propagation**:
   ```bash
   dig TXT resend._domainkey.qa.example.com
   dig TXT send.qa.example.com
   dig MX send.qa.example.com
   ```

2. **Verify Route53 Zone**:
   - Ensure `route53_zone_id` is correct
   - Check that NS records point to Route53

3. **Wait for Propagation**:
   - DNS changes can take 5-10 minutes
   - Some regions may take up to 48 hours

### Resend Verification Failing

1. **DKIM Value Mismatch**:
   - Ensure you copied the complete DKIM value from Resend
   - Value should start with `p=MIGfMA0GCSqGSIb3DQEB...`

2. **Domain Mismatch**:
   - Domain in Resend must match the sending domain
   - For subdomain `qa.example.com`, add exactly `qa.example.com` in Resend

3. **Multiple TXT Records**:
   - Only one DKIM record should exist per domain
   - Remove any duplicate records

## Security Best Practices

1. **Store DKIM value securely**: Mark `resend_dkim_value` as sensitive in tfvars
2. **Use strict DMARC in production**: Set `p=quarantine` or `p=reject`
3. **Monitor DMARC reports**: Configure `rua` to receive authentication reports
4. **Separate environments**: Use different subdomains for QA/staging/production

## Environment-Specific Recommendations

### QA Environment
```hcl
subdomain           = "qa"
enable_resend       = true
enable_sending      = true
enable_dmarc        = true
dmarc_policy        = "v=DMARC1; p=none;"  # Monitor only
enable_receiving    = false
```

### Production Environment
```hcl
subdomain           = ""  # or "send"
enable_resend       = true
enable_sending      = true
enable_dmarc        = true
dmarc_policy        = "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"
enable_receiving    = false  # Unless you need inbound email
```

## Related Documentation

- [Resend Documentation](https://resend.com/docs)
- [Resend Domain Setup](https://resend.com/docs/dashboard/domains/introduction)
- [DMARC Overview](https://dmarc.org/)
- [SPF Best Practices](https://www.rfc-editor.org/rfc/rfc7208.html)

## Support

For issues with:
- **DNS Records**: Check Route53 console and this module's configuration
- **Email Sending**: Contact Resend support or check their dashboard
- **Terraform**: Review module logs and validate variable inputs
