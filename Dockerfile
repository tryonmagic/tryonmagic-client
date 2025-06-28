# Use the official Node.js runtime as base image
FROM node:18-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY web/package.json ./web/

# Copy Prisma schema file before installing dependencies
COPY web/prisma ./web/prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code

COPY . .

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
RUN pnpm run build

# Expose the port Next.js runs on
EXPOSE 3000

# Start the application
CMD ["pnpm", "run", "start"] 