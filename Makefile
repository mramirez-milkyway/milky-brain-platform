.PHONY: help install dev build test clean migrate db-init infra-init infra-plan infra-apply infra-destroy

help:
	@echo "Milky Way Admin Panel - Available Commands"
	@echo ""
	@echo "Installation & Setup:"
	@echo "  make install       - Install all dependencies"
	@echo "  make dev           - Start development environment (docker-compose)"
	@echo "  make build         - Build all apps"
	@echo ""
	@echo "Database:"
	@echo "  make migrate       - Run database migrations"
	@echo "  make db-init       - Initialize database with default roles/policies"
	@echo "  make db-reset      - Reset database (WARNING: destroys all data)"
	@echo "  make db-studio     - Open Prisma Studio"
	@echo ""
	@echo "Development:"
	@echo "  make api           - Run API server locally"
	@echo "  make web           - Run web frontend locally"
	@echo "  make web-admin     - Run web-admin (TailAdmin V2) frontend locally"
	@echo ""
	@echo "Infrastructure (Terraform):"
	@echo "  make infra-init ENV=qa       - Initialize Terraform for environment"
	@echo "  make infra-plan ENV=qa       - Plan infrastructure changes"
	@echo "  make infra-apply ENV=qa      - Apply infrastructure changes"
	@echo "  make infra-destroy ENV=qa    - Destroy infrastructure (WARNING: destructive)"
	@echo "  make infra-output ENV=qa     - Show infrastructure outputs"
	@echo "  make sync-secrets ENV=qa     - Sync .env secrets to AWS Secrets Manager"
	@echo "  make deploy-qa               - Quick deploy to QA"
	@echo "  make deploy-prod             - Quick deploy to Production"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build-api        - Build API Docker image"
	@echo "  make docker-build-web        - Build Web Docker image"
	@echo "  make docker-build-all        - Build all Docker images"
	@echo "  make docker-push-api         - Push API image to ECR"
	@echo "  make docker-push-web         - Push Web image to ECR"
	@echo "  make docker-push-all         - Push all images to ECR"
	@echo ""
	@echo "Lambda Functions:"
	@echo "  make lambda-build            - Build Lambda job processor"
	@echo "  make lambda-deploy ENV=qa    - Deploy Lambda to environment"
	@echo "  make lambda-logs ENV=qa      - Tail Lambda logs"
	@echo ""
	@echo "LocalStack (Local Development):"
	@echo "  make localstack-up           - Start LocalStack"
	@echo "  make localstack-setup        - Setup LocalStack infrastructure (Terraform)"
	@echo "  make localstack-test         - Test LocalStack infrastructure"
	@echo "  make localstack-destroy      - Destroy LocalStack infrastructure"
	@echo "  make localstack-logs         - View LocalStack logs"
	@echo "  make localstack-restart      - Restart LocalStack"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  make test          - Run all tests"
	@echo "  make lint          - Lint all code"
	@echo "  make format        - Format all code"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean         - Clean temporary files"
	@echo "  make docker-clean  - Clean Docker containers and volumes"

install:
	@echo "Installing dependencies..."
	npm install
	@echo "Done!"

dev:
	@echo "Starting development environment..."
	npm run dev

build:
	@echo "Building all apps..."
	npm run build

api:
	@echo "Starting API server..."
	cd apps/api && npm run dev

web:
	@echo "Starting web frontend..."
	cd apps/web && npm run dev

web-admin:
	@echo "Starting web-admin (TailAdmin V2) frontend..."
	cd apps/web-admin && npm run dev

migrate:
	@echo "Running database migrations..."
	cd apps/api && npx prisma migrate dev

db-init:
	@echo "Initializing database with default roles and policies..."
	cd apps/api && npx ts-node -e "import { PrismaClient } from '@prisma/client'; import { RbacService } from './src/common/services/rbac.service'; const prisma = new PrismaClient(); const rbac = new RbacService(prisma); rbac.initializeDefaultRolesAndPolicies().then(() => { console.log('Done!'); process.exit(0); });"

db-reset:
	@echo "WARNING: This will destroy all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		docker-compose up -d postgres; \
		sleep 5; \
		$(MAKE) migrate; \
		$(MAKE) db-init; \
	fi

