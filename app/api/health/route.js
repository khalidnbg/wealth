import { NextResponse } from "next/server";
import { performHealthCheck, checkEnvironmentVariables } from "@/lib/env-check";

export async function GET() {
  try {
    // Perform comprehensive health check
    const healthCheck = await performHealthCheck();

    // Return appropriate status code based on health
    const status = healthCheck.overall_status === 'healthy' ? 200 : 503;

    return NextResponse.json(healthCheck, { status });
  } catch (error) {
    // If health check itself fails, return basic error info
    const errorResponse = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      overall_status: 'error',
      error: {
        message: error.message,
        name: error.name,
      },
      basic_env_check: checkEnvironmentVariables(),
    };

    console.error("Health check failed:", error);

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
