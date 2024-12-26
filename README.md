# NestJS Server

## Features

- User Authentication with JWT
- MongoDB Integration
- Cloudflare DDNS Support
- Docker Containerization
- Nginx Reverse Proxy

## Quick Start

```bash
# Install dependencies
npm install

# Local development with MongoDB
npm run start:local
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

```bash
# Development
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up

# helpfull aliases
alias dockerdown="sudo docker compose down --remove-orphans"
alias prunedocker="sudo docker system prune -a -f && sudo docker volume rm nestjs-server_mongodb_data nestjs-server_mongodb_log"
alias dockerstats="gnome-terminal -- bash -c 'docker stats; exec bash'"
function nestjspull() {
    sudo docker pull <docker-repository>/nestjs:"$1" && sudo docker pull <docker-repository>/mongo:"$1" && sudo docker pull <docker-repository>/nginx:"$1" && sudo docker pull <docker-repository>/cloudflare-ddns:"$1"
}
function nestjsup() {
    sudo docker compose down --remove-orphans && docker compose -f docker-compose.yml -f docker-compose."${1}".yml up
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
