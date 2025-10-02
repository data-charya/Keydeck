"use client"

import { useState, useCallback, useEffect } from "react"
import type { RedisConfig } from "@/lib/redis-uri"
import { generateConnectionName, parseRedisUri } from "@/lib/redis-uri"
import { getSecureStorage } from "@/lib/client-crypto"
import { clearAllRedisData } from "@/lib/crypto"
import { secureApiRequest } from "@/lib/api-client"

interface RedisConnection extends RedisConfig {
  id: string
  name: string
  isConnected: boolean
  lastConnected?: Date
}

interface ConnectionManager {
  connections: RedisConnection[]
  activeConnectionId: string | null
}

const STORAGE_KEY = "redis-connections-encrypted"
const FALLBACK_STORAGE_KEY = "redis-connections-fallback"

export function useRedisConnection() {
  const [connectionManager, setConnectionManager] = useState<ConnectionManager>({
    connections: [],
    activeConnectionId: null,
  })
  const [isConnected, setIsConnected] = useState(false)

  // Load connections from secure storage on mount
  useEffect(() => {
    const loadConnections = async () => {
      try {
        const secureStorage = await getSecureStorage()
        
        const manager = await secureStorage.getItem(STORAGE_KEY) as ConnectionManager | null
        
        if (manager) {
          setConnectionManager(manager)
          
          // Try to restore the active connection
          if (manager.activeConnectionId) {
            const activeConnection = manager.connections.find(
              (conn: RedisConnection) => conn.id === manager.activeConnectionId
            )
            if (activeConnection) {
              restoreConnection(activeConnection)
            }
          }
        } else {
          // Try fallback storage
          const fallbackData = localStorage.getItem(FALLBACK_STORAGE_KEY)
          if (fallbackData) {
            try {
              const fallbackManager = JSON.parse(fallbackData) as ConnectionManager
              setConnectionManager(fallbackManager)
              
              if (fallbackManager.activeConnectionId) {
                const activeConnection = fallbackManager.connections.find(
                  (conn: RedisConnection) => conn.id === fallbackManager.activeConnectionId
                )
                if (activeConnection) {
                  restoreConnection(activeConnection)
                }
              }
            } catch (fallbackError) {
              localStorage.removeItem(FALLBACK_STORAGE_KEY)
            }
          } else {
          }
        }
      } catch (error) {
        console.warn('Failed to load connections from secure storage:', error)
        // If decryption fails, clear corrupted data
        try {
          const secureStorage = await getSecureStorage()
          secureStorage.removeItem(STORAGE_KEY)
          console.info('Cleared corrupted encrypted connection data')
        } catch (clearError) {
          console.warn('Failed to clear corrupted data:', clearError)
        }
        
        // Also try to clear any fallback data that might be corrupted
        try {
          localStorage.removeItem(FALLBACK_STORAGE_KEY)
        } catch (fallbackClearError) {
          console.warn('Failed to clear fallback data:', fallbackClearError)
        }
      }
    }

    loadConnections()
  }, [])

  // Save connections to secure storage whenever they change
  useEffect(() => {
    const saveConnections = async () => {
      try {
        const secureStorage = await getSecureStorage()
        await secureStorage.setItem(STORAGE_KEY, connectionManager)
        
        // Also save to fallback storage as backup
        localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(connectionManager))
      } catch (error) {
        console.error("Failed to save connections to secure storage:", error)
        // Fallback to localStorage
        try {
          localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(connectionManager))
        } catch (fallbackError) {
          console.error("Failed to save to fallback storage:", fallbackError)
        }
      }
    }

    // Only save if we have connections to avoid saving empty state on initial load
    if (connectionManager.connections.length > 0 || connectionManager.activeConnectionId) {
      saveConnections()
    }
  }, [connectionManager])

  const getActiveConnection = useCallback(() => {
    return connectionManager.connections.find(
      conn => conn.id === connectionManager.activeConnectionId
    ) || null
  }, [connectionManager])

  const connect = useCallback(async (config: RedisConfig, connectionName?: string) => {
    try {
      
      // Test the connection
      const response = await secureApiRequest("/api/redis/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })


      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to connect to Redis" }))
        console.error("Connect failed:", errorData)
        throw new Error(errorData.error || "Failed to connect to Redis")
      }

      const result = await response.json()

      // For URI connections, we need to parse the URI to get the proper config
      let finalConfig = config
      if ('uri' in config && config.uri && typeof config.uri === 'string') {
        try {
          finalConfig = parseRedisUri(config.uri)
        } catch (error) {
          console.warn('Failed to parse URI for connection object:', error)
          // Fallback to basic config
          const { uri, ...configWithoutUri } = config as any
          finalConfig = { 
            host: 'unknown', 
            port: 6379,
            ...configWithoutUri
          }
        }
      }

      // Create connection object
      const connectionId = `${finalConfig.host}:${finalConfig.port}:${finalConfig.database || 0}`
      
      // Generate a meaningful connection name if none provided
      const connectionName_ = connectionName || generateConnectionName(finalConfig)
      
      const newConnection: RedisConnection = {
        ...finalConfig,
        id: connectionId,
        name: connectionName_,
        isConnected: true,
        lastConnected: new Date(),
      }

      // Update connection manager
      setConnectionManager(prev => {
        const existingIndex = prev.connections.findIndex(conn => conn.id === connectionId)
        let updatedConnections = [...prev.connections]
        
        if (existingIndex >= 0) {
          // Update existing connection
          updatedConnections[existingIndex] = newConnection
        } else {
          // Add new connection
          updatedConnections.push(newConnection)
        }

        return {
          connections: updatedConnections,
          activeConnectionId: connectionId,
        }
      })

      setIsConnected(true)
    } catch (error) {
      console.error("Redis connection error:", error)
      throw error
    }
  }, [])

  const disconnect = useCallback(() => {
    setConnectionManager(prev => ({
      ...prev,
      activeConnectionId: null,
    }))
    setIsConnected(false)
  }, [])

  const switchConnection = useCallback(async (connectionId: string) => {
    const connection = connectionManager.connections.find(conn => conn.id === connectionId)
    if (!connection) {
      throw new Error("Connection not found")
    }

    try {
      await connect(connection, connection.name)
    } catch (error) {
      console.error("Failed to switch connection:", error)
      throw error
    }
  }, [connectionManager.connections, connect])

  const deleteConnection = useCallback((connectionId: string) => {
    setConnectionManager(prev => {
      const updatedConnections = prev.connections.filter(conn => conn.id !== connectionId)
      const newActiveConnectionId = prev.activeConnectionId === connectionId 
        ? (updatedConnections.length > 0 ? updatedConnections[0].id : null)
        : prev.activeConnectionId

      return {
        connections: updatedConnections,
        activeConnectionId: newActiveConnectionId,
      }
    })

    // If we deleted the active connection, disconnect
    if (connectionManager.activeConnectionId === connectionId) {
      setIsConnected(false)
    }
  }, [connectionManager.activeConnectionId])

  const updateConnectionName = useCallback((connectionId: string, newName: string) => {
    setConnectionManager(prev => ({
      ...prev,
      connections: prev.connections.map(conn =>
        conn.id === connectionId ? { ...conn, name: newName } : conn
      ),
    }))
  }, [])

  const updateConnection = useCallback((connectionId: string, updatedConfig: Partial<RedisConnection>) => {
    setConnectionManager(prev => ({
      ...prev,
      connections: prev.connections.map(conn =>
        conn.id === connectionId ? { ...conn, ...updatedConfig } : conn
      ),
    }))
  }, [])

  const clearAllData = useCallback(() => {
    console.info('Clearing all Redis connection data...')
    clearAllRedisData()
    setConnectionManager({
      connections: [],
      activeConnectionId: null,
    })
    setIsConnected(false)
  }, [])

  // Try to restore connection from stored connections
  const restoreConnection = useCallback(async (connection: RedisConnection) => {
    try {
      await connect(connection, connection.name)
    } catch (error) {
      console.error("Failed to restore Redis connection:", error)
      // Mark connection as disconnected
      setConnectionManager(prev => ({
        ...prev,
        connections: prev.connections.map(conn =>
          conn.id === connection.id ? { ...conn, isConnected: false } : conn
        ),
        activeConnectionId: null,
      }))
      setIsConnected(false)
    }
  }, [connect])

  return {
    connection: getActiveConnection(),
    isConnected,
    connections: connectionManager.connections,
    activeConnectionId: connectionManager.activeConnectionId,
    connect,
    disconnect,
    switchConnection,
    deleteConnection,
    updateConnectionName,
    updateConnection,
    restoreConnection,
    clearAllData,
  }
}
