/**
 * API Security Middleware for Redis GUI
 * Provides multiple layers of security to protect APIs from unauthorized access
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { SECURITY_CONFIG } from './security-config'

// In-memory rate limiting store (in production, use Redis or a proper store)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// CSRF token store (in production, use a secure session store)
interface CSRFToken {
  token: string
  expiresAt: number
}

const csrfTokens = new Map<string, CSRFToken>()

/**
 * Generate a secure CSRF token with expiration
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(SECURITY_CONFIG.csrf.tokenLength)
  crypto.getRandomValues(array)
  const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  
  // Token expires in 15 minutes
  const expiresAt = Date.now() + (15 * 60 * 1000)
  csrfTokens.set(token, { token, expiresAt })
  
  // Clean up expired tokens
  cleanupExpiredTokens()
  
  return token
}

/**
 * Clean up expired CSRF tokens
 */
function cleanupExpiredTokens(): void {
  const now = Date.now()
  for (const [token, tokenData] of csrfTokens.entries()) {
    if (tokenData.expiresAt < now) {
      csrfTokens.delete(token)
    }
  }
}

/**
 * Validate and consume CSRF token (one-time use)
 */
export function validateCSRFToken(token: string): boolean {
  const tokenData = csrfTokens.get(token)
  if (tokenData) {
    // Check if token is expired
    if (tokenData.expiresAt < Date.now()) {
      csrfTokens.delete(token)
      return false
    }
    // Consume the token after validation
    csrfTokens.delete(token)
    return true
  }
  return false
}

/**
 * Check if request origin is allowed
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false
  
  // Direct match
  if (SECURITY_CONFIG.allowedOrigins.includes(origin)) {
    return true
  }
  
  // Check for wildcard patterns
  for (const allowedOrigin of SECURITY_CONFIG.allowedOrigins) {
    if (allowedOrigin.includes('*')) {
      const pattern = allowedOrigin.replace(/\*/g, '.*')
      const regex = new RegExp(`^${pattern}$`)
      if (regex.test(origin)) {
        return true
      }
    }
  }
  
  // Check if origin is a subdomain of allowed origins
  for (const allowedOrigin of SECURITY_CONFIG.allowedOrigins) {
    try {
      const allowedUrl = new URL(allowedOrigin)
      const originUrl = new URL(origin)
      
      // Check if same protocol and hostname is a subdomain
      if (allowedUrl.protocol === originUrl.protocol && 
          (originUrl.hostname === allowedUrl.hostname || 
           originUrl.hostname.endsWith('.' + allowedUrl.hostname))) {
        return true
      }
    } catch {
      // Invalid URL, skip
      continue
    }
  }
  
  return false
}

/**
 * Check if request referer is allowed
 */
function isRefererAllowed(referer: string | null): boolean {
  if (!referer) return false
  
  try {
    const refererUrl = new URL(referer)
    const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`
    
    // Check direct match
    if (SECURITY_CONFIG.allowedOrigins.includes(refererOrigin)) {
      return true
    }
    
    // Check with trailing slash variations
    const withSlash = refererOrigin + '/'
    const withoutSlash = refererOrigin.replace(/\/$/, '')
    
    return SECURITY_CONFIG.allowedOrigins.includes(withSlash) || 
           SECURITY_CONFIG.allowedOrigins.includes(withoutSlash)
  } catch {
    return false
  }
}

/**
 * Rate limiting check
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowStart = now - SECURITY_CONFIG.rateLimit.windowMs
  
  // Clean up old entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < windowStart) {
      rateLimitStore.delete(key)
    }
  }
  
  const current = rateLimitStore.get(ip)
  
  if (!current) {
    rateLimitStore.set(ip, { count: 1, resetTime: now })
    return true
  }
  
  if (current.resetTime < windowStart) {
    rateLimitStore.set(ip, { count: 1, resetTime: now })
    return true
  }
  
  if (current.count >= SECURITY_CONFIG.rateLimit.maxRequests) {
    return false
  }
  
  current.count++
  return true
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (cfConnectingIP) return cfConnectingIP
  if (realIP) return realIP
  if (forwarded) return forwarded.split(',')[0].trim()
  
  return 'unknown'
}

/**
 * Validate API key
 */
function validateAPIKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key')
  return apiKey === SECURITY_CONFIG.apiKey
}

/**
 * Main API security middleware
 */
export function withAPISecurity(handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      // 1. Check origin/referer
      const origin = request.headers.get('origin')
      const referer = request.headers.get('referer')
      
      // Skip origin check in development or if DISABLE_ORIGIN_CHECK is set
      const skipOriginCheck = process.env.NODE_ENV === 'development' || process.env.DISABLE_ORIGIN_CHECK === 'true'
      
      if (!skipOriginCheck && !isOriginAllowed(origin) && !isRefererAllowed(referer)) {
        return NextResponse.json(
          { error: 'Unauthorized origin' },
          { status: 403 }
        )
      }
      
      // 2. Rate limiting
      const clientIP = getClientIP(request)
      if (!checkRateLimit(clientIP)) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        )
      }
      
      // 3. API key validation (optional, can be enabled for extra security)
      // Uncomment the following lines if you want to require API key
      /*
      if (!validateAPIKey(request)) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        )
      }
      */
      
      // 4. CSRF protection for state-changing operations
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const csrfToken = request.headers.get(SECURITY_CONFIG.csrf.headerName)
        if (!csrfToken || !validateCSRFToken(csrfToken)) {
          return NextResponse.json(
            { error: 'Invalid CSRF token' },
            { status: 403 }
          )
        }
      }
      
      // 5. Additional security headers
      const response = await handler(request, ...args)
      
      // Add security headers to response
      Object.entries(SECURITY_CONFIG.securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      // Add CORS headers for allowed origins
      if (origin && isOriginAllowed(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin)
      }
      response.headers.set('Access-Control-Allow-Methods', SECURITY_CONFIG.cors.allowedMethods.join(', '))
      response.headers.set('Access-Control-Allow-Headers', SECURITY_CONFIG.cors.allowedHeaders.join(', '))
      response.headers.set('Access-Control-Allow-Credentials', SECURITY_CONFIG.cors.allowCredentials.toString())
      
      return response
      
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Generate and return a CSRF token endpoint
 */
export async function GET_CSRF_TOKEN(): Promise<NextResponse> {
  const token = generateCSRFToken()
  return NextResponse.json({ csrfToken: token })
}

/**
 * Health check endpoint for security status
 */
export async function GET_SECURITY_STATUS(): Promise<NextResponse> {
  const { getSecurityStatus } = await import('./security-config')
  const status = getSecurityStatus()
  
  return NextResponse.json(status)
}

/**
 * Clear rate limit for a specific IP (admin function)
 */
export function clearRateLimit(ip: string): void {
  rateLimitStore.delete(ip)
}

/**
 * Clear all rate limits (admin function)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear()
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(): Record<string, { count: number; resetTime: number }> {
  return Object.fromEntries(rateLimitStore.entries())
}
