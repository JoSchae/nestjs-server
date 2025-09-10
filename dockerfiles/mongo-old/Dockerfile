# Dockerfile for MongoDB 4.4.18 (ARM-compatible)

# dockerfiles/mongo-old/Dockerfile
FROM mongo:4.4.18

# Install Node.js and npm properly
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g bcrypt && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create directory for init scripts
RUN mkdir -p /docker-entrypoint-initdb.d/node_modules

# Copy init script
COPY ./mongo/init-mongodb.js /docker-entrypoint-initdb.d/

# Create a wrapper script to set up Node.js environment
RUN echo '#!/bin/bash\n\
    export NODE_PATH=/usr/lib/node_modules\n\
    mongosh "$@"' > /usr/local/bin/mongosh-with-node && \
    chmod +x /usr/local/bin/mongosh-with-node

# Health check using wrapper
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
    CMD mongosh-with-node --eval "db.adminCommand('ping')"

# Update entrypoint to use wrapper
RUN sed -i 's/mongosh/mongosh-with-node/g' /usr/local/bin/docker-entrypoint.sh

WORKDIR /
