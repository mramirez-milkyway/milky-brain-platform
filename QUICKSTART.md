# Quick Start Guide

## Project Structure

```
milky_way_admin_panel/
├── apps/
│   ├── admin_panel_api/          # Flask REST API
│   │   ├── app/
│   │   │   ├── models/           # Database models
│   │   │   ├── services/         # Business logic (SOLID)
│   │   │   ├── schemas/          # Request/response schemas
│   │   │   └── api/              # API routes
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── admin_panel_web/          # React frontend
│       ├── src/
│       │   ├── components/       # Reusable components
│       │   ├── pages/            # Page components
│       │   ├── services/         # API service layer
│       │   └── types/            # TypeScript types
│       ├── Dockerfile
│       └── package.json
├── libs/
│   ├── python/                   # Shared Python utilities
│   │   └── utils/
│   └── typescript/               # Shared TypeScript utilities
│       └── utils/
└── docker-compose.yml
```

## Getting Started

### 1. Start the entire stack with Docker

```bash
docker-compose up --build
```

This will start:
- PostgreSQL database on port 5432
- Flask API on http://localhost:5000
- React frontend on http://localhost:5173

### 2. Access the applications

- **Frontend**: http://localhost:5173
- **API Health Check**: http://localhost:5000/health
- **API Users Endpoint**: http://localhost:5000/api/users

### 3. Test the API

Create a user:
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe"
  }'
```

Get all users:
```bash
curl http://localhost:5000/api/users
```

## Development

### Running API locally (without Docker)

```bash
cd apps/admin_panel_api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Run the application
python run.py
```

### Running Frontend locally (without Docker)

```bash
cd apps/admin_panel_web
npm install

# Create .env file
cp .env.example .env

# Start dev server
npm run dev
```

## SOLID & DRY Principles Applied

### Backend (Flask API)

1. **Single Responsibility Principle**: Each service class handles one domain (e.g., `UserService`)
2. **Open/Closed Principle**: Base models can be extended without modification
3. **Liskov Substitution Principle**: All models inherit from `BaseModel`
4. **Interface Segregation**: Specific schemas for different operations
5. **Dependency Inversion**: Services depend on abstractions (database layer)

**DRY**: 
- `BaseModel` provides common CRUD operations
- Shared utilities in `libs/python`
- Reusable validation and formatting functions

### Frontend (React + TypeScript)

1. **Single Responsibility**: Separate services for API calls, components for UI
2. **DRY**: 
   - Centralized API configuration
   - Shared service layer for HTTP calls
   - Reusable utilities in `libs/typescript`
   - Type definitions prevent duplication

## Adding New Applications

1. Create new directory in `apps/`
2. Add Dockerfile to the new app
3. Update `docker-compose.yml` to include the new service
4. Use shared libraries from `libs/` to avoid code duplication

Example:
```yaml
new_service:
  build:
    context: ./apps/new_service
  volumes:
    - ./libs/python:/libs/python  # For Python apps
    - ./libs/typescript:/libs/typescript  # For TypeScript apps
```

## Next Steps

- Add authentication/authorization
- Implement additional models and endpoints
- Add unit and integration tests
- Set up CI/CD pipeline
- Add environment-specific configurations
- Implement logging and monitoring
