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
    // Convert from base64
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    )

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
    console.error('Decryption failed:', error)
    throw new Error('Failed to decrypt data - invalid password or corrupted data')
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
      console.error('Failed to retrieve encrypted data:', error)
      // If decryption fails, the data might be corrupted or password changed
      // Return null to allow the app to continue
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
