/**
 * CORS Configuration Utility
 */

export interface CorsOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
}

const defaultOptions: Required<CorsOptions> = {
  origin: true, // Allow all origins in development, restrict in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
};

/**
 * Get allowed origins based on environment
 */
function getAllowedOrigins(): string[] {
  const env = process.env.NODE_ENV;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;

  if (env === 'production') {
    const origins = [
      'https://memevote.fun',
      'https://www.memevote.fun',
      'https://memevote.vercel.app',
    ];

    if (appUrl) {
      origins.push(`https://${appUrl}`);
    }

    return origins;
  }

  // Development: allow localhost
  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
  ];
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.some((allowed) => {
    if (allowed.includes('*')) {
      const pattern = new RegExp(allowed.replace(/\*/g, '.*'));
      return pattern.test(origin);
    }
    return origin === allowed;
  });
}

/**
 * Create CORS headers for response
 */
export function createCorsHeaders(
  request: Request,
  options: CorsOptions = {}
): Headers {
  const opts = { ...defaultOptions, ...options };
  const headers = new Headers();

  const origin = request.headers.get('origin');

  // Set Access-Control-Allow-Origin
  if (opts.origin === true) {
    // Allow all origins
    if (origin && isOriginAllowed(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
    }
  } else if (typeof opts.origin === 'string') {
    headers.set('Access-Control-Allow-Origin', opts.origin);
  } else if (Array.isArray(opts.origin)) {
    if (origin && opts.origin.includes(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
    }
  }

  // Set Access-Control-Allow-Methods
  headers.set('Access-Control-Allow-Methods', opts.methods.join(', '));

  // Set Access-Control-Allow-Headers
  headers.set('Access-Control-Allow-Headers', opts.allowedHeaders.join(', '));

  // Set Access-Control-Allow-Credentials
  if (opts.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Set Access-Control-Max-Age for preflight caching
  headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  return headers;
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflight(
  request: Request,
  options: CorsOptions = {}
): Response | null {
  if (request.method === 'OPTIONS') {
    const headers = createCorsHeaders(request, options);
    return new Response(null, { status: 204, headers });
  }
  return null;
}

