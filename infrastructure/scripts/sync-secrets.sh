#!/bin/bash
# Script to sync secrets from .env file to AWS Secrets Manager

set -e

# Check arguments
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <environment>"
    echo "Example: $0 qa"
    exit 1
fi

ENVIRONMENT=$1
SECRET_NAME="${ENVIRONMENT}/app-secrets"
ENV_FILE="../../.env.${ENVIRONMENT}"

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Environment file $ENV_FILE not found"
    exit 1
fi

# Load environment variables from .env file
export $(cat $ENV_FILE | grep -v '^#' | xargs)

# Create JSON object from environment variables
SECRET_JSON=$(cat $ENV_FILE | grep -v '^#' | grep -v '^$' | jq -R -s -c 'split("\n") | map(select(length > 0)) | map(split("=")) | map({(.[0]): .[1]}) | add')

echo "Syncing secrets to AWS Secrets Manager..."
echo "Secret Name: $SECRET_NAME"

# Check if secret exists
if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" 2>/dev/null; then
    echo "Secret exists, updating..."
    aws secretsmanager update-secret \
        --secret-id "$SECRET_NAME" \
        --secret-string "$SECRET_JSON"
else
    echo "Secret does not exist, creating..."
    aws secretsmanager create-secret \
        --name "$SECRET_NAME" \
        --description "Application secrets for ${ENVIRONMENT} environment" \
        --secret-string "$SECRET_JSON" \
        --tags Key=Environment,Value=$ENVIRONMENT Key=ManagedBy,Value=script
fi

echo "✅ Secrets synced successfully!"
echo ""
echo "To retrieve secrets:"
echo "aws secretsmanager get-secret-value --secret-id $SECRET_NAME --query SecretString --output text | jq ."
