/**
 * Security Middleware Utilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getRateLimitIdentifier, RATE_LIMITS } from './rate-limit';
import { createCorsHeaders, handleCorsPreflight } from './cors';

/**
 * Apply rate limiting to a request
 */
export function withRateLimit(
  request: NextRequest,
  config: typeof RATE_LIMITS[keyof typeof RATE_LIMITS]
): NextResponse | null {
  const identifier = getRateLimitIdentifier(request);
  const result = rateLimit(identifier, config);

  if (!result.allowed) {
    const headers = createCorsHeaders(request);
    headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    headers.set('X-RateLimit-Remaining', '0');
    headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
    headers.set('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString());

    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`,
      },
      {
        status: 429,
        headers,
      }
    );
  }

  return null;
}

/**
 * Apply CORS to a response
 */
export function withCors(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const headers = createCorsHeaders(request);
  
  // Copy existing headers
  response.headers.forEach((value, key) => {
    headers.set(key, value);
  });

  // Add rate limit headers if present
  const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
  if (rateLimitRemaining) {
    headers.set('X-RateLimit-Remaining', rateLimitRemaining);
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Combined security middleware
 */
export function securityMiddleware(
  request: NextRequest,
  rateLimitConfig: typeof RATE_LIMITS[keyof typeof RATE_LIMITS]
): {
  rateLimitResponse: NextResponse | null;
  corsPreflightResponse: Response | null;
} {
  // Handle CORS preflight
  const corsPreflight = handleCorsPreflight(request);
  if (corsPreflight) {
    return {
      rateLimitResponse: null,
      corsPreflightResponse: corsPreflight,
    };
  }

  // Apply rate limiting
  const rateLimitResponse = withRateLimit(request, rateLimitConfig);

  return {
    rateLimitResponse,
    corsPreflightResponse: null,
  };
}

