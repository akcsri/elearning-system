# syntax=docker/dockerfile:1
# Node.js 20 (LTS) slim image for elearning-system
FROM node:20-slim

# Install tini for proper signal handling (graceful shutdown on Fly deploy)
RUN apt-get update \
    && apt-get install -y --no-install-recommends tini ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Use Node production env by default (can be overridden at runtime)
ENV NODE_ENV=production \
    PORT=8080

# Copy dependency manifests first for better layer caching
COPY package.json package-lock.json* ./

# Install only production deps (omit devDependencies like nodemon)
# package-lock.json should exist on main branch; if not, falls back to `npm install`
RUN if [ -f package-lock.json ]; then \
        npm ci --omit=dev; \
    else \
        npm install --omit=dev; \
    fi \
    && npm cache clean --force

# Copy the rest of the source
COPY . .

# Expose port used by Fly's http_service.internal_port (see fly.toml)
EXPOSE 8080

# Use tini as PID 1 so SIGTERM from Fly gracefully stops the process
ENTRYPOINT ["/usr/bin/tini", "--"]

# server-postgres.js is the entry (package.json main / start script)
CMD ["node", "server-postgres.js"]
