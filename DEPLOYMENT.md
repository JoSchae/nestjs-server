# Complete CI/CD and Deployment Guide

This guide walks you through the complete setup for automatically building, pushing, and deploying your NestJS application with MongoDB and Nginx through Cloudflare tunnels.

## Overview

The deployment process consists of:

1. **Code Push** → GitHub
2. **Automatic Build** → GitHub Actions builds and pushes Docker images to Docker Hub
3. **Server Deployment** → Simple script pulls images and starts services
4. **Cloudflare Tunnel** → Makes services accessible via your domain

## Environment Files Structure

- **`.env.local`** → Local development (included in Git)
- **`.env.prod`** → Production secrets (excluded from Git, created from template)
- **`.env.prod.template`** → Production template (included in Git)

## Prerequisites

### Development Machine
- Git configured with your GitHub repository
- Docker and Docker Compose (for local testing)

### Production Server
- Ubuntu 20.04+ or similar Linux distribution
- Internet connection
- Domain configured with Cloudflare

## 1. GitHub Repository Setup

### Required Secrets

In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions** and add these secrets:

```
DOCKER_USERNAME=johannesschaefer
DOCKER_PASSWORD=your_docker_hub_password

# MongoDB Configuration
MONGO_DB_USERNAME=app_user
MONGO_DB_PASSWORD=your_secure_app_password
MONGO_DB_DATABASE=your_database_name
MONGO_DB_ADMIN_USERNAME=admin_user
MONGO_DB_ADMINUSER_PASSWORD=your_secure_admin_password
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=your_secure_root_password
MONGO_DB_METRICS_USERNAME=metrics_user
MONGO_DB_METRICS_PASSWORD=your_secure_metrics_password

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_at_least_32_characters_long
```

### Workflow Triggers

The GitHub Actions workflow automatically triggers on:
- Push to `main` branch (builds production images)
- Push to `dev` branch (builds development images)
- Manual trigger via GitHub UI

## 2. Server Setup

### Initial Server Setup

1. **Download the setup script to your server:**
   ```bash
   wget https://raw.githubusercontent.com/yourusername/nestjs-server/main/setup-server.sh
   chmod +x setup-server.sh
   ./setup-server.sh
   ```

2. **Configure environment variables:**
   ```bash
   cd ~/nestjs-server
   cp .env.prod.template .env.prod
   nano .env.prod
   ```
   Fill in all the production values in the `.env.prod` file.

3. **Setup SSL certificates:**
   - Get Cloudflare Origin Certificate from Cloudflare dashboard
   - Place certificates:
     ```bash
     sudo cp cloudflare-origin-fullchain.pem /etc/ssl/certs/
     sudo cp cloudflare-origin.key /etc/ssl/private/
     sudo chmod 644 /etc/ssl/certs/cloudflare-origin-fullchain.pem
     sudo chmod 600 /etc/ssl/private/cloudflare-origin.key
     ```

### Cloudflare Tunnel Setup

1. **Authenticate with Cloudflare:**
   ```bash
   cloudflared tunnel login
   ```

2. **Create a tunnel:**
   ```bash
   cloudflared tunnel create nestjs-server
   ```

3. **Configure the tunnel:**
   ```bash
   nano ~/.cloudflared/config.yml
   ```
   
   Add this configuration:
   ```yaml
   tunnel: <your-tunnel-id>
   credentials-file: /home/yourusername/.cloudflared/<your-tunnel-id>.json
   
   ingress:
     - hostname: your-domain.com
       service: https://localhost:443
       originRequest:
         noTLSVerify: true
     - hostname: www.your-domain.com
       service: https://localhost:443
       originRequest:
         noTLSVerify: true
     - service: http_status:404
   ```

4. **Add DNS records:**
   ```bash
   cloudflared tunnel route dns nestjs-server your-domain.com
   cloudflared tunnel route dns nestjs-server www.your-domain.com
   ```

5. **Install tunnel as service:**
   ```bash
   sudo cloudflared service install
   sudo systemctl start cloudflared
   sudo systemctl enable cloudflared
   ```

## 3. Deployment Process