db-studio:
	@echo "Opening Prisma Studio..."
	cd apps/api && npx prisma studio

test:
	@echo "Running all tests..."
	npm run test

lint:
	@echo "Linting all code..."
	npm run lint

format:
	@echo "Formatting all code..."
	npm run format

clean:
	@echo "Cleaning temporary files..."
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
	@echo "Done!"

docker-clean:
	@echo "Cleaning Docker containers and volumes..."
	docker-compose down -v
	docker system prune -f
	@echo "Done!"

logs:
	docker-compose logs -f

logs-api:
	docker-compose logs -f api

logs-web:
	docker-compose logs -f web

stop:
	docker-compose down

restart:
	docker-compose restart

# Infrastructure commands
infra-init:
	@if [ -z "$(ENV)" ]; then \
		echo "Error: ENV variable is required. Usage: make infra-init ENV=qa"; \
		exit 1; \
	fi
	@echo "Initializing Terraform for $(ENV) environment..."
	cd infrastructure/environments/$(ENV) && terraform init

infra-plan:
	@if [ -z "$(ENV)" ]; then \
		echo "Error: ENV variable is required. Usage: make infra-plan ENV=qa"; \
		exit 1; \
	fi
	@echo "Planning infrastructure changes for $(ENV)..."
	cd infrastructure/environments/$(ENV) && terraform plan

infra-apply:
	@if [ -z "$(ENV)" ]; then \
		echo "Error: ENV variable is required. Usage: make infra-apply ENV=qa"; \
		exit 1; \
	fi
	@echo "Applying infrastructure changes for $(ENV)..."
	cd infrastructure/environments/$(ENV) && terraform apply

infra-destroy:
	@if [ -z "$(ENV)" ]; then \
		echo "Error: ENV variable is required. Usage: make infra-destroy ENV=qa"; \
		exit 1; \
	fi
	@echo "WARNING: This will destroy all infrastructure for $(ENV)!"
	@read -p "Are you sure? Type '$(ENV)' to confirm: " confirm; \
	if [ "$$confirm" = "$(ENV)" ]; then \
		cd infrastructure/environments/$(ENV) && terraform destroy; \
	else \
		echo "Destruction cancelled."; \
	fi

infra-output:
	@if [ -z "$(ENV)" ]; then \
		echo "Error: ENV variable is required. Usage: make infra-output ENV=qa"; \
		exit 1; \
	fi
	@cd infrastructure/environments/$(ENV) && terraform output

sync-secrets:
	@if [ -z "$(ENV)" ]; then \
		echo "Error: ENV variable is required. Usage: make sync-secrets ENV=qa"; \
		exit 1; \
	fi
	@echo "Syncing secrets to AWS Secrets Manager for $(ENV)..."
	cd infrastructure/scripts && ./sync-secrets.sh $(ENV)

# Docker commands
docker-build-api:
	@echo "Building API Docker image..."
	cd apps/api && docker build -t milky-way-admin-panel-api:latest --target production .

docker-build-web:
	@echo "Building Web Docker image..."
	cd apps/web && docker build -t milky-way-admin-panel-web:latest --target production .

docker-build-all: docker-build-api docker-build-web
	@echo "All Docker images built successfully!"

docker-push-api:
	@if [ -z "$(ECR_REGISTRY)" ]; then \
		echo "Error: ECR_REGISTRY variable is required"; \
		exit 1; \
	fi
	@echo "Pushing API image to ECR..."
	docker tag milky-way-admin-panel-api:latest $(ECR_REGISTRY)/milky-way-admin-panel-api:latest
	docker push $(ECR_REGISTRY)/milky-way-admin-panel-api:latest

docker-push-web:
	@if [ -z "$(ECR_REGISTRY)" ]; then \
		echo "Error: ECR_REGISTRY variable is required"; \
		exit 1; \
	fi
	@echo "Pushing Web image to ECR..."
	docker tag milky-way-admin-panel-web:latest $(ECR_REGISTRY)/milky-way-admin-panel-web:latest
	docker push $(ECR_REGISTRY)/milky-way-admin-panel-web:latest

