# Build stage
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install -g @nestjs/cli && npm ci

COPY . .
RUN npm run build

# Development stage
FROM node:22-alpine AS dev

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install -g @nestjs/cli && \
    npm ci

COPY . .

# Production stage
FROM node:22-alpine AS prod

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /usr/src/app/dist ./dist

USER node
CMD ["npm", "run", "start:prod"]
