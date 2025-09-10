# Dockerfile for MongoDB 4.4.18 (ARM-compatible)

# dockerfiles/mongo-old/Dockerfile
FROM mongo:4.4.18


# Remove existing MongoDB repository with expired key, then add new one
RUN rm -f /etc/apt/sources.list.d/mongodb-org-*.list && \
    apt-get update && \
    apt-get install -y curl gnupg && \
    curl -fsSL https://pgp.mongodb.com/server-4.4.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-archive-keyring.gpg && \
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-archive-keyring.gpg ] http://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list

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
