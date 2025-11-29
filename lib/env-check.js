/**
 * Environment checking utilities for debugging production issues
 */

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Check if required environment variables are present
 */
export function checkEnvironmentVariables() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'DATABASE_URL',
  ];

  const optionalEnvVars = [
    'ARCJET_KEY',
    'RESEND_API_KEY',
    'GOOGLE_GENERATIVE_AI_API_KEY',
  ];

  const missing = [];
  const present = [];
  const optional = [];

  // Check required variables
  requiredEnvVars.forEach((varName) => {
    if (process.env[varName]) {
      present.push(varName);
    } else {
      missing.push(varName);
    }
  });

  // Check optional variables
  optionalEnvVars.forEach((varName) => {
    if (process.env[varName]) {
      optional.push(varName);
    }
  });

  return {
    missing,
    present,
    optional,
    isValid: missing.length === 0,
  };
}

/**
 * Log environment status for debugging
 */
export function logEnvironmentStatus() {
  const envCheck = checkEnvironmentVariables();

  console.log('🔧 Environment Status:', {
    NODE_ENV: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    required_present: envCheck.present,
    optional_present: envCheck.optional,
    missing_required: envCheck.missing,
    is_valid: envCheck.isValid,
  });

  if (!envCheck.isValid) {
    console.error('❌ Missing required environment variables:', envCheck.missing);
  } else {
    console.log('✅ All required environment variables are present');
  }

  return envCheck;
}

/**
 * Safe environment variable getter with fallbacks
 */
export function getEnvVar(name, fallback = null, required = false) {
  const value = process.env[name];

  if (!value && required) {
    throw new Error(`Required environment variable ${name} is not set`);
  }

  return value || fallback;
}

/**
 * Database connection check utility
 */
export async function checkDatabaseConnection() {
  try {
    // Import Prisma client dynamically to avoid issues
    const { db } = await import('./prisma');

    // Try a simple query
    await db.$queryRaw`SELECT 1`;

    return { connected: true, error: null };
  } catch (error) {
    return {
      connected: false,
      error: {
        message: error.message,
        code: error.code,
        name: error.name,
      },
    };
  }
}

/**
 * Comprehensive health check
 */
export async function performHealthCheck() {
  const envStatus = checkEnvironmentVariables();
  const dbStatus = await checkDatabaseConnection();

  const healthCheck = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    env_variables: envStatus,
    database: dbStatus,
    overall_status: envStatus.isValid && dbStatus.connected ? 'healthy' : 'unhealthy',
  };

  if (isDevelopment) {
    console.log('🏥 Health Check Results:', healthCheck);
  }

  return healthCheck;
}

/**
 * Error reporting utility
 */
export function reportError(error, context = {}) {
  const errorReport = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
    url: typeof window !== 'undefined' ? window.location.href : 'server-side',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server-side',
  };

  // Log to console
  console.error('🚨 Error Report:', errorReport);

  // In production, you might want to send this to an error tracking service
  if (isProduction) {
    // TODO: Send to error tracking service (e.g., Sentry, LogRocket, etc.)
  }

  return errorReport;
}

/**
 * Development only debug logger
 */
export function debugLog(message, data = null) {
  if (isDevelopment) {
    console.log(`🐛 DEBUG: ${message}`, data || '');
  }
}
