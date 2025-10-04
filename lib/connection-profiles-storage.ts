/**
 * IndexedDB storage layer for encrypted connection profiles
 * Provides secure, offline-capable storage with passphrase-based encryption
 */

import { 
  encryptConnectionProfile, 
  decryptConnectionProfile, 
  isConnectionEncryptionSupported 
} from './connection-encryption'
import { parseRedisUri, type RedisConfig } from './redis-uri'

export interface ConnectionProfile {
  id: string
  name: string
  host: string
  port: number
  username?: string
  password?: string
  database?: number
  tls?: boolean
  connectTimeout?: number
  commandTimeout?: number
  maxRetriesPerRequest?: number
  createdAt: Date
  updatedAt: Date
  lastConnected?: Date
  isConnected?: boolean
}

interface StoredProfile {
  id: string
  name: string
  encryptedData: string
  createdAt: string
  updatedAt: string
  lastConnected?: string
  isConnected?: boolean
}

const DB_NAME = 'RedashConnectionProfiles'
const DB_VERSION = 1
const STORE_NAME = 'profiles'

class ConnectionProfilesStorage {
  private db: IDBDatabase | null = null
  private dbPromise: Promise<IDBDatabase> | null = null

  /**
   * Initialize IndexedDB database
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db
    }

    if (this.dbPromise) {
      return this.dbPromise
    }

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('IndexedDB is not available in this environment'))
        return
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create profiles store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('name', 'name', { unique: false })
          store.createIndex('createdAt', 'createdAt', { unique: false })
          store.createIndex('updatedAt', 'updatedAt', { unique: false })
        }
      }
    })

    return this.dbPromise
  }

  /**
   * Check if storage is available and supported
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') {
        return false
      }

      if (!isConnectionEncryptionSupported()) {
        console.warn('Connection profile encryption is not supported in this environment')
        return false
      }

      // Test IndexedDB availability
      await this.initDB()
      return true
    } catch (error) {
      console.warn('Connection profiles storage is not available:', error)
      return false
    }
  }

  /**
   * Save a connection profile with encryption
   */
  async saveProfile(profile: ConnectionProfile, passphrase: string): Promise<void> {
    if (!passphrase || passphrase.length < 8) {
      throw new Error('Passphrase must be at least 8 characters long')
    }

    try {
      const db = await this.initDB()
      
      // Prepare profile data for encryption (exclude metadata)
      const profileData = {
        host: profile.host,
        port: profile.port,
        username: profile.username,
        password: profile.password,
        database: profile.database,
        tls: profile.tls,
        connectTimeout: profile.connectTimeout,
        commandTimeout: profile.commandTimeout,
        maxRetriesPerRequest: profile.maxRetriesPerRequest,
      }

      // Encrypt the profile data
      const encryptedData = await encryptConnectionProfile(profileData, passphrase)

      // Create stored profile object
      const storedProfile: StoredProfile = {
        id: profile.id,
        name: profile.name,
        encryptedData,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: new Date().toISOString(),
        lastConnected: profile.lastConnected?.toISOString(),
        isConnected: profile.isConnected || false,
      }

      // Save to IndexedDB
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      return new Promise((resolve, reject) => {
        const request = store.put(storedProfile)
        
        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error(`Failed to save profile: ${request.error?.message}`))
      })
    } catch (error) {
      console.error('Failed to save connection profile:', error)
      throw new Error(`Failed to save connection profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Load a connection profile with decryption
   */
  async loadProfile(profileId: string, passphrase: string): Promise<ConnectionProfile | null> {
    try {
      const db = await this.initDB()
      
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      
      return new Promise((resolve, reject) => {
        const request = store.get(profileId)
        
        request.onsuccess = async () => {
          const storedProfile: StoredProfile | undefined = request.result
          
          if (!storedProfile) {
            resolve(null)
            return
          }

          try {
            // Decrypt the profile data
            const profileData = await decryptConnectionProfile(storedProfile.encryptedData, passphrase)
            
            // Reconstruct the full profile
            const profile: ConnectionProfile = {
              id: storedProfile.id,
              name: storedProfile.name,
              ...profileData,
              createdAt: new Date(storedProfile.createdAt),
              updatedAt: new Date(storedProfile.updatedAt),
              lastConnected: storedProfile.lastConnected ? new Date(storedProfile.lastConnected) : undefined,
              isConnected: storedProfile.isConnected || false,
            }
            
            resolve(profile)
          } catch (decryptError) {
            reject(new Error(`Failed to decrypt profile: ${decryptError instanceof Error ? decryptError.message : 'Unknown error'}`))
          }
        }
        
        request.onerror = () => reject(new Error(`Failed to load profile: ${request.error?.message}`))
      })
    } catch (error) {
      console.error('Failed to load connection profile:', error)
      throw new Error(`Failed to load connection profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * List all stored profiles (without decryption)
   */
  async listProfiles(): Promise<Omit<ConnectionProfile, 'password' | 'username'>[]> {
    try {
      const db = await this.initDB()
      
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      
      return new Promise((resolve, reject) => {
        const request = store.getAll()
        
        request.onsuccess = () => {
          const storedProfiles: StoredProfile[] = request.result
          
          const profiles = storedProfiles.map(stored => ({
            id: stored.id,
            name: stored.name,
            host: '***', // Don't expose sensitive data
            port: 0,
            database: 0,
            createdAt: new Date(stored.createdAt),
            updatedAt: new Date(stored.updatedAt),
            lastConnected: stored.lastConnected ? new Date(stored.lastConnected) : undefined,
            isConnected: stored.isConnected || false,
          }))
          
          resolve(profiles)
        }
        
        request.onerror = () => reject(new Error(`Failed to list profiles: ${request.error?.message}`))
      })
    } catch (error) {
      console.error('Failed to list connection profiles:', error)
      throw new Error(`Failed to list connection profiles: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete a connection profile
   */
  async deleteProfile(profileId: string): Promise<void> {
    try {
      const db = await this.initDB()
      
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      return new Promise((resolve, reject) => {
        const request = store.delete(profileId)
        
        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error(`Failed to delete profile: ${request.error?.message}`))
      })
    } catch (error) {
      console.error('Failed to delete connection profile:', error)
      throw new Error(`Failed to delete connection profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update profile metadata (without re-encryption)
   */
  async updateProfileMetadata(profileId: string, updates: {
    name?: string
    lastConnected?: Date
    isConnected?: boolean
  }): Promise<void> {
    try {
      const db = await this.initDB()
      
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      return new Promise((resolve, reject) => {
        const getRequest = store.get(profileId)
        
        getRequest.onsuccess = () => {
          const storedProfile: StoredProfile | undefined = getRequest.result
          
          if (!storedProfile) {
            reject(new Error('Profile not found'))
            return
          }

          // Update metadata
          if (updates.name !== undefined) {
            storedProfile.name = updates.name
          }
          if (updates.lastConnected !== undefined) {
            storedProfile.lastConnected = updates.lastConnected.toISOString()
          }
          if (updates.isConnected !== undefined) {
            storedProfile.isConnected = updates.isConnected
          }
          storedProfile.updatedAt = new Date().toISOString()

          // Save updated profile
          const putRequest = store.put(storedProfile)
          
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(new Error(`Failed to update profile: ${putRequest.error?.message}`))
        }
        
        getRequest.onerror = () => reject(new Error(`Failed to get profile: ${getRequest.error?.message}`))
      })
    } catch (error) {
      console.error('Failed to update profile metadata:', error)
      throw new Error(`Failed to update profile metadata: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Clear all stored profiles
   */
  async clearAllProfiles(): Promise<void> {
    try {
      const db = await this.initDB()
      
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      return new Promise((resolve, reject) => {
        const request = store.clear()
        
        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error(`Failed to clear profiles: ${request.error?.message}`))
      })
    } catch (error) {
      console.error('Failed to clear connection profiles:', error)
      throw new Error(`Failed to clear connection profiles: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    profileCount: number
    totalSize: number
    isAvailable: boolean
  }> {
    try {
      const isAvailable = await this.isAvailable()
      
      if (!isAvailable) {
        return {
          profileCount: 0,
          totalSize: 0,
          isAvailable: false
        }
      }

      const profiles = await this.listProfiles()
      
      // Estimate storage size (rough calculation)
      const totalSize = profiles.length * 1024 // Rough estimate per profile
      
      return {
        profileCount: profiles.length,
        totalSize,
        isAvailable: true
      }
    } catch (error) {
      console.error('Failed to get storage stats:', error)
      return {
        profileCount: 0,
        totalSize: 0,
        isAvailable: false
      }
    }
  }
}

// Export singleton instance
export const connectionProfilesStorage = new ConnectionProfilesStorage()

/**
 * Generate a unique profile ID
 */
export function generateProfileId(): string {
  return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create a new connection profile from Redis config
 */
export function createConnectionProfile(
  config: any, 
  name: string, 
  id?: string
): ConnectionProfile {
  let redisConfig: RedisConfig
  
  // Handle URI connections
  if (config.uri) {
    try {
      redisConfig = parseRedisUri(config.uri)
    } catch (error) {
      throw new Error(`Invalid URI format: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  } else {
    // Handle form connections
    redisConfig = {
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      database: config.database || 0,
      tls: config.tls || false,
      connectTimeout: config.connectTimeout,
      commandTimeout: config.commandTimeout,
      maxRetriesPerRequest: config.maxRetriesPerRequest,
    }
  }
  
  return {
    id: id || generateProfileId(),
    name,
    host: redisConfig.host,
    port: redisConfig.port,
    username: redisConfig.username,
    password: redisConfig.password,
    database: redisConfig.database || 0,
    tls: redisConfig.tls || false,
    connectTimeout: redisConfig.connectTimeout,
    commandTimeout: redisConfig.commandTimeout,
    maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
    createdAt: new Date(),
    updatedAt: new Date(),
    isConnected: false,
  }
}
