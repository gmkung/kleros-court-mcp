# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy compiled source code
COPY dist/ ./dist/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S kleros -u 1001

# Change ownership of the app directory
RUN chown -R kleros:nodejs /app
USER kleros

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start the server
CMD ["node", "dist/index.js"]