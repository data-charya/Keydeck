/**
 * Enhanced encryption utilities for connection profiles
 * Uses AES-GCM with user-provided passphrases for maximum security
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits for GCM
const TAG_LENGTH = 128 // 128 bits for GCM
const SALT_LENGTH = 32 // 256 bits for salt
const ITERATIONS = 100000 // OWASP recommended minimum

/**
 * Derive a cryptographic key from a user passphrase using PBKDF2
 */
async function deriveKeyFromPassphrase(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: ITERATIONS,
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
  return new Uint8Array(crypto.getRandomValues(new Uint8Array(SALT_LENGTH)))
}

/**
 * Generate a random IV for encryption
 */
function generateIV(): Uint8Array {
  return new Uint8Array(crypto.getRandomValues(new Uint8Array(IV_LENGTH)))
}

/**
 * Encrypt connection profile data using user passphrase
 */
export async function encryptConnectionProfile(
  profileData: any, 
  passphrase: string
): Promise<string> {
  if (!passphrase || passphrase.length < 8) {
    throw new Error('Passphrase must be at least 8 characters long')
  }

  try {
    const encoder = new TextEncoder()
    const salt = generateSalt()
    const iv = generateIV()
    
    const key = await deriveKeyFromPassphrase(passphrase, salt)
    const jsonString = JSON.stringify(profileData)
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv.buffer as ArrayBuffer,
        tagLength: TAG_LENGTH,
      },
      key,
      encoder.encode(jsonString)
    )

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength)
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length)

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    console.error('Connection profile encryption failed:', error)
    throw new Error('Failed to encrypt connection profile')
  }
}

/**
 * Decrypt connection profile data using user passphrase
 */
export async function decryptConnectionProfile(
  encryptedData: string, 
  passphrase: string
): Promise<any> {
  if (!encryptedData || typeof encryptedData !== 'string') {
    throw new Error('Invalid encrypted data: data is empty or not a string')
  }
  
  if (!passphrase || typeof passphrase !== 'string') {
    throw new Error('Invalid passphrase: passphrase is empty or not a string')
  }

  try {
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
    const minLength = SALT_LENGTH + IV_LENGTH + 16 // salt + iv + minimum encrypted data
    if (combined.length < minLength) {
      throw new Error(`Data too short: expected at least ${minLength} bytes, got ${combined.length}`)
    }

    // Extract salt, iv, and encrypted data
    const salt = combined.slice(0, SALT_LENGTH)
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH)

    const key = await deriveKeyFromPassphrase(passphrase, salt)
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
    const jsonString = decoder.decode(decryptedData)
    return JSON.parse(jsonString)
  } catch (error) {
    console.warn('Connection profile decryption failed:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('OperationError') || error.message.includes('InvalidAccessError')) {
        throw new Error('Failed to decrypt connection profile - invalid passphrase or corrupted data')
      } else if (error.message.includes('base64')) {
        throw new Error('Failed to decrypt connection profile - invalid base64 encoding')
      } else if (error.message.includes('too short')) {
        throw new Error('Failed to decrypt connection profile - data appears to be corrupted')
      } else {
        throw new Error(`Failed to decrypt connection profile: ${error.message}`)
      }
    }
    
    throw new Error('Failed to decrypt connection profile - unknown error occurred')
  }
}

/**
 * Validate passphrase strength
 */
export function validatePassphrase(passphrase: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!passphrase || passphrase.length < 8) {
    errors.push('Passphrase must be at least 8 characters long')
  }
  
  if (passphrase.length > 128) {
    errors.push('Passphrase must be less than 128 characters')
  }
  
  // Check for common weak patterns
  if (passphrase.toLowerCase() === passphrase) {
    errors.push('Passphrase should contain at least one uppercase letter')
  }
  
  if (passphrase.toUpperCase() === passphrase) {
    errors.push('Passphrase should contain at least one lowercase letter')
  }
  
  if (!/\d/.test(passphrase)) {
    errors.push('Passphrase should contain at least one number')
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passphrase)) {
    errors.push('Passphrase should contain at least one special character')
  }
  
  // Check for common weak passphrases
  const commonPasswords = [
    'password', '123456', 'password123', 'admin', 'qwerty', 
    'letmein', 'welcome', 'monkey', '1234567890'
  ]
  
  if (commonPasswords.some(common => passphrase.toLowerCase().includes(common))) {
    errors.push('Passphrase contains common weak patterns')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Generate a secure random passphrase (for testing/demo purposes)
 */
export function generateSecurePassphrase(): string {
  const words = [
    'apple', 'banana', 'cherry', 'dragon', 'eagle', 'forest', 'garden', 'harbor',
    'island', 'jungle', 'knight', 'ladder', 'mountain', 'ocean', 'palace', 'queen',
    'river', 'sunset', 'tower', 'umbrella', 'village', 'winter', 'yellow', 'zebra'
  ]
  
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
  const symbols = ['!', '@', '#', '$', '%', '^', '&', '*']
  
  // Pick 3 random words
  const selectedWords = []
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * words.length)
    selectedWords.push(words[randomIndex])
  }
  
  // Add a random number and symbol
  const randomNumber = numbers[Math.floor(Math.random() * numbers.length)]
  const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)]
  
  // Capitalize first word
  selectedWords[0] = selectedWords[0].charAt(0).toUpperCase() + selectedWords[0].slice(1)
  
  return selectedWords.join('') + randomNumber + randomSymbol
}

/**
 * Check if Web Crypto API is available for connection profile encryption
 */
export function isConnectionEncryptionSupported(): boolean {
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
    if (window.isSecureContext === false) {
      console.warn('Connection profile encryption requires a secure context (HTTPS or localhost)')
      return false
    }

    return true
  } catch (error) {
    console.warn('Connection encryption support check failed:', error)
    return false
  }
}
