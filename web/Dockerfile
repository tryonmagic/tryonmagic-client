# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.11.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Install pnpm
ARG PNPM_VERSION=10.6.2
RUN npm install -g pnpm@$PNPM_VERSION

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Define build arguments
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_IMAGE_PROXY_URL
ARG NEXT_PUBLIC_S3_DOMAIN
ARG NEXT_PUBLIC_SHOPIFY_CLIENT_ID
ARG HOST

# Set build-time environment variables
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_IMAGE_PROXY_URL=$NEXT_PUBLIC_IMAGE_PROXY_URL
ENV NEXT_PUBLIC_S3_DOMAIN=$NEXT_PUBLIC_S3_DOMAIN
ENV NEXT_PUBLIC_SHOPIFY_CLIENT_ID=$NEXT_PUBLIC_SHOPIFY_CLIENT_ID
ENV HOST=$HOST

# Copy package files first for better caching
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Copy Prisma schema
COPY prisma prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Build application
RUN pnpm run build

# Remove development dependencies
RUN pnpm prune --prod

# Final stage for app image
FROM base

WORKDIR /app

# Copy built application
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "node", "server.js" ] 