### Automatic Deployment (Recommended)

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main  # or dev for development
   ```

2. **Monitor build progress:**
   - Go to GitHub → Actions tab
   - Watch the build process
   - Verify images are pushed to Docker Hub

3. **Deploy on server:**
   ```bash
   cd ~/nestjs-server
   ./deploy-production.sh
   ```

### Manual Deployment

If you need to deploy without pushing to GitHub:

```bash
# Pull specific versions
docker pull johannesschaefer/nestjs:prod
docker pull johannesschaefer/mongodb:prod
docker pull johannesschaefer/nginx:prod

# Deploy
./deploy-production.sh
```

## 4. Script Usage

### Deployment Script (`deploy-production.sh`)

```bash
# Basic deployment
./deploy-production.sh

# Deploy and show logs
./deploy-production.sh --logs

# Check service status
./deploy-production.sh --status

# Restart services
./deploy-production.sh --restart

# Stop services
./deploy-production.sh --stop

# Cleanup unused resources
./deploy-production.sh --cleanup

# Show help
./deploy-production.sh --help
```

### Server Setup Script (`setup-server.sh`)

```bash
# Run initial server setup
./setup-server.sh

# Show help
./setup-server.sh --help
```

## 5. Monitoring and Maintenance

### Check Service Status

```bash
# Using deployment script
./deploy-production.sh --status

# Using Docker directly
docker-compose -f docker-compose.prod.pull.yml ps

# Using systemd
sudo systemctl status nestjs-server
```

### View Logs

```bash
# All services
./deploy-production.sh --logs

# Specific service
docker logs nestjs
docker logs mongodb
docker logs nginx

# Cloudflare tunnel
sudo journalctl -u cloudflared -f
```

### Update Deployment

```bash
# Pull latest images and restart
./deploy-production.sh --pull
./deploy-production.sh --restart
```

## 6. Troubleshooting

### Common Issues

1. **Build failures:**
   - Check GitHub Actions logs
   - Verify all secrets are set correctly
   - Ensure Docker Hub credentials are valid

2. **Deployment failures:**
   - Check `.env` file has all required variables
   - Verify SSL certificates are in place
   - Check Docker service is running: `sudo systemctl status docker`

3. **Connectivity issues:**
   - Check Cloudflare tunnel: `sudo systemctl status cloudflared`
   - Verify DNS records are correct
   - Check nginx logs: `docker logs nginx`

4. **Database issues:**
   - Check MongoDB logs: `docker logs mongodb`
   - Verify MongoDB credentials in `.env.prod`
   - Check if MongoDB data volume is mounted correctly

### Useful Commands

```bash
# Check all containers
docker ps -a

# Check volumes
docker volume ls

# Check networks
docker network ls

# Clean up everything (⚠️ WARNING: This removes all data)
docker system prune -a --volumes

# Backup MongoDB data
docker run --rm -v nestjs-server_mongodb_data:/data/db -v $(pwd):/backup ubuntu tar czf /backup/mongodb-backup.tar.gz -C /data/db .

# Restore MongoDB data
docker run --rm -v nestjs-server_mongodb_data:/data/db -v $(pwd):/backup ubuntu tar xzf /backup/mongodb-backup.tar.gz -C /data/db
```

## 7. Security Considerations

- All sensitive data is stored in GitHub Secrets
- Environment files are excluded from Git
- SSL certificates use Cloudflare Origin certificates
- MongoDB uses authentication
- JWT secrets are securely generated
- Services run in isolated Docker network
- Regular security updates via automated builds

## 8. Production Checklist

- [ ] GitHub secrets configured
- [ ] Server setup completed
- [ ] SSL certificates installed
- [ ] Cloudflare tunnel configured
- [ ] Environment file created with secure values
- [ ] First deployment successful
- [ ] Services accessible via domain
- [ ] Monitoring setup working
- [ ] Backup strategy in place

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review logs using the provided commands
3. Verify all configuration files and environment variables
4. Test connectivity at each layer (Docker → Nginx → Cloudflare → Internet)

For additional help, check the GitHub repository's Issues section or documentation.
