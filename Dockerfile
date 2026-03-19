# Pinterest Pin Generator - Dockerfile for Coolify Deployment
# Node.js with canvas dependencies (Cairo, Pango, etc.)

FROM node:20-slim

# Install system dependencies for canvas and sharp
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libpixman-1-dev \
    pkg-config \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy fonts directory
COPY fonts/ ./fonts/

# Copy application files
COPY server.js ./
COPY config.json ./

# Copy public directory
COPY public/ ./public/

# Create uploads directory
RUN mkdir -p uploads/pinterest-pins

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Health check using curl (more reliable in containers)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3001}/api/health || exit 1

# Run the application
CMD ["node", "server.js"]
