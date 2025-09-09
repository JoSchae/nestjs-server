# ./nginx/Dockerfile
FROM nginx:latest

# Set default NODE_ENV if not provided
ARG NODE_ENV=dev

# Copy the appropriate nginx configuration
COPY ./nginx/nginx.${NODE_ENV}.conf /etc/nginx/nginx.conf
