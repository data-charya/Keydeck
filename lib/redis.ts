import Redis from 'ioredis'

// Global Redis client instance with connection info (legacy - now handled by connectionManager)

export interface RedisConfig {
  host: string
  port: number
  password?: string
  database?: number
}

// Connection manager class to handle persistent connections
class RedisConnectionManager {
  private client: Redis | null = null
  private config: RedisConfig | null = null
  private isConnecting = false

  async connect(config: RedisConfig): Promise<Redis> {
    // If already connected with same config, return existing client
    if (this.client && this.config && this.isSameConfig(config)) {
      try {
        // Test if connection is still alive
        await this.client.ping()
        return this.client
      } catch (error) {
        await this.disconnect()
      }
    }

    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      // Wait for ongoing connection attempt
      while (this.isConnecting) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      if (this.client) {
        return this.client
      }
    }

    this.isConnecting = true

    try {
      // Disconnect existing client if any
      if (this.client) {
        await this.disconnect()
      }

      // Create new client with better connection settings
      this.client = new Redis({
        host: config.host,
        port: config.port,
        password: config.password || undefined,
        db: config.database || 0,
        maxRetriesPerRequest: 1, // Reduced retries for faster failure feedback
        lazyConnect: false, // Connect immediately
        keepAlive: 30000, // Keep connection alive
        connectTimeout: 5000, // 5 second timeout (reduced for faster feedback)
        commandTimeout: 3000, // 3 second command timeout
        enableReadyCheck: true,
        family: 4, // Force IPv4
      })

      // Set up error handling
      this.client.on('error', (error) => {
        console.error('Redis client error:', error)
        // Don't disconnect on error, let retry logic handle it
      })

      this.client.on('connect', () => {
      })

      this.client.on('ready', () => {
      })

      this.client.on('close', () => {
      })

      // Test the connection
      await this.client.ping()
      
      this.config = { ...config }
      this.isConnecting = false
      
      return this.client
    } catch (error) {
      this.isConnecting = false
      if (this.client) {
        await this.client.quit().catch(() => {})
        this.client = null
      }
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit()
      } catch (error) {
        console.error('Redis Connection Manager: Error disconnecting Redis client:', error)
      }
      this.client = null
    }
    this.config = null
    this.isConnecting = false
  }

  getClient(): Redis | null {
    return this.client
  }

  getConfig(): RedisConfig | null {
    return this.config
  }

  isConnected(): boolean {
    return this.client !== null && this.client.status === 'ready'
  }

  private isSameConfig(config: RedisConfig): boolean {
    if (!this.config) return false
    return (
      this.config.host === config.host &&
      this.config.port === config.port &&
      this.config.password === config.password &&
      (this.config.database || 0) === (config.database || 0)
    )
  }
}

// Global connection manager instance
const connectionManager = new RedisConnectionManager()

export function createRedisClient(config: RedisConfig): Redis {
  const client = new Redis({
    host: config.host,
    port: config.port,
    password: config.password || undefined,
    db: config.database || 0,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    connectTimeout: 5000,
    commandTimeout: 3000,
    family: 4, // Force IPv4
  })

  return client
}

export function getRedisClient(): Redis | null {
  return connectionManager.getClient()
}

export function setRedisClient(client: Redis | null): void {
  // This is now handled by the connection manager
  if (!client) {
    connectionManager.disconnect()
  }
}

export async function connectToRedis(config: RedisConfig): Promise<Redis> {
  try {
    return await connectionManager.connect(config)
  } catch (error) {
    throw new Error(`Failed to connect to Redis: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function disconnectFromRedis(): Promise<void> {
  await connectionManager.disconnect()
}

// Export connection manager for advanced usage
export { connectionManager }

// Helper function to safely execute Redis commands
export async function executeRedisCommand<T = any>(
  command: string,
  ...args: (string | number)[]
): Promise<T> {
  const client = connectionManager.getClient()
  if (!client) {
    throw new Error('Redis client not connected')
  }

  try {
    const result = await (client as any)[command.toLowerCase()](...args)
    return result
  } catch (error) {
    // If connection is lost, try to reconnect if we have config
    if (error instanceof Error && error.message.includes('Connection is closed')) {
      const config = connectionManager.getConfig()
      if (config) {
        try {
          await connectionManager.connect(config)
          const newClient = connectionManager.getClient()
          if (newClient) {
            const result = await (newClient as any)[command.toLowerCase()](...args)
            return result
          }
        } catch (reconnectError) {
          console.error('Failed to reconnect:', reconnectError)
        }
      }
    }
    throw new Error(`Redis command failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Helper function to get key information
export async function getKeyInfo(key: string) {
  const client = connectionManager.getClient()
  if (!client) {
    throw new Error('Redis client not connected')
  }

  try {
    const [type, ttl, exists] = await Promise.all([
      client.type(key),
      client.ttl(key),
      client.exists(key)
    ])

    if (!exists) {
      return null
    }

    let value: any
    let size = 0

    switch (type) {
      case 'string':
        value = await client.get(key)
        size = value ? Buffer.byteLength(value, 'utf8') : 0
        break
      case 'hash':
        value = await client.hgetall(key)
        size = JSON.stringify(value).length
        break
      case 'list':
        const listLength = await client.llen(key)
        value = await client.lrange(key, 0, -1)
        size = JSON.stringify(value).length
        break
      case 'set':
        value = await client.smembers(key)
        size = JSON.stringify(value).length
        break
      case 'zset':
        const zsetLength = await client.zcard(key)
        value = await client.zrange(key, 0, -1, 'WITHSCORES')
        size = JSON.stringify(value).length
        break
      default:
        value = null
    }

    return {
      key,
      type,
      value,
      ttl: ttl === -2 ? -1 : ttl, // -2 means key doesn't exist, -1 means no expiry
      size
    }
  } catch (error) {
    throw new Error(`Failed to get key info: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Helper function to get all keys with their info
export async function getAllKeys(pattern: string = '*'): Promise<any[]> {
  const client = connectionManager.getClient()
  if (!client) {
    throw new Error('Redis client not connected')
  }

  try {
    const keys = await client.keys(pattern)
    const keyInfos = await Promise.all(
      keys.map(async (key) => {
        try {
          return await getKeyInfo(key)
        } catch (error) {
          console.error(`Error getting info for key ${key}:`, error)
          return null
        }
      })
    )

    return keyInfos.filter(info => info !== null)
  } catch (error) {
    throw new Error(`Failed to get keys: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Helper function to get Redis server info
export async function getRedisInfo(): Promise<any> {
  const client = connectionManager.getClient()
  if (!client) {
    throw new Error('Redis client not connected')
  }

  try {
    const info = await client.info()
    const lines = info.split('\r\n')
    const result: any = {}

    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':')
        if (key && value) {
          result[key] = value
        }
      }
    }

    return result
  } catch (error) {
    throw new Error(`Failed to get Redis info: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
