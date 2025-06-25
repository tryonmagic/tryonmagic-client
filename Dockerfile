# Use a smaller, more specific Node.js image
FROM node:18-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY web/package.json web/pnpm-lock.yaml ./web/

# Install dependencies with optimizations
RUN pnpm install --frozen-lockfile --shamefully-hoist --ignore-scripts --prod=false

# Copy Prisma schema for generation
COPY web/prisma ./web/prisma

# Generate Prisma client
RUN cd web && pnpm prisma generate

# Copy source code (excluding node_modules and build artifacts)
COPY . .

# Set build arguments for environment variables (only what's needed during build)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_S3_DOMAIN
ARG NEXT_PUBLIC_IMAGE_PROXY_URL
ARG NEXT_PUBLIC_SHOPIFY_CLIENT_ID
ARG API_URL
ARG SHOPIFY_API_KEY
ARG SHOPIFY_API_SECRET
ARG HOST
ARG SCOPES
ARG S3_ACCESS_ID
ARG S3_ACCESS_KEY
ARG S3_REGION
ARG S3_BUCKET
ARG S3_ENDPOINT

# Set environment variables for build (only what's needed during build)
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_S3_DOMAIN=$NEXT_PUBLIC_S3_DOMAIN
ENV NEXT_PUBLIC_IMAGE_PROXY_URL=$NEXT_PUBLIC_IMAGE_PROXY_URL
ENV NEXT_PUBLIC_SHOPIFY_CLIENT_ID=$NEXT_PUBLIC_SHOPIFY_CLIENT_ID
ENV API_URL=$API_URL
ENV SHOPIFY_API_KEY=$SHOPIFY_API_KEY
ENV SHOPIFY_API_SECRET=$SHOPIFY_API_SECRET
ENV HOST=$HOST
ENV SCOPES=$SCOPES
ENV S3_ACCESS_ID=$S3_ACCESS_ID
ENV S3_ACCESS_KEY=$S3_ACCESS_KEY
ENV S3_REGION=$S3_REGION
ENV S3_BUCKET=$S3_BUCKET
ENV S3_ENDPOINT=$S3_ENDPOINT

# Build Next.js app
RUN cd web && pnpm build

# --- Production image ---
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy standalone output
COPY --from=base --chown=nextjs:nodejs /app/web/.next/standalone ./
COPY --from=base --chown=nextjs:nodejs /app/web/.next/static ./web/.next/static
COPY --from=base --chown=nextjs:nodejs /app/web/public ./web/public

# Copy only production node_modules
COPY --from=base --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy Prisma files if needed
COPY --from=base --chown=nextjs:nodejs /app/web/prisma ./web/prisma

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables for runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Runtime environment variables (only what's needed at runtime)
ENV API_URL=$API_URL
ENV SHOPIFY_API_SECRET=$SHOPIFY_API_SECRET
ENV SCOPES=$SCOPES
ENV S3_ACCESS_ID=$S3_ACCESS_ID
ENV S3_ACCESS_KEY=$S3_ACCESS_KEY
ENV S3_REGION=$S3_REGION
ENV S3_BUCKET=$S3_BUCKET
ENV S3_ENDPOINT=$S3_ENDPOINT

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the app
CMD ["node", "server.js"]
