/**
 * Client-side encryption utilities for securing connection data in localStorage
 * Uses Web Crypto API with AES-GCM encryption
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits for GCM
const TAG_LENGTH = 128 // 128 bits for GCM

/**
 * Derive a cryptographic key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000, // OWASP recommended minimum
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Generate a random salt for key derivation
 */
function generateSalt(): Uint8Array {
  return new Uint8Array(crypto.getRandomValues(new Uint8Array(16)))
}

/**
 * Generate a random IV for encryption
 */
function generateIV(): Uint8Array {
  return new Uint8Array(crypto.getRandomValues(new Uint8Array(IV_LENGTH)))
}

/**
 * Encrypt data using AES-GCM
 */
export async function encryptData(data: string, password: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const salt = generateSalt()
    const iv = generateIV()
    
    const key = await deriveKey(password, salt)
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv.buffer as ArrayBuffer,
        tagLength: TAG_LENGTH,
      },
      key,
      encoder.encode(data)
    )

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength)
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length)

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    console.error('Encryption failed:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt data using AES-GCM
 */
export async function decryptData(encryptedData: string, password: string): Promise<string> {
  try {
    // Validate input
    if (!encryptedData || typeof encryptedData !== 'string') {
      throw new Error('Invalid encrypted data: data is empty or not a string')
    }
    
    if (!password || typeof password !== 'string') {
      throw new Error('Invalid password: password is empty or not a string')
    }

    // Convert from base64
    let combined: Uint8Array
    try {
      combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      )
    } catch (base64Error) {
      throw new Error(`Invalid base64 data: ${base64Error instanceof Error ? base64Error.message : 'Unknown error'}`)
    }

    // Validate minimum length (salt + iv + some encrypted data)
    const minLength = 16 + IV_LENGTH + 16 // salt + iv + minimum encrypted data
    if (combined.length < minLength) {
      throw new Error(`Data too short: expected at least ${minLength} bytes, got ${combined.length}`)
    }

    // Extract salt, iv, and encrypted data
    const salt = combined.slice(0, 16)
    const iv = combined.slice(16, 16 + IV_LENGTH)
    const encrypted = combined.slice(16 + IV_LENGTH)


    const key = await deriveKey(password, salt)
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv.buffer,
        tagLength: TAG_LENGTH,
      },
      key,
      encrypted
    )

    const decoder = new TextDecoder()
    return decoder.decode(decryptedData)
  } catch (error) {
    console.warn('Decryption failed:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('OperationError') || error.message.includes('InvalidAccessError')) {
        throw new Error('Failed to decrypt data - invalid password or corrupted data')
      } else if (error.message.includes('base64')) {
        throw new Error('Failed to decrypt data - invalid base64 encoding')
      } else if (error.message.includes('too short')) {
        throw new Error('Failed to decrypt data - data appears to be corrupted')
      } else {
        throw new Error(`Failed to decrypt data: ${error.message}`)
      }
    }
    
    throw new Error('Failed to decrypt data - unknown error occurred')
  }
}

/**
 * Generate a deterministic encryption password based on browser characteristics
 * This ensures the same password is generated each time for the same browser
 */
export function generateEncryptionPassword(): string {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return 'fallback-key-for-ssr'
  }

  // Use stable browser characteristics that don't change between sessions
  const stableFactors = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    screen.width + 'x' + screen.height,
    navigator.hardwareConcurrency?.toString() || 'unknown',
    // Add a fixed salt to make it harder to reverse engineer
    'redis-gui-encryption-salt-2024'
  ]
  
  // Create a deterministic hash from stable factors
  let hash = 0
  const combined = stableFactors.join('|')
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Convert to a more secure format
  const baseHash = Math.abs(hash).toString(36)
  const additionalEntropy = Math.abs(combined.length * 7).toString(36)
  
  return baseHash + additionalEntropy + 'redis-gui-2024'
}

/**
 * Check if Web Crypto API is available
 */
export function isCryptoSupported(): boolean {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return false
    }

    // Check if crypto object exists
    if (typeof crypto === 'undefined') {
      return false
    }

    // Check if crypto.subtle exists (required for encryption)
    if (typeof crypto.subtle === 'undefined' || crypto.subtle === null) {
      return false
    }

    // Check if required crypto methods exist
    const requiredMethods: (keyof SubtleCrypto)[] = [
      'importKey', 'deriveKey', 'encrypt', 'decrypt', 'generateKey'
    ]
    
    for (const method of requiredMethods) {
      if (typeof crypto.subtle[method] !== 'function') {
        return false
      }
    }

    // Check if getRandomValues exists (for generating salts/IVs)
    if (typeof crypto.getRandomValues !== 'function') {
      return false
    }

    // Check if we're in a secure context (HTTPS or localhost)
    // Web Crypto API requires secure context in most browsers
    if (window.isSecureContext === false) {
      console.warn('Web Crypto API requires a secure context (HTTPS or localhost)')
      return false
    }

    return true
  } catch (error) {
    console.warn('Web Crypto API check failed:', error)
    return false
  }
}

