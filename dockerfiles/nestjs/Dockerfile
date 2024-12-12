FROM node:18.19.1-alpine AS builder

WORKDIR /usr/src/app

# Copy package files first
COPY package*.json ./

# Install all dependencies including dev
RUN npm install

# Copy rest of the code
COPY . .

# Build the application
RUN npm run build

# Start new stage for production
FROM node:18.19.1-alpine

ARG NODE_ENV=dev
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built application
COPY --from=builder /usr/src/app/dist ./dist

CMD ["node", "dist/main"]
