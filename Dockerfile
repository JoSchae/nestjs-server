# Use the official Node.js 20-alpine image as the base image
FROM node:18.19.1-alpine AS builder

# Set the working directory
WORKDIR /app

RUN npm i -g @nestjs/cli

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --verbose

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# Use a smaller base image for the production build
FROM node:18.19.1-alpine

# Set the working directory
WORKDIR /app

RUN npm i -g @nestjs/cli

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm i --production --verbose

# Copy the build files from the builder stage
COPY --from=builder /app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
