# Stage 1: Build stage
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Set environment variables for build
ARG VITE_API_BASE_URL=/api
ARG VITE_API_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM nginx:stable-alpine

# Copy the build output to replace the default nginx contents
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy the custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
