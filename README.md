# NestJS Server

A full-stack NestJS application with MongoDB, Nginx, and complete CI/CD pipeline.

## 🚀 Quick Deployment

For complete deployment instructions, see **[DEPLOYMENT.md](DEPLOYMENT.md)**

### TL;DR
1. **Push code** → GitHub Actions builds & pushes Docker images
2. **Run on server**: `./deploy-production.sh`
3. **Access via** → Your Cloudflare tunnel domain

## Features

- User Authentication with JWT
- MongoDB Integration
- Cloudflare Tunnel Support
- Docker Containerization
- Nginx Reverse Proxy
- Automated CI/CD Pipeline
- Multi-architecture builds (AMD64/ARM64)

## Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Start with local MongoDB
npm run start:local

# Or use Docker Compose (includes nginx)
docker-compose -f docker-compose.local.yml up
```

### Production Deployment
```bash
# On production server
cp .env.prod.template .env.prod  # Fill with production values
./deploy-production.sh          # Deploy with .env.prod
```

## Prerequesites

- Unix-System
- Docker-Account
- Cloudflare-Account
- Github-Account

## Development Breakdown

- Whenever you push a commit into the repository, github-workflows activate
- If the branch is "dev" or "main", the workflow triggers a build of the containers; then pushing them into your repository
- The "dev"-branch builds docker-images with the "dev"-tag; the "main"-branch builds docker-images with the "prod"-tag.

- The local development will be available under http://localhost:3000
- The started dev containers are available under http://localhost:80
- The started prod containers connect to cloudflare and are available under your domain

## API-Endpoints

### Authentication

```
POST /auth/login
Body: { email: string, password: string }
Returns: { access_token: string }
```

### Users Management

```
POST /user/create
Body: { email: string, password: string }

GET /user/profile
Header: Authorization: Bearer {token}
```

## Docker Setup

### Standard Deployment (x86_64/AMD64)

```bash
# Development
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up
```

### ARM Deployment (Raspberry Pi 3/4/5, ARM servers)

```bash
# ARM Development
docker compose -f docker-compose.yml -f docker-compose.arm-dev.yml up

# ARM Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up

# Pull latest ARM images first (recommended)
docker compose -f docker-compose.yml -f docker-compose.arm-dev.yml -f docker-compose.arm-dev.pull.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.prod.pull.yml pull
```

### Helpful Aliases

```bash
alias dockerdown="sudo docker compose down --remove-orphans"
alias prunedocker="sudo docker system prune -a -f && sudo docker volume rm nestjs-server_mongodb_data nestjs-server_mongodb_log"
alias dockerstats="gnome-terminal -- bash -c 'docker stats; exec bash'"

# Standard x86_64 functions
function nestjspull() {
    sudo docker pull <docker-repository>/nestjs-server:"$1" && sudo docker pull <docker-repository>/mongodb:"$1" && sudo docker pull <docker-repository>/nginx:"$1"
}
function nestjsup() {
    sudo docker compose down --remove-orphans && docker compose -f docker-compose.yml -f docker-compose."${1}".yml up
}

# ARM-specific functions
function nestjspullarm() {
    sudo docker pull <docker-repository>/nestjs-server:"arm-$1" && sudo docker pull <docker-repository>/mongodb:"arm-$1" && sudo docker pull <docker-repository>/nginx:"arm-$1"
}
function nestjsuparm() {
    sudo docker compose down --remove-orphans && docker compose -f docker-compose.yml -f docker-compose.arm-"${1}".yml up
}
```

## Project Structure

```
src/
├── auth/     # Authentication
├── user/     # User management
├── shared/   # Utilities
└── config/   # Configuration
nginx/        # dev & prod configs
dockerfiles/  # Dockerfiles
mongo/        # MongoDB init-script
.github/      # github config & workflows
```

## Dependencies

- Dependencies
- NestJS Framework
- MongoDB/Mongoose
- Passport/JWT
- class-validator
- Swagger/OpenAPI
