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

# Set build arguments for environment variables
ARG NEXT_PUBLIC_HOST
ARG NEXT_PUBLIC_SHOPIFY_API_KEY
ARG NEXT_PUBLIC_S3_DOMAIN=tryonmagic.s3.ap-southeast-1.wasabisys.com
ARG SHOPIFY_API_KEY
ARG SHOPIFY_API_SECRET
ARG HOST=localhost:3000

# Set environment variables for build
ENV NEXT_PUBLIC_HOST=$NEXT_PUBLIC_HOST
ENV NEXT_PUBLIC_SHOPIFY_API_KEY=$NEXT_PUBLIC_SHOPIFY_API_KEY
ENV NEXT_PUBLIC_S3_DOMAIN=$NEXT_PUBLIC_S3_DOMAIN
ENV SHOPIFY_API_KEY=$SHOPIFY_API_KEY
ENV SHOPIFY_API_SECRET=$SHOPIFY_API_SECRET
ENV HOST=$HOST

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

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the app
CMD ["node", "server.js"]
