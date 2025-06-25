FROM node:18-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY web/package.json web/pnpm-lock.yaml ./web/

# Install dependencies with optimizations
RUN pnpm install --frozen-lockfile --shamefully-hoist --ignore-scripts --prod=false

# Copy source code (excluding node_modules and build artifacts)
COPY . .

# Set build arguments for environment variables (only what's needed during build)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_S3_DOMAIN
ARG NEXT_PUBLIC_IMAGE_PROXY_URL
ARG NEXT_PUBLIC_SHOPIFY_CLIENT_ID
ARG HOST

# Set environment variables for build (only what's needed during build)
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_S3_DOMAIN=$NEXT_PUBLIC_S3_DOMAIN
ENV NEXT_PUBLIC_IMAGE_PROXY_URL=$NEXT_PUBLIC_IMAGE_PROXY_URL
ENV NEXT_PUBLIC_SHOPIFY_CLIENT_ID=$NEXT_PUBLIC_SHOPIFY_CLIENT_ID
ENV HOST=$HOST
ENV NODE_ENV=production

# Build Next.js app and verify standalone output
RUN cd web && \
    echo "Building Next.js application..." && \
    pnpm build && \
    echo "Build completed. Checking for standalone output..." && \
    ls -la .next/ && \
    if [ ! -d ".next/standalone" ]; then \
    echo "ERROR: Standalone output not found! Make sure output: 'standalone' is set in next.config.js"; \
    exit 1; \
    fi && \
    echo "Standalone output found successfully"

# --- Production image ---
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy standalone output and verify it exists
COPY --from=base --chown=nextjs:nodejs /app/web/.next/standalone ./
COPY --from=base --chown=nextjs:nodejs /app/web/.next/static ./web/.next/static
COPY --from=base --chown=nextjs:nodejs /app/web/public ./web/public

# Copy Shopify app configuration
COPY --from=base --chown=nextjs:nodejs /app/shopify.app.toml ./shopify.app.toml

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables for runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the app
CMD ["node", "server.js"]