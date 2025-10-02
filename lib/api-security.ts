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
const csrfTokens = new Set<string>()

/**
 * Generate a secure CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(SECURITY_CONFIG.csrf.tokenLength)
  crypto.getRandomValues(array)
  const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  csrfTokens.add(token)
  
  // Clean up old tokens (keep only last 1000)
  if (csrfTokens.size > 1000) {
    const tokensArray = Array.from(csrfTokens)
    tokensArray.slice(0, tokensArray.length - 1000).forEach(token => csrfTokens.delete(token))
  }
  
  return token
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  return csrfTokens.has(token)
}

/**
 * Check if request origin is allowed
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false
  return SECURITY_CONFIG.allowedOrigins.includes(origin)
}

/**
 * Check if request referer is allowed
 */
function isRefererAllowed(referer: string | null): boolean {
  if (!referer) return false
  
  try {
    const refererUrl = new URL(referer)
    const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`
    return SECURITY_CONFIG.allowedOrigins.includes(refererOrigin)
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
      
      if (!isOriginAllowed(origin) && !isRefererAllowed(referer)) {
        console.warn(`Blocked request from unauthorized origin: ${origin || 'none'} or referer: ${referer || 'none'}`)
        return NextResponse.json(
          { error: 'Unauthorized origin' },
          { status: 403 }
        )
      }
      
      // 2. Rate limiting
      const clientIP = getClientIP(request)
      if (!checkRateLimit(clientIP)) {
        console.warn(`Rate limit exceeded for IP: ${clientIP}`)
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        )
      }
      
      // 3. API key validation (optional, can be enabled for extra security)
      // Uncomment the following lines if you want to require API key
      /*
      if (!validateAPIKey(request)) {
        console.warn(`Invalid API key from IP: ${clientIP}`)
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
          console.warn(`Invalid CSRF token from IP: ${clientIP}`)
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
      console.error('API Security middleware error:', error)
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
