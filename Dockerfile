# Use the official Node.js runtime as base image
FROM node:18-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Create app directory and set ownership
RUN mkdir -p /app && chown -R node:node /app

# Set working directory
WORKDIR /app

# Switch to node user for better security and to avoid permission issues
USER node

# Copy package files for dependency installation (with proper ownership)
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=node:node web/package.json ./web/

# Copy Prisma schema file before installing dependencies
COPY --chown=node:node web/prisma ./web/prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code with proper ownership
COPY --chown=node:node . .

# Change to web directory for build commands
WORKDIR /app/web

# Generate Prisma client
RUN pnpm run postinstall

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

# Build the Next.js application
# RUN pnpm run build

# Expose the port Next.js runs on
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"] 