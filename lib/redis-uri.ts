// URI parsing utilities for Redis connection strings
// This file is separate from redis.ts to avoid importing ioredis in client components

export interface RedisConfig {
  host: string
  port: number
  username?: string
  password?: string
  database?: number
  tls?: boolean
  connectTimeout?: number
  commandTimeout?: number
  maxRetriesPerRequest?: number
}

// URI parsing function for Redis connection strings
export function parseRedisUri(uri: string): RedisConfig {
  try {
    // Use a more browser-compatible approach to parse the URI
    const uriRegex = /^(redis|rediss):\/\/(?:([^:]+):([^@]+)@)?([^:\/]+)(?::(\d+))?(?:\/(\d+))?(?:\?(.+))?$/
    const match = uri.match(uriRegex)
    
    if (!match) {
      throw new Error('Invalid URI format')
    }

    const [, protocol, username, password, hostname, port, database, queryString] = match

    // Validate protocol
    if (protocol !== 'redis' && protocol !== 'rediss') {
      throw new Error('Invalid protocol. Use redis:// or rediss://')
    }

    const config: RedisConfig = {
      host: hostname,
      port: parseInt(port) || (protocol === 'rediss' ? 6380 : 6379),
      tls: protocol === 'rediss',
    }

    // Parse authentication
    if (username) {
      config.username = decodeURIComponent(username)
    }
    if (password) {
      config.password = decodeURIComponent(password)
    }

    // Parse database
    if (database) {
      config.database = parseInt(database)
    }

    // Parse additional parameters
    if (queryString) {
      const params = new URLSearchParams(queryString)
      if (params.get('connectTimeout')) {
        config.connectTimeout = parseInt(params.get('connectTimeout')!)
      }
      if (params.get('commandTimeout')) {
        config.commandTimeout = parseInt(params.get('commandTimeout')!)
      }
      if (params.get('maxRetriesPerRequest')) {
        config.maxRetriesPerRequest = parseInt(params.get('maxRetriesPerRequest')!)
      }
    }

    return config
  } catch (error) {
    throw new Error(`Invalid Redis URI: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Helper function to build Redis URI from config
export function buildRedisUri(config: RedisConfig): string {
  const protocol = config.tls ? 'rediss' : 'redis'
  const auth = config.username && config.password 
    ? `${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}@`
    : config.password 
    ? `:${encodeURIComponent(config.password)}@`
    : ''
  
  const port = config.port ? `:${config.port}` : ''
  const db = config.database ? `/${config.database}` : ''
  
  const params = new URLSearchParams()
  if (config.connectTimeout) params.set('connectTimeout', config.connectTimeout.toString())
  if (config.commandTimeout) params.set('commandTimeout', config.commandTimeout.toString())
  if (config.maxRetriesPerRequest) params.set('maxRetriesPerRequest', config.maxRetriesPerRequest.toString())
  
  const queryString = params.toString() ? `?${params.toString()}` : ''
  
  return `${protocol}://${auth}${config.host}${port}${db}${queryString}`
}

// Helper function to generate a meaningful connection name
export function generateConnectionName(config: RedisConfig, osInfo?: string): string {
  if (!config.host || typeof config.host !== 'string') {
    return 'Unknown Connection'
  }
  const host = config.host.toLowerCase()
  
  // Extract meaningful parts from hostname
  let hostPart = host
  
  // Remove common prefixes/suffixes
  hostPart = hostPart.replace(/^(redis-|db-|cache-|store-)/, '')
  hostPart = hostPart.replace(/(\.redis\.|\.db\.|\.cache\.|\.store\.)/, '.')
  hostPart = hostPart.replace(/\.(com|org|net|io|cloud|local)$/, '')
  
  // Handle common cloud provider patterns
  if (host.includes('aiven')) {
    const match = host.match(/redis-(\d+)-([^.]+)/)
    if (match) {
      return `Aiven Redis ${match[1]}`
    }
    return 'Aiven Redis'
  }
  
  if (host.includes('redis-labs') || host.includes('redislabs') || host.includes('rediscloud')) {
    return 'Redis Cloud'
  }
  
  if (host.includes('upstash')) {
    return 'Upstash Redis'
  }
  
  if (host.includes('railway')) {
    return 'Railway Redis'
  }
  
  if (host.includes('render')) {
    return 'Render Redis'
  }
  
  if (host.includes('fly.io') || host.includes('flycast')) {
    return 'Fly.io Redis'
  }
  
  if (host.includes('aws') || host.includes('amazonaws') || host.includes('elasticache')) {
    return 'AWS ElastiCache'
  }
  
  if (host.includes('azure') || host.includes('windows.net')) {
    return 'Azure Cache'
  }
  
  if (host.includes('gcp') || host.includes('google') || host.includes('memorystore')) {
    return 'Google Cloud Memorystore'
  }
  
  if (host.includes('digitalocean')) {
    return 'DigitalOcean Redis'
  }
  
  if (host.includes('heroku')) {
    return 'Heroku Redis'
  }
  
  if (host.includes('scaleway')) {
    return 'Scaleway Redis'
  }
  
  if (host.includes('vultr')) {
    return 'Vultr Redis'
  }
  
  if (host.includes('linode')) {
    return 'Linode Redis'
  }
  
  if (host.includes('ibm') || host.includes('bluemix')) {
    return 'IBM Cloud Redis'
  }
  
  if (host.includes('ovh')) {
    return 'OVH Redis'
  }
  
  if (host.includes('cloudflare')) {
    return 'Cloudflare Redis'
  }
  
  if (host.includes('vercel')) {
    return 'Vercel Redis'
  }
  
  // Handle localhost/development
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
    const portSuffix = config.port !== 6379 ? `:${config.port}` : ''
    return `Local Redis${portSuffix}`
  }
  
  // Handle IP addresses
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const portSuffix = config.port !== 6379 ? `:${config.port}` : ''
    return `Redis ${host}${portSuffix}`
  }
  
  // Handle domain names
  if (host.includes('.')) {
    const parts = host.split('.')
    if (parts.length >= 2) {
      const mainPart = parts[parts.length - 2] // Get the main domain part
      const portSuffix = config.port !== 6379 ? `:${config.port}` : ''
      return `${mainPart.charAt(0).toUpperCase() + mainPart.slice(1)} Redis${portSuffix}`
    }
  }
  
  // Fallback to hostname with port
  const portSuffix = config.port !== 6379 ? `:${config.port}` : ''
  return `${host.charAt(0).toUpperCase() + host.slice(1)}${portSuffix}`
}
