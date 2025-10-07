# Development stage
FROM node:18-alpine AS development
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]

# Production build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies without optional native binaries
RUN npm ci --no-optional

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