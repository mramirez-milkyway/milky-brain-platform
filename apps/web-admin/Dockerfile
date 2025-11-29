# Production-ready multi-stage Dockerfile for Next.js Web Admin App in Turborepo monorepo

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy root package files and lockfile
COPY package*.json ./
COPY turbo.json ./

# Copy workspace package files
COPY apps/web-admin/package*.json ./apps/web-admin/

# Install dependencies for the entire monorepo with workspace support
RUN npm ci --workspaces=false && \
    cd apps/web-admin && \
    npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Enable corepack for package manager
RUN corepack enable

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web-admin/node_modules ./apps/web-admin/node_modules
COPY --from=deps /app/package*.json ./

# Copy workspace files
COPY turbo.json ./
COPY apps/web-admin ./apps/web-admin/

# Set environment variable for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application
WORKDIR /app/apps/web-admin
# Run build (node_modules is already in place)
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy root node_modules (contains all dependencies)
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nextjs:nodejs /app/package*.json ./

# Copy Web Admin-specific files
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-admin/.next ./apps/web-admin/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-admin/public ./apps/web-admin/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-admin/package.json ./apps/web-admin/
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-admin/next.config.ts ./apps/web-admin/

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

WORKDIR /app/apps/web-admin

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["npm", "start"]
