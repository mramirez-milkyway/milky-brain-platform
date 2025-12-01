#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment...${NC}"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="/opt/app"

# Check if running on EC2
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Error: $APP_DIR does not exist. Are you on the EC2 instance?${NC}"
    exit 1
fi

cd "$APP_DIR"

# Use environment variables passed from GitHub Actions, or fallback to .env, or use defaults
if [ -z "$ENVIRONMENT" ]; then
    export $(grep -v '^#' .env 2>/dev/null | xargs) || true
    ENVIRONMENT=${ENVIRONMENT:-prod}
fi

if [ -z "$AWS_REGION" ]; then
    AWS_REGION=${AWS_REGION:-eu-south-2}
fi

if [ -z "$ECR_REGISTRY" ]; then
    # Get ECR registry from AWS if not provided
    ECR_REGISTRY=$(aws ecr describe-repositories --region "$AWS_REGION" --query 'repositories[0].repositoryUri' --output text 2>/dev/null | cut -d'/' -f1)

    if [ -z "$ECR_REGISTRY" ]; then
        echo -e "${RED}Error: Could not determine ECR registry${NC}"
        exit 1
    fi
fi

if [ -z "$IMAGE_TAG" ]; then
    IMAGE_TAG="latest"
fi

echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}AWS Region: $AWS_REGION${NC}"
echo -e "${YELLOW}ECR Registry: $ECR_REGISTRY${NC}"
echo -e "${YELLOW}Image Tag: $IMAGE_TAG${NC}"

# Authenticate with ECR
echo -e "${GREEN}Authenticating with ECR...${NC}"
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

# Export environment variables for docker-compose and fetch-secrets script
export ECR_REGISTRY="$ECR_REGISTRY"
export IMAGE_TAG="${IMAGE_TAG:-latest}"
export ENVIRONMENT="$ENVIRONMENT"
export AWS_REGION="$AWS_REGION"

# Fetch latest secrets
echo -e "${GREEN}Fetching latest secrets...${NC}"
if [ -f "./fetch-secrets.sh" ]; then
    ./fetch-secrets.sh
else
    echo -e "${YELLOW}Warning: fetch-secrets.sh not found, creating .env manually${NC}"
    # Create basic .env with deployment variables
    cat > .env << ENVFILE
ECR_REGISTRY=$ECR_REGISTRY
IMAGE_TAG=$IMAGE_TAG
ENVIRONMENT=$ENVIRONMENT
AWS_REGION=$AWS_REGION
NODE_ENV=production
ENVFILE
    chmod 600 .env
fi

echo -e "${GREEN}Pulling latest images (tag: $IMAGE_TAG)...${NC}"

# Pull images explicitly
docker pull "$ECR_REGISTRY/milky-way-api:$IMAGE_TAG"
docker pull "$ECR_REGISTRY/milky-way-web-admin:$IMAGE_TAG"

# Show what images we're about to use
echo -e "${GREEN}Images to be deployed:${NC}"
docker images | grep milky-way | head -n 5

# Stop existing containers gracefully
echo -e "${GREEN}Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down --timeout 30 || true

# Run database migrations
echo -e "${GREEN}Running database migrations...${NC}"
docker-compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy || echo -e "${YELLOW}Migration warning - check logs${NC}"

# Start services with new images
echo -e "${GREEN}Starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo -e "${GREEN}Waiting for services to start...${NC}"
sleep 30

# Check API health
echo -e "${GREEN}Checking API health...${NC}"
if curl -f http://localhost:4000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API is healthy${NC}"
else
    echo -e "${RED}✗ API health check failed${NC}"
    docker-compose -f docker-compose.prod.yml logs --tail=50 api
    exit 1
fi

# Check Web health
echo -e "${GREEN}Checking Web health...${NC}"
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Web is healthy${NC}"
else
    echo -e "${RED}✗ Web health check failed${NC}"
    docker-compose -f docker-compose.prod.yml logs --tail=50 web
    exit 1
fi

# Show running containers
echo -e "${GREEN}Running containers:${NC}"
docker-compose -f docker-compose.prod.yml ps

# Clean up old images
echo -e "${GREEN}Cleaning up old images...${NC}"
docker image prune -f

echo -e "${GREEN}Deployment completed successfully!${NC}"