/**
 * Fallback storage for browsers without Web Crypto API support
 */
class FallbackStorage {
  async setItem(key: string, value: any): Promise<void> {
    // Simple base64 encoding as fallback (not secure, but better than plain text)
    const jsonString = JSON.stringify(value)
    const encoded = btoa(jsonString)
    localStorage.setItem(key, encoded)
  }

  async getItem<T = any>(key: string): Promise<T | null> {
    try {
      const encoded = localStorage.getItem(key)
      if (!encoded) {
        return null
      }
      const jsonString = atob(encoded)
      return JSON.parse(jsonString)
    } catch (error) {
      console.error('Failed to retrieve fallback data:', error)
      return null
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key)
  }

  clear(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('redis-connections') || key.startsWith('redis-gui-')) {
        localStorage.removeItem(key)
      }
    })
  }
}

/**
 * Secure storage wrapper that encrypts data before storing
 */
export class SecureStorage {
  private fallback: FallbackStorage

  constructor() {
    this.fallback = new FallbackStorage()
    
    if (!isCryptoSupported()) {
      console.warn('Web Crypto API not available in this environment. Connection data will be stored with basic encoding instead of encryption.')
    }
  }

  private getEncryptionPassword(): string {
    // Always generate a new password based on browser characteristics
    // This ensures the key is never stored in localStorage
    return generateEncryptionPassword()
  }

  async setItem(key: string, value: any): Promise<void> {
    if (!isCryptoSupported()) {
      return this.fallback.setItem(key, value)
    }

    try {
      const jsonString = JSON.stringify(value)
      const password = this.getEncryptionPassword()
      const encrypted = await encryptData(jsonString, password)
      localStorage.setItem(key, encrypted)
    } catch (error) {
      console.error('Failed to store encrypted data:', error)
      throw new Error('Failed to store data securely')
    }
  }

  async getItem<T = any>(key: string): Promise<T | null> {
    if (!isCryptoSupported()) {
      return this.fallback.getItem<T>(key)
    }

    try {
      const encrypted = localStorage.getItem(key)
      if (!encrypted) {
        return null
      }
      
      const password = this.getEncryptionPassword()
      const decrypted = await decryptData(encrypted, password)
      return JSON.parse(decrypted)
    } catch (error) {
      // If decryption fails, the data might be corrupted or password changed
      // Clear the corrupted data and return null to allow the app to continue
      try {
        localStorage.removeItem(key)
      } catch (clearError) {
        // Silent fail
      }
      return null
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key)
  }

  clear(): void {
    if (!isCryptoSupported()) {
      return this.fallback.clear()
    }

    // Clear all our data including any old encryption keys
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('redis-connections') || key.startsWith('redis-gui-')) {
        localStorage.removeItem(key)
      }
    })
  }
}

// Export a singleton instance
export const secureStorage = new SecureStorage()

/**
 * Clear all corrupted encrypted data from localStorage
 * This can be called when decryption errors occur
 */
export function clearCorruptedData(): void {
  if (typeof window === 'undefined') {
    return
  }

  const keysToCheck = [
    'redis-connections-encrypted',
    'redis-connections-fallback',
    'redis-active-connection',
    'redis-connection-history'
  ]

  keysToCheck.forEach(key => {
    try {
      const data = localStorage.getItem(key)
      if (data) {
        // Try to parse as JSON first (for unencrypted data)
        try {
          JSON.parse(data)
        } catch {
          // If it's not valid JSON, it might be encrypted data
          // Try to decrypt it, and if it fails, remove it
          secureStorage.getItem(key).catch(() => {
            localStorage.removeItem(key)
          })
        }
      }
    } catch (error) {
      localStorage.removeItem(key)
    }
  })
}

/**
 * Force clear all Redis-related data from localStorage
 * Use this when you want to start fresh
 */
export function clearAllRedisData(): void {
  if (typeof window === 'undefined') {
    return
  }

  const keys = Object.keys(localStorage)
  const redisKeys = keys.filter(key => 
    key.startsWith('redis-') || 
    key.includes('redis') ||
    key.includes('connection')
  )
  
  redisKeys.forEach(key => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      // Silent fail
    }
  })
}
