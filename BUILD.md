# AI Code Agent - Build Guide

This document explains how to build the AI Code Agent application for different environments.

## Build Scripts Overview

### Basic Build Scripts
- `build.bat` / `build.sh` - Basic development build
- `build-frontend.bat` - Frontend-only build
- `build-prod.bat` - Basic production build

### Advanced Build Scripts with API Configuration
- `build-prod-api.bat` / `build-prod-api.sh` - Production build with API URL configuration
- `build-with-api.bat` / `build-with-api.sh` - Custom API URL build wrapper

## Environment Configuration

### Frontend Environment Variables

The frontend uses Vite environment variables:

- `VITE_API_BASE_URL` - Base URL for API calls

### Environment Files

- `frontend/.env.development` - Development environment (default: `http://localhost:9090/api`)
- `frontend/.env.production` - Production environment (default: `/api`)
- `frontend/.env.example` - Template with examples

## Build Commands

### 1. Development Build
```bash
# Windows
build.bat

# Linux/Mac
./build.sh
```

### 2. Production Build with Default API URL
```bash
# Windows
build-prod-api.bat

# Linux/Mac
./build-prod-api.sh
```
Default API URL: `/api` (for nginx proxy)

### 3. Production Build with Custom API URL
```bash
# Windows
build-with-api.bat https://api.yourdomain.com/api

# Linux/Mac
./build-with-api.sh https://api.yourdomain.com/api
```

### 4. Environment Variable Override
```bash
# Windows
set API_BASE_URL=https://api.example.com/api && build-prod-api.bat

# Linux/Mac
API_BASE_URL=https://api.example.com/api ./build-prod-api.sh
```

## Common API URL Configurations

### Local Development
```
VITE_API_BASE_URL=http://localhost:9090/api
```

### Production with Nginx Proxy
```
VITE_API_BASE_URL=/api
```

### Production with External API
```
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### Production with Different Port
```
VITE_API_BASE_URL=http://your-server.com:8080/api
```

## Build Outputs

### Frontend
- Location: `frontend/dist/`
- Contains: Static files ready for web server deployment

### Backend
- Docker Image: `ai-code-agent-backend:latest`
- Contains: Go application with all dependencies

### Configuration Files
- `nginx.prod.conf` - Nginx configuration with API proxy
- `.env.prod.example` - Production environment template
- `docker-compose.prod.yml` - Production Docker Compose setup

## Deployment

### Using Docker Compose (Recommended)
1. Run production build:
   ```bash
   build-prod-api.bat
   ```

2. Copy environment template:
   ```bash
   copy .env.prod.example .env
   ```

3. Edit `.env` with your configuration

4. Deploy:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Manual Deployment
1. Build frontend:
   ```bash
   build-frontend.bat
   ```

2. Deploy `frontend/dist/` to your web server

3. Configure web server to proxy `/api/*` to your backend

4. Build and run backend separately

## Troubleshooting

### TypeScript Errors
- Ensure `frontend/src/vite-env.d.ts` exists
- Check `frontend/tsconfig.json` includes `"types": ["vite/client"]`

### Docker Issues
- Ensure Docker Desktop is running
- Check Docker daemon is accessible

### API Connection Issues
- Verify `VITE_API_BASE_URL` matches your backend URL
- Check CORS configuration on backend
- Ensure API endpoints are accessible

### Build Performance
- Frontend bundle size warning is normal for development
- Consider code splitting for production optimization

## Examples

### Development Setup
```bash
# Build for local development
build.bat

# Frontend will use: http://localhost:9090/api
# Backend runs on: http://localhost:9090
```

### Production with Load Balancer
```bash
# Build with load balancer API URL
build-with-api.bat https://api-lb.company.com/api

# Deploy using generated docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d
```

### Staging Environment
```bash
# Build for staging
set API_BASE_URL=https://staging-api.company.com/api && build-prod-api.bat

# Deploy to staging infrastructure
```

## File Structure After Build

```
project/
├── frontend/
│   ├── dist/                 # Built frontend files
│   ├── .env.production.local # Generated environment config
│   └── ...
├── backend/
│   └── Dockerfile           # Backend container definition
├── docker-compose.prod.yml  # Production deployment config
├── nginx.prod.conf          # Nginx configuration
├── .env.prod.example        # Environment template
└── BUILD.md                 # This file
```