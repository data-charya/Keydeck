/**
 * Secure API client for Redis GUI
 * Handles CSRF tokens and secure API calls
 */

let csrfToken: string | null = null

/**
 * Fetch CSRF token from the server
 */
export async function fetchCSRFToken(): Promise<string> {
  try {
    const response = await fetch('/api/csrf', {
      method: 'GET',
      credentials: 'include',
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token')
    }
    
    const data = await response.json()
    csrfToken = data.csrfToken
    return csrfToken || ''
  } catch (error) {
    console.error('Error fetching CSRF token:', error)
    throw error
  }
}

/**
 * Get current CSRF token, fetching if needed
 */
export async function getCSRFToken(): Promise<string> {
  if (!csrfToken) {
    await fetchCSRFToken()
  }
  return csrfToken || ''
}

/**
 * Make a secure API request with CSRF protection
 */
export async function secureApiRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Ensure we have a CSRF token for state-changing operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || 'GET')) {
    const token = await getCSRFToken()
    options.headers = {
      ...options.headers,
      'X-CSRF-Token': token,
    }
  }
  
  // Add credentials to all requests
  options.credentials = 'include'
  
  const response = await fetch(url, options)
  
  // If we get a 403 with CSRF error, refresh token and retry once
  if (response.status === 403) {
    const errorData = await response.json().catch(() => ({}))
    if (errorData.error === 'Invalid CSRF token') {
      csrfToken = null // Clear the invalid token
      const newToken = await fetchCSRFToken()
      
      // Retry the request with the new token
      options.headers = {
        ...options.headers,
        'X-CSRF-Token': newToken,
      }
      
      return fetch(url, options)
    }
  }
  
  return response
}

/**
 * Clear the stored CSRF token (useful for logout or errors)
 */
export function clearCSRFToken(): void {
  csrfToken = null
}

/**
 * Check if the current origin is allowed
 */
export function isOriginAllowed(): boolean {
  if (typeof window === 'undefined') return false
  
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://localhost:3000',
    'https://127.0.0.1:3000',
    'https://redash-peach.vercel.app'
    // Add your production domain here
    // 'https://yourdomain.com',
  ]
  
  return allowedOrigins.includes(window.location.origin)
}

/**
 * Initialize API security (call this on app startup)
 */
export async function initializeApiSecurity(): Promise<void> {
  try {
    await fetchCSRFToken()
  } catch (error) {
    // Silent fail - security will still work without CSRF for GET requests
  }
}
