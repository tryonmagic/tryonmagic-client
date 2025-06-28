import { NextResponse } from 'next/server';

export async function GET() {
  // Simple health check without external dependencies
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  };

  return NextResponse.json(healthStatus, { status: 200 });
}

export async function HEAD() {
  // Simple HEAD request for basic health check
  return new NextResponse(null, { status: 200 });
} 