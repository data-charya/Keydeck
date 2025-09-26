/**
 * Client-side only crypto utilities to avoid SSR issues
 */

let secureStorageInstance: any = null
let storagePromise: Promise<any> | null = null

export function getSecureStorage() {
  if (typeof window === 'undefined') {
    // Return a mock storage for SSR
    return {
      setItem: async () => {},
      getItem: async () => null,
      removeItem: () => {},
      clear: () => {},
    }
  }

  // If we already have the instance, return it
  if (secureStorageInstance) {
    return secureStorageInstance
  }

  // If we're already loading, return the promise
  if (storagePromise) {
    return storagePromise
  }

  // Start loading the crypto module
  storagePromise = import('./crypto').then(({ secureStorage }) => {
    secureStorageInstance = secureStorage
    return secureStorage
  }).catch((error) => {
    console.error('Failed to initialize secure storage:', error)
    // Return fallback storage
    return {
      setItem: async () => {},
      getItem: async () => null,
      removeItem: () => {},
      clear: () => {},
    }
  })

  return storagePromise
}
