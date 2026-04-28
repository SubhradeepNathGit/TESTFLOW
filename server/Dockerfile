# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy the server package files
COPY server/package*.json ./server/

# Install dependencies
RUN cd server && npm ci

# Copy the server source code
COPY server/ ./server/

# Copy the swagger.yaml from the root context
COPY swagger.yaml ./

# Stage 2: Production stage
FROM node:20-alpine

# Install production dependencies
WORKDIR /usr/src/app

COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /usr/src/app/server ./server
COPY --from=builder /usr/src/app/swagger.yaml ./

WORKDIR /usr/src/app/server

# Expose the application port
EXPOSE 3006

# Start the application
CMD ["node", "app.js"]
