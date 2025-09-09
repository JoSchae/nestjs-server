# Build stage
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copy package files and install dependencies with optimizations
COPY package*.json ./
RUN npm ci --include=dev --ignore-scripts --no-audit --no-fund && \
    npm install -g @nestjs/cli

# Copy source and build
COPY . .
RUN npm run build

# Development stage
FROM node:22-alpine AS dev

WORKDIR /usr/src/app

# Install dependencies for development
COPY package*.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund && \
    npm install -g @nestjs/cli

COPY . .

# Production stage
FROM node:22-alpine AS prod

WORKDIR /usr/src/app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Create non-root user and set ownership
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /usr/src/app

USER nestjs
CMD ["npm", "run", "start:prod"]
