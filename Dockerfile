# Development stage
FROM node:20-alpine AS development
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache g++ make python3

# Copy package files
COPY package*.json ./

# Remove package-lock.json if it exists and do fresh install with explicit rollup binary
RUN rm -f package-lock.json && \
    npm cache clean --force && \
    npm install --force && \
    npm install --force @rollup/rollup-linux-x64-musl

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Production build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache g++ make python3

# Copy package files
COPY package*.json ./

# Clean install all dependencies
RUN npm cache clean --force && \
    npm install

# Copy source and build
COPY . .
RUN npm run build

# Production stage - serve built app with nginx
FROM nginx:stable-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config to serve on port 3000
RUN echo 'server { \
    listen 3000; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html; \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]