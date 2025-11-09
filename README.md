# NestJS Server

Production-ready NestJS REST API with MongoDB, complete authentication system, and Docker deployment.

## Features

**Authentication & Authorization**
- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Permission-based guards
- Local and JWT strategies

**User Management**
- User CRUD operations
- Password hashing with bcrypt
- Profile management

**Monitoring & Performance**
- Prometheus metrics integration
- Custom metrics tracking
- Request logging
- Cache management with Redis-compatible layer

**Security**
- Helmet for security headers
- Rate limiting and throttling
- Input validation and sanitization
- Environment-based configuration

**Infrastructure**
- Docker containerization (multi-arch: AMD64/ARM64)
- Nginx reverse proxy
- MongoDB database
- Cloudflare tunnel support
- GitHub Actions CI/CD pipeline

## Quick Start

```bash
# Development
docker compose -f docker-compose.base.yml -f docker-compose.dev.yml up

# Edit .env.prod with your production values
nano .env.prod
# Then run
docker compose -f docker-compose.base.yml -f docker-compose.prod.yml up -d
```

### Helpful Aliases
```bash
alias dockerdown="docker compose down --remove-orphans"
alias dockerdev="docker compose -f docker-compose.base.yml -f docker-compose.dev.yml"
alias dockerprod="docker compose -f docker-compose.base.yml -f docker-compose.prod.yml"
```

