#!/bin/bash
set -e

# Cleanup function
cleanup() {
    echo "Cleaning up..."
    docker compose -f docker-compose.local.yml down -v
    exit 0
}

# Set trap for CTRL+C
trap cleanup SIGINT

# Start MongoDB in background and follow logs
echo "Starting MongoDB..."
docker compose -f docker-compose.local.yml up -d mongodb
docker compose -f docker-compose.local.yml logs -f mongodb &
LOGS_PID=$!

# Wait for container
echo "Waiting for MongoDB container..."
until CONTAINER_NAME=$(docker compose -f docker-compose.local.yml ps -q mongodb) && [ ! -z "$CONTAINER_NAME" ]; do
    sleep 2
done

# Wait for health
echo "Waiting for MongoDB health..."
until docker inspect --format="{{.State.Health.Status}}" "$CONTAINER_NAME" 2>/dev/null | grep -q "healthy"; do
    sleep 2
done

# Kill logs process
kill $LOGS_PID 2>/dev/null || true

# Export MongoDB connection for NestJS
export MONGO_DB_HOSTNAME=localhost
export MONGO_DB_PORT=27017

# Start NestJS
echo "Starting NestJS..."
npm run start:dev

# Cleanup
cleanup