#!/bin/bash

# Production deployment script for NestJS Server
# This script pulls the latest images and starts the services

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.pull.yml"
ENV_FILE=".env.prod"
DOCKER_USERNAME="johannesschaefer"

# Function to print colored output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get docker compose command
get_docker_compose_cmd() {
    if command_exists docker-compose; then
        echo "docker-compose"
    elif docker compose version >/dev/null 2>&1; then
        echo "docker compose"
    else
        print_error "Neither 'docker-compose' nor 'docker compose' is available"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        print_error "Production environment file '$ENV_FILE' not found."
        print_warning "Please create $ENV_FILE with your production environment variables."
        print_warning "You can use .env.prod.template as a starting point:"
        print_warning "  cp .env.prod.template $ENV_FILE"
        print_warning "  nano $ENV_FILE  # Fill with your actual production values"
        exit 1
    fi
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Compose file '$COMPOSE_FILE' not found."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to pull latest images
pull_images() {
    print_status "Pulling latest Docker images..."
    
    local images=(
        "${DOCKER_USERNAME}/nestjs:prod"
        "${DOCKER_USERNAME}/mongodb:prod"
        "${DOCKER_USERNAME}/nginx:prod"
    )
    
    for image in "${images[@]}"; do
        print_status "Pulling $image..."
        if docker pull "$image"; then
            print_success "Successfully pulled $image"
        else
            print_error "Failed to pull $image"
            exit 1
        fi
    done
}

# Function to stop existing containers
stop_containers() {
    print_status "Stopping existing containers..."
    
    local compose_cmd=$(get_docker_compose_cmd)
    
    if $compose_cmd -f "$COMPOSE_FILE" ps -q | grep -q .; then
        $compose_cmd -f "$COMPOSE_FILE" down
        print_success "Stopped existing containers"
    else
        print_status "No running containers found"
    fi
}

# Function to start services
start_services() {
    print_status "Starting services..."
    
    local compose_cmd=$(get_docker_compose_cmd)
    
    # Create volumes if they don't exist
    docker volume create nestjs-server_mongodb_data 2>/dev/null || true
    docker volume create nestjs-server_mongodb_log 2>/dev/null || true
    
    # Start services
    $compose_cmd -f "$COMPOSE_FILE" up -d
    
    print_success "Services started successfully"
}

# Function to show status
show_status() {
    print_status "Checking service status..."
    
    local compose_cmd=$(get_docker_compose_cmd)
    
    echo ""
    $compose_cmd -f "$COMPOSE_FILE" ps
    echo ""
    
    # Check if all services are healthy
    local unhealthy_services=$($compose_cmd -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.Status}}" | grep -v "Up" | grep -v "Name" || true)
    
    if [ -z "$unhealthy_services" ]; then
        print_success "All services are running!"
    else
        print_warning "Some services may not be fully healthy yet. Give them a moment to start up."
    fi
}

# Function to show logs
show_logs() {
    if [ "$1" = "--logs" ] || [ "$1" = "-l" ]; then
        print_status "Showing service logs (Press Ctrl+C to exit)..."
        local compose_cmd=$(get_docker_compose_cmd)
        $compose_cmd -f "$COMPOSE_FILE" logs -f
    fi
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up unused Docker resources..."
    docker system prune -f --volumes
    print_success "Cleanup completed"
}

# Main deployment function
deploy() {
    print_status "Starting production deployment..."
    echo ""
    
    check_prerequisites
    echo ""
    
    pull_images
    echo ""
    
    stop_containers
    echo ""
    
    start_services
    echo ""
    
    # Wait a moment for services to start
    sleep 5
    
    show_status
    echo ""
    
    print_success "Deployment completed successfully!"
    print_status "Your application should be available through your Cloudflare tunnel"
    print_status "Run './deploy-production.sh --logs' to view service logs"
    print_status "Run './deploy-production.sh --status' to check service status"
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Production Deployment Script for NestJS Server"
        echo ""
        echo "Usage: $0 [OPTION]"
        echo ""
        echo "Options:"
        echo "  (no args)     Deploy the application"
        echo "  --logs, -l    Deploy and show logs"
        echo "  --status, -s  Show current service status"
        echo "  --pull, -p    Pull latest images only"
        echo "  --restart, -r Restart services"
        echo "  --stop        Stop all services"
        echo "  --cleanup, -c Cleanup unused Docker resources"
        echo "  --help, -h    Show this help message"
        ;;
    --status|-s)
        show_status
        ;;
    --pull|-p)
        pull_images
        ;;
    --restart|-r)
        stop_containers
        echo ""
        start_services
        echo ""
        show_status
        ;;
    --stop)
        stop_containers
        ;;
    --cleanup|-c)
        cleanup
        ;;
    --logs|-l)
        deploy
        show_logs --logs
        ;;
    "")
        deploy
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
