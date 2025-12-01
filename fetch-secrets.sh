#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values if not provided
ENVIRONMENT="${ENVIRONMENT:-prod}"
AWS_REGION="${AWS_REGION:-eu-south-2}"

SECRET_NAME="${ENVIRONMENT}/app-secrets"

echo -e "${GREEN}Fetching secrets from AWS Secrets Manager...${NC}"
echo -e "${YELLOW}Secret Name: ${SECRET_NAME}${NC}"
echo -e "${YELLOW}Region: ${AWS_REGION}${NC}"

# Determine the .env file location
if [ -d "/opt/app" ]; then
  ENV_FILE="/opt/app/.env"
else
  ENV_FILE=".env"
fi

# Fetch secrets from AWS Secrets Manager
SECRET_JSON=$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_NAME" \
  --region "$AWS_REGION" \
  --query SecretString \
  --output text 2>/dev/null || echo "{}")

# Parse and create .env file
if [ "$SECRET_JSON" != "{}" ] && [ -n "$SECRET_JSON" ]; then
  echo -e "${GREEN}Secrets fetched successfully from Secrets Manager${NC}"

  # Convert JSON to .env format
  echo "$SECRET_JSON" | jq -r 'to_entries|map("\(.key)=\(.value|tostring)")|.[]' > "$ENV_FILE"

  echo -e "${GREEN}Wrote secrets to $ENV_FILE${NC}"
else
  echo -e "${YELLOW}Warning: No secrets found in Secrets Manager (${SECRET_NAME})${NC}"
  echo -e "${YELLOW}Creating placeholder .env file${NC}"
  touch "$ENV_FILE"
fi

# Remove existing deployment variables to avoid duplicates
sed -i '/^ECR_REGISTRY=/d' "$ENV_FILE" 2>/dev/null || true
sed -i '/^IMAGE_TAG=/d' "$ENV_FILE" 2>/dev/null || true
sed -i '/^ENVIRONMENT=/d' "$ENV_FILE" 2>/dev/null || true
sed -i '/^AWS_REGION=/d' "$ENV_FILE" 2>/dev/null || true
sed -i '/^NODE_ENV=/d' "$ENV_FILE" 2>/dev/null || true

# Append infrastructure and deployment variables (these should always be set)
echo "" >> "$ENV_FILE"
echo "# Deployment variables" >> "$ENV_FILE"
echo "ECR_REGISTRY=${ECR_REGISTRY}" >> "$ENV_FILE"
echo "IMAGE_TAG=${IMAGE_TAG:-latest}" >> "$ENV_FILE"
echo "ENVIRONMENT=${ENVIRONMENT}" >> "$ENV_FILE"
echo "AWS_REGION=${AWS_REGION}" >> "$ENV_FILE"
echo "NODE_ENV=development" >> "$ENV_FILE"

# Set secure permissions
chmod 600 "$ENV_FILE"

echo -e "${GREEN}Environment file ready at $ENV_FILE${NC}"

# Display non-sensitive variable count for debugging
VAR_COUNT=$(grep -c "=" "$ENV_FILE" || echo "0")
echo -e "${GREEN}Total variables set: $VAR_COUNT${NC}"
