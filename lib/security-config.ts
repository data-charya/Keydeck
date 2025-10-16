/**
 * Security Configuration for Redis GUI
 * Centralized configuration for all security settings
 */

export const SECURITY_CONFIG = {
  // API Security Key (set via environment variable)
  apiKey: process.env.REDIS_GUI_API_KEY || 'redis-gui-secure-key-2024',
  
  // Allowed Origins
  allowedOrigins: (() => {
    const baseOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://localhost:3000',
      'https://127.0.0.1:3000',
    ]
    
    // Add environment-based origins
    const envOrigins = process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : []
    
    const vercelOrigins = process.env.VERCEL_URL ? 
      [`https://${process.env.VERCEL_URL}`] : []
    
    // Add common Vercel patterns
    const vercelPatterns = [
      'https://keydeck-peach.vercel.app',
      'https://keydeck-peach.vercel.app/',
    ]
    
    const appUrlOrigins = process.env.NEXT_PUBLIC_APP_URL ? 
      [process.env.NEXT_PUBLIC_APP_URL] : []
    
    // Combine all origins
    const allOrigins = [...baseOrigins, ...envOrigins, ...vercelOrigins, ...vercelPatterns, ...appUrlOrigins]
    
    // Add both with and without trailing slash for each origin
    const normalizedOrigins = new Set<string>()
    allOrigins.forEach(origin => {
      normalizedOrigins.add(origin)
      normalizedOrigins.add(origin.replace(/\/$/, '')) // without trailing slash
      normalizedOrigins.add(origin + '/') // with trailing slash
    })
    
    return Array.from(normalizedOrigins)
  })(),
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  
  // CSRF Protection
  csrf: {
    tokenLength: parseInt(process.env.CSRF_TOKEN_LENGTH || '32'),
    headerName: 'X-CSRF-Token',
  },
  
  // Security Headers
  securityHeaders: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  },
  
  // CORS Configuration
  cors: {
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-API-Key'],
    allowCredentials: true,
  },
}

/**
 * Validate security configuration
 */
export function validateSecurityConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check API key strength
  if (SECURITY_CONFIG.apiKey.length < 16) {
    errors.push('API key should be at least 16 characters long')
  }
  
  // Check allowed origins
  if (SECURITY_CONFIG.allowedOrigins.length === 0) {
    errors.push('At least one allowed origin must be configured')
  }
  
  // Check rate limiting values
  if (SECURITY_CONFIG.rateLimit.windowMs < 60000) {
    errors.push('Rate limit window should be at least 1 minute')
  }
  
  if (SECURITY_CONFIG.rateLimit.maxRequests < 1) {
    errors.push('Rate limit max requests should be at least 1')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Get security status for monitoring
 */
export function getSecurityStatus() {
  const config = validateSecurityConfig()
  
  return {
    status: config.isValid ? 'secure' : 'warning',
    configuration: {
      apiKeyConfigured: !!process.env.REDIS_GUI_API_KEY,
      allowedOriginsCount: SECURITY_CONFIG.allowedOrigins.length,
      rateLimitingEnabled: true,
      csrfProtectionEnabled: true,
      securityHeadersEnabled: true,
    },
    errors: config.errors,
    allowedOrigins: SECURITY_CONFIG.allowedOrigins,
    rateLimit: SECURITY_CONFIG.rateLimit,
  }
}
