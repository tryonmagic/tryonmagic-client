# Use the latest Node.js image
FROM node:latest AS base

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace and lock files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY web/package.json web/pnpm-lock.yaml ./web/
COPY web/prisma ./web/prisma

# Install dependencies, but skip postinstall
RUN pnpm install --frozen-lockfile --shamefully-hoist --ignore-scripts

# Copy all source code
COPY . .

# Run postinstall manually (prisma generate)
RUN pnpm --filter web run postinstall

# Generate Prisma client
RUN cd web && pnpm prisma generate

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
FROM node:latest

WORKDIR /app

# Copy standalone output
COPY --from=base /app/web/.next/standalone ./
COPY --from=base /app/web/.next/static ./web/.next/static
COPY --from=base /app/web/public ./web/public

# Copy ALL node_modules from build (this is the key for pnpm/standalone)
COPY --from=base /app/node_modules ./node_modules

# Copy Prisma files if needed
COPY --from=base /app/web/prisma ./web/prisma

# Expose port
EXPOSE 3000

# Set environment variables for runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the app
CMD ["node", "server.js"]
