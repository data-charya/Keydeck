"use client"

import { useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import type { RedisConfig } from "@/lib/redis-uri"

interface ConnectionMaskState {
  isConnecting: boolean
  connectionProgress: string
  connectionError: string | null
}

export function useConnectionMask() {
  const [state, setState] = useState<ConnectionMaskState>({
    isConnecting: false,
    connectionProgress: "",
    connectionError: null,
  })
  
  const { toast } = useToast()

  const maskConnection = useCallback(async (
    connectionFn: (config: RedisConfig, name?: string, profileId?: string) => Promise<void>,
    config: RedisConfig,
    name?: string,
    profileId?: string
  ) => {
    setState({
      isConnecting: true,
      connectionProgress: "Initializing connection...",
      connectionError: null,
    })

    try {
      // Simulate connection steps for better UX
      const steps = [
        "Validating connection parameters...",
        "Establishing secure connection...",
        "Authenticating with Redis server...",
        "Verifying connection...",
        "Finalizing setup...",
      ]

      for (let i = 0; i < steps.length; i++) {
        setState(prev => ({
          ...prev,
          connectionProgress: steps[i],
        }))
        
        // Add small delay between steps for better UX
        if (i < steps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200))
        }
      }

      // Execute the actual connection
      await connectionFn(config, name, profileId)

      setState({
        isConnecting: false,
        connectionProgress: "Connected successfully!",
        connectionError: null,
      })

      toast({
        title: "Connection Established",
        description: `Successfully connected to ${name || "Redis server"}`,
      })

      // Clear success message after a short delay
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          connectionProgress: "",
        }))
      }, 2000)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Connection failed"
      
      setState({
        isConnecting: false,
        connectionProgress: "",
        connectionError: errorMessage,
      })

      // Provide user-friendly error messages
      let userFriendlyMessage = "Connection failed"
      if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("connection refused")) {
        userFriendlyMessage = "Cannot connect to Redis server. Please check if the server is running and the host/port are correct."
      } else if (errorMessage.includes("timeout")) {
        userFriendlyMessage = "Connection timed out. The server may be slow to respond or unreachable."
      } else if (errorMessage.includes("auth") || errorMessage.includes("password")) {
        userFriendlyMessage = "Authentication failed. Please check your username and password."
      } else if (errorMessage.includes("TLS") || errorMessage.includes("SSL")) {
        userFriendlyMessage = "TLS/SSL connection error. Please check your security settings."
      } else if (errorMessage.includes("network") || errorMessage.includes("ENOTFOUND")) {
        userFriendlyMessage = "Network error. Please check your internet connection and server address."
      }

      toast({
        title: "Connection Failed",
        description: userFriendlyMessage,
        variant: "destructive",
      })

      // Clear error after a delay
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          connectionError: null,
        }))
      }, 5000)
    }
  }, [toast])

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      connectionError: null,
    }))
  }, [])

  const resetState = useCallback(() => {
    setState({
      isConnecting: false,
      connectionProgress: "",
      connectionError: null,
    })
  }, [])

  return {
    isConnecting: state.isConnecting,
    connectionProgress: state.connectionProgress,
    connectionError: state.connectionError,
    maskConnection,
    clearError,
    resetState,
  }
}