docker-push-all: docker-push-api docker-push-web
	@echo "All Docker images pushed successfully!"

# Quick deployment commands
deploy-qa: docker-build-all
	@echo "Deploying to QA environment..."
	@echo "Note: Ensure ECR_REGISTRY is set and you're authenticated with ECR"
	@if [ -z "$(ECR_REGISTRY)" ]; then \
		echo "Error: ECR_REGISTRY variable is required"; \
		echo "Example: make deploy-qa ECR_REGISTRY=123456789.dkr.ecr.eu-south-2.amazonaws.com"; \
		exit 1; \
	fi
	$(MAKE) docker-push-all ECR_REGISTRY=$(ECR_REGISTRY)
	@echo "Images pushed. Deploy via GitHub Actions or SSH to EC2 and run /opt/app/deploy.sh"

# Lambda commands
lambda-build:
	@echo "Building Lambda function..."
	cd lambdas/job-processor && npm install && npm run build

lambda-deploy:
	@if [ -z "$(ENV)" ]; then \
		echo "Error: ENV variable is required. Usage: make lambda-deploy ENV=qa"; \
		exit 1; \
	fi
	@echo "Deploying Lambda to $(ENV) environment..."
	cd lambdas/job-processor && \
	aws lambda update-function-code \
		--function-name $(ENV)-milky-way-admin-panel-job-processor \
		--zip-file fileb://lambda.zip \
		--region eu-south-2

lambda-logs:
	@if [ -z "$(ENV)" ]; then \
		echo "Error: ENV variable is required. Usage: make lambda-logs ENV=qa"; \
		exit 1; \
	fi
	@echo "Tailing Lambda logs for $(ENV)..."
	aws logs tail /aws/lambda/$(ENV)-milky-way-admin-panel-job-processor --follow --region eu-south-2

deploy-prod: docker-build-all
	@echo "Deploying to Production environment..."
	@echo "Note: Ensure ECR_REGISTRY is set and you're authenticated with ECR"
	@if [ -z "$(ECR_REGISTRY)" ]; then \
		echo "Error: ECR_REGISTRY variable is required"; \
		echo "Example: make deploy-prod ECR_REGISTRY=123456789.dkr.ecr.eu-south-2.amazonaws.com"; \
		exit 1; \
	fi
	$(MAKE) docker-push-all ECR_REGISTRY=$(ECR_REGISTRY)
	@echo "Images pushed. Deploy via GitHub Actions or SSH to EC2 and run /opt/app/deploy.sh"

# LocalStack commands
localstack-up:
	@echo "Starting LocalStack..."
	docker-compose up -d localstack
	@echo "Waiting for LocalStack to be healthy..."
	@docker-compose ps localstack | grep -q "healthy" && echo "✅ LocalStack is ready!" || \
		(echo "Waiting for health check..." && sleep 5 && \
		docker-compose ps localstack | grep -q "healthy" && echo "✅ LocalStack is ready!" || \
		(echo "Still starting..." && sleep 10 && \
		docker-compose ps localstack | grep -q "healthy" && echo "✅ LocalStack is ready!" || \
		(echo "❌ LocalStack health check failed. Check logs with: make localstack-logs" && docker-compose logs --tail=50 localstack)))

localstack-setup:
	@echo "Setting up LocalStack infrastructure..."
	@bash scripts/setup-localstack.sh

localstack-test:
	@echo "Testing LocalStack infrastructure..."
	@bash scripts/test-localstack.sh

localstack-destroy:
	@echo "Destroying LocalStack infrastructure..."
	cd infrastructure/environments/local && terraform destroy -auto-approve
	@echo "✅ LocalStack infrastructure destroyed"

localstack-logs:
	@echo "Viewing LocalStack logs..."
	docker-compose logs -f localstack

localstack-restart:
	@echo "Restarting LocalStack..."
	docker-compose restart localstack
	@echo "Waiting for LocalStack to be ready..."
	@for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do \
		if curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then \
			echo "✅ LocalStack is ready!"; \
			exit 0; \
		fi; \
		echo "  Attempt $$i/20..."; \
		sleep 3; \
	done; \
	echo "❌ LocalStack failed to start after 60 seconds"; \
	exit 1
