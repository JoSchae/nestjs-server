#!/bin/bash

# Server Setup Script for NestJS Production Deployment
# This script sets up the production environment on a fresh server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_error "Please do not run this script as root"
        exit 1
    fi
}

# Function to install Docker
install_docker() {
    print_status "Installing Docker..."
    
    # Update package index
    sudo apt-get update
    
    # Install packages to allow apt to use a repository over HTTPS
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package index again
    sudo apt-get update
    
    # Install Docker Engine
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    print_success "Docker installed successfully"
    print_warning "Please log out and back in for Docker group membership to take effect"
}

# Function to install Cloudflared
install_cloudflared() {
    print_status "Installing Cloudflared..."
    
    # Download and install cloudflared
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i cloudflared-linux-amd64.deb
    rm cloudflared-linux-amd64.deb
    
    print_success "Cloudflared installed successfully"
}

# Function to setup SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificate directories..."
    
    # Create SSL directories
    sudo mkdir -p /etc/ssl/certs
    sudo mkdir -p /etc/ssl/private
    
    print_success "SSL directories created"
    print_warning "Please place your Cloudflare origin certificates in:"
    print_warning "  - /etc/ssl/certs/cloudflare-origin-fullchain.pem"
    print_warning "  - /etc/ssl/private/cloudflare-origin.key"
}

# Function to setup project directory
setup_project() {
    print_status "Setting up project directory..."
    
    # Create project directory
    mkdir -p ~/nestjs-server
    cd ~/nestjs-server
    
    # Download necessary files from repository
    print_status "Downloading docker-compose files..."
    
    # Create basic docker-compose.prod.pull.yml if it doesn't exist
    if [ ! -f "docker-compose.prod.pull.yml" ]; then
        cat > docker-compose.prod.pull.yml << 'EOF'
services:
    nestjs:
        image: johannesschaefer/nestjs:prod
        command: npm run start:prod
        container_name: nestjs
        env_file:
            - .env
        depends_on:
            mongodb:
                condition: service_healthy
        networks:
            - app-network

    mongodb:
        image: johannesschaefer/mongodb:prod
        container_name: mongodb
        env_file:
            - .env
        environment:
            - MONGO_INITDB_ROOT_USERNAME=${MONGO_INITDB_ROOT_USERNAME}
            - MONGO_INITDB_ROOT_PASSWORD=${MONGO_INITDB_ROOT_PASSWORD}
            - MONGO_INITDB_DATABASE=${MONGO_DB_DATABASE}
        volumes:
            - mongodb_data:/data/db/
            - mongodb_log:/var/log/mongodb/
        networks:
            - app-network
        healthcheck:
            test: ['CMD', 'mongosh', '--eval', "db.adminCommand('ping')"]
            interval: 10s
            timeout: 5s
            retries: 5
            start_period: 30s

    nginx:
        image: johannesschaefer/nginx:prod
        container_name: nginx
        ports:
            - '80:80'
            - '443:443'
        volumes:
            - /etc/ssl/certs/cloudflare-origin-fullchain.pem:/etc/ssl/certs/cloudflare-origin-fullchain.pem:ro
            - /etc/ssl/private/cloudflare-origin.key:/etc/ssl/private/cloudflare-origin.key:ro
        networks:
            - app-network
        depends_on:
            - nestjs

volumes:
    mongodb_data:
    mongodb_log:

networks:
    app-network:
        driver: bridge
EOF
    fi
    
    # Create environment template
    if [ ! -f ".env.prod" ]; then
        print_warning "Creating production environment file from template..."
        if [ -f ".env.prod.template" ]; then
            cp .env.prod.template .env.prod
            print_warning "IMPORTANT: Please edit .env.prod file with your actual production values!"
            print_warning "Use: nano .env.prod"
        else
            print_error ".env.prod.template not found. Please create .env.prod manually."
        fi
    else
        print_status ".env.prod file already exists"
    fi
    
    print_success "Project directory setup completed"
}

# Function to create environment file
create_env_file() {
    if [ ! -f ".env.prod" ]; then
        print_warning "Creating production environment file from template..."
        if [ -f ".env.prod.template" ]; then
            cp .env.prod.template .env.prod
            print_warning "IMPORTANT: Please edit .env.prod file with your actual production values!"
            print_warning "Use: nano .env.prod"
        else
            print_error ".env.prod.template not found. Please create .env.prod manually."
        fi
    else
        print_status ".env.prod file already exists"
    fi
}

# Function to setup systemd service for automatic startup
setup_systemd_service() {
    print_status "Setting up systemd service..."
    
    cat > nestjs-server.service << EOF
[Unit]
Description=NestJS Server
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$HOME/nestjs-server
ExecStart=/usr/bin/docker compose -f docker-compose.prod.pull.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.pull.yml down
User=$USER
Group=docker

[Install]
WantedBy=multi-user.target
EOF
    
    sudo mv nestjs-server.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable nestjs-server.service
    
    print_success "Systemd service created and enabled"
}

# Main setup function
main() {
    print_status "Starting server setup for NestJS production deployment..."
    echo ""
    
    check_root
    
    # Check if Docker is already installed
    if ! command -v docker >/dev/null 2>&1; then
        install_docker
        echo ""
        print_warning "Please log out and back in, then run this script again to continue setup"
        exit 0
    else
        print_success "Docker is already installed"
    fi
    
    # Check if Cloudflared is already installed
    if ! command -v cloudflared >/dev/null 2>&1; then
        install_cloudflared
        echo ""
    else
        print_success "Cloudflared is already installed"
    fi
    
    setup_ssl
    echo ""
    
    setup_project
    echo ""
    
    create_env_file
    echo ""
    
    setup_systemd_service
    echo ""
    
    print_success "Server setup completed!"
    echo ""
    print_status "Next steps:"
    print_status "1. Edit .env.prod file with your actual values: nano .env.prod"
    print_status "2. Place your Cloudflare origin certificates in /etc/ssl/certs/ and /etc/ssl/private/"
    print_status "3. Setup your Cloudflare tunnel to point to localhost:80 and localhost:443"
    print_status "4. Run the deployment script: ./deploy-production.sh"
    print_status "5. Start the service on boot: sudo systemctl start nestjs-server"
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Server Setup Script for NestJS Production Deployment"
        echo ""
        echo "Usage: $0 [OPTION]"
        echo ""
        echo "This script will:"
        echo "  - Install Docker and Docker Compose"
        echo "  - Install Cloudflared"
        echo "  - Setup SSL certificate directories"
        echo "  - Create project directory and configuration files"
        echo "  - Setup systemd service for automatic startup"
        echo ""
        echo "Options:"
        echo "  --help, -h    Show this help message"
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
