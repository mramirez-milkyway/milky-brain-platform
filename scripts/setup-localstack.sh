#!/bin/bash

# Setup LocalStack Infrastructure
# This script provisions local AWS services using Terraform

set -e

echo "🚀 Setting up LocalStack infrastructure..."
echo ""

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health > /dev/null; then
  echo "❌ LocalStack is not running!"
  echo "   Start it with: docker-compose up -d localstack"
  exit 1
fi

echo "✅ LocalStack is running"
echo ""

# Build Lambda package
echo "📦 Building Lambda package..."
cd lambdas/job-processor

if [ ! -f "package.json" ]; then
  echo "❌ Lambda package.json not found!"
  exit 1
fi

npm install --silent
npm run build

echo "✅ Lambda package built"
echo ""

# Apply Terraform
echo "🏗️  Applying Terraform configuration..."
cd ../../infrastructure/environments/local

terraform init -upgrade
terraform apply -auto-approve

echo ""
echo "✅ LocalStack infrastructure is ready!"
echo ""

# Display outputs
echo "📋 Configuration:"
terraform output -raw env_config

echo ""
echo "🎯 Next steps:"
echo "   1. Copy the environment variables above to apps/api/.env"
echo "   2. Restart your API: docker-compose restart api"
echo "   3. Test job creation: curl -X POST http://localhost:4000/api/jobs ..."
echo ""
