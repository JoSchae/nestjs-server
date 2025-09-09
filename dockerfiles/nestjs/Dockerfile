# Build stage
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Install build tools required for native modules (bcrypt)
RUN apk add --no-cache python3 make g++ build-base

# Copy package files and install dependencies (allow lifecycle scripts so native modules build)
COPY package*.json ./
# Remove --ignore-scripts to allow bcrypt to compile for ARM64
RUN npm ci --include=dev --no-audit --no-fund && \
    npm install -g @nestjs/cli

# Copy source and build
COPY . .
RUN npm run build

# Development stage
FROM node:22-alpine AS dev

WORKDIR /usr/src/app

# Install dependencies for development (allow scripts for native modules)
COPY package*.json ./
RUN npm ci --no-audit --no-fund && \
    npm install -g @nestjs/cli

COPY . .

# Production stage
FROM node:22-alpine AS prod

WORKDIR /usr/src/app

# Copy production node_modules from builder so native modules are already built for the image
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy package.json (optional) and other needed files
COPY package*.json ./

# Create non-root user and set ownership
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /usr/src/app

USER nestjs
CMD ["npm", "run", "start:prod"]
