.PHONY: help install dev build test clean migrate db-init

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
