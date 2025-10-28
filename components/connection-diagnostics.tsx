"use client"

import { useState } from "react"
import { secureApiRequest } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Terminal,
  Server,
  Network,
  Clock
} from "lucide-react"
import React from "react"

interface DiagnosticResult {
  test: string
  status: 'success' | 'error' | 'warning' | 'pending'
  message: string
  details?: string
}

interface ConnectionDiagnosticsProps {
  host?: string
  port?: number
  username?: string
  password?: string
  tls?: boolean
  onClose?: () => void
  allowManualInput?: boolean
}

export function ConnectionDiagnostics({ host, port, username, password, tls, onClose, allowManualInput = false }: ConnectionDiagnosticsProps) {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [manualConfig, setManualConfig] = useState({
    host: host || "",
    port: port || 6379,
    username: username || "",
    password: password || "",
    tls: tls || false
  })

  // Update manual config when props change
  React.useEffect(() => {
    if (host !== undefined || port !== undefined || username !== undefined || password !== undefined || tls !== undefined) {
      setManualConfig({
        host: host || "",
        port: port || 6379,
        username: username || "",
        password: password || "",
        tls: tls || false
      })
    }
  }, [host, port, username, password, tls])

  const currentConfig = {
    host: host || manualConfig.host,
    port: port || manualConfig.port,
    username: username || manualConfig.username,
    password: password || manualConfig.password,
    tls: tls !== undefined ? tls : manualConfig.tls
  }
  
  const hasValidConfig = currentConfig.host && currentConfig.port

  const runDiagnostics = async () => {
    setIsRunning(true)
    setDiagnostics([])

    const tests: DiagnosticResult[] = [
      {
        test: "Network Connectivity",
        status: 'pending',
        message: "Testing network connectivity..."
      },
      {
        test: "Port Availability",
        status: 'pending',
        message: "Checking if port is accessible..."
      },
      {
        test: "Redis Server Response",
        status: 'pending',
        message: "Testing Redis server response..."
      },
      {
        test: "Authentication",
        status: 'pending',
        message: "Testing authentication..."
      }
    ]

    setDiagnostics([...tests])

    // Test 1: Network Connectivity (Basic TCP connection test)
    try {
      const networkUrl = `/api/redis/diagnostics/network?host=${encodeURIComponent(currentConfig.host)}&port=${currentConfig.port}&tls=${currentConfig.tls}${currentConfig.username ? `&username=${encodeURIComponent(currentConfig.username)}` : ''}${currentConfig.password ? `&password=${encodeURIComponent(currentConfig.password)}` : ''}`
      const response = await secureApiRequest(networkUrl)
      const result = await response.json()
      
      tests[0] = {
        test: "Network Connectivity",
        status: result.success ? 'success' : 'error',
        message: result.success ? "Network connectivity is working" : "Network connectivity failed",
        details: result.details || `Successfully reached ${currentConfig.host}:${currentConfig.port}`
      }
      setDiagnostics([...tests])
    } catch (error) {
      tests[0] = {
        test: "Network Connectivity",
        status: 'error',
        message: "Network connectivity failed",
        details: `Cannot reach ${currentConfig.host}:${currentConfig.port}`
      }
      setDiagnostics([...tests])
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    // Test 2: Port Availability (Redis-specific connection test)
    try {
      const portUrl = `/api/redis/diagnostics/port?host=${encodeURIComponent(currentConfig.host)}&port=${currentConfig.port}&tls=${currentConfig.tls}${currentConfig.username ? `&username=${encodeURIComponent(currentConfig.username)}` : ''}${currentConfig.password ? `&password=${encodeURIComponent(currentConfig.password)}` : ''}`
      const response = await secureApiRequest(portUrl)
      const result = await response.json()
      
      tests[1] = {
        test: "Port Availability",
        status: result.success ? 'success' : 'error',
        message: result.success ? "Port is accessible" : "Port is not accessible",
        details: result.details || `Port ${currentConfig.port} is responding`
      }
      setDiagnostics([...tests])
    } catch (error) {
      tests[1] = {
        test: "Port Availability",
        status: 'error',
        message: "Port is not accessible",
        details: `Port ${currentConfig.port} is not responding. Make sure Redis server is running.`
      }
      setDiagnostics([...tests])
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    // Test 3: Redis Server Response (PING test)
    try {
      const pingUrl = `/api/redis/diagnostics/ping?host=${encodeURIComponent(currentConfig.host)}&port=${currentConfig.port}&tls=${currentConfig.tls}${currentConfig.username ? `&username=${encodeURIComponent(currentConfig.username)}` : ''}${currentConfig.password ? `&password=${encodeURIComponent(currentConfig.password)}` : ''}`
      const response = await secureApiRequest(pingUrl)
      const result = await response.json()
      
      tests[2] = {
        test: "Redis Server Response",
        status: result.success ? 'success' : 'error',
        message: result.success ? "Redis server is responding" : "Redis server is not responding",
        details: result.details || "Server responded to PING command"
      }
      setDiagnostics([...tests])
    } catch (error) {
      tests[2] = {
        test: "Redis Server Response",
        status: 'error',
        message: "Redis server is not responding",
        details: "Server did not respond to Redis protocol commands"
      }
      setDiagnostics([...tests])
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    // Test 4: Authentication (if password is provided)
    try {
      const authUrl = `/api/redis/diagnostics/auth?host=${encodeURIComponent(currentConfig.host)}&port=${currentConfig.port}&tls=${currentConfig.tls}${currentConfig.username ? `&username=${encodeURIComponent(currentConfig.username)}` : ''}${currentConfig.password ? `&password=${encodeURIComponent(currentConfig.password)}` : ''}`
      const response = await secureApiRequest(authUrl)
      const result = await response.json()
      
      tests[3] = {
        test: "Authentication",
        status: result.success ? 'success' : result.requiresAuth ? 'warning' : 'error',
        message: result.success ? "Authentication successful" : result.requiresAuth ? "Authentication required" : "Authentication failed",
        details: result.details || "No authentication required"
      }
      setDiagnostics([...tests])
    } catch (error) {
      tests[3] = {
        test: "Authentication",
        status: 'warning',
        message: "Authentication test skipped",
        details: "Cannot test authentication without server connection"
      }
      setDiagnostics([...tests])
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'pending':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
    }
  }

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Success</Badge>
      case 'error':
        return <Badge variant="destructive">Failed</Badge>
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Warning</Badge>
      case 'pending':
        return <Badge variant="outline">Testing...</Badge>
    }
  }

  const hasErrors = diagnostics.some(d => d.status === 'error')
  const hasWarnings = diagnostics.some(d => d.status === 'warning')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="w-5 h-5" />
          Connection Diagnostics
        </CardTitle>
        <CardDescription>
          {hasValidConfig 
            ? `Troubleshooting connection to ${currentConfig.host}:${currentConfig.port}${currentConfig.tls ? ' (TLS Enabled)' : ''}`
            : "Diagnostic tools for troubleshooting connection issues"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasValidConfig ? (
          <div className="text-center py-6">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-2 text-sm font-medium">
              No Connection Profile Selected
            </p>
            <p className="text-xs text-muted-foreground">
              Connect to a Redis server first, then diagnostics will be available here
            </p>
          </div>
        ) : diagnostics.length === 0 && !isRunning ? (
          <div className="text-center py-3">
            <p className="text-muted-foreground mb-3 text-sm">
              Test connection issues for <strong>{currentConfig.host}:{currentConfig.port}</strong>
            </p>
            <Button onClick={runDiagnostics} className="w-full" size="sm">
              <Terminal className="w-4 h-4 mr-2" />
              Run Diagnostics
            </Button>
          </div>
        ) : null}

        {isRunning && (
          <div className="space-y-3">
            {diagnostics.map((diagnostic, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                {getStatusIcon(diagnostic.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{diagnostic.test}</span>
                    {getStatusBadge(diagnostic.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{diagnostic.message}</p>
                  {diagnostic.details && (
                    <p className="text-xs text-muted-foreground mt-1">{diagnostic.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {diagnostics.length > 0 && !isRunning && (
          <div className="space-y-4">
            <div className="space-y-3">
              {diagnostics.map((diagnostic, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  {getStatusIcon(diagnostic.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{diagnostic.test}</span>
                      {getStatusBadge(diagnostic.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{diagnostic.message}</p>
                    {diagnostic.details && (
                      <p className="text-xs text-muted-foreground mt-1">{diagnostic.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {(hasErrors || hasWarnings) && (
              <Alert variant={hasErrors ? "destructive" : "default"}>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">
                      {hasErrors ? "Connection issues detected" : "Potential issues found"}
                    </p>
                    <div className="text-sm space-y-1">
                      <p className="font-medium">Recommended solutions:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Make sure Redis server is running</li>
                        <li>Check if Redis is listening on the correct port</li>
                        <li>Verify firewall settings</li>
                        <li>Try connecting with redis-cli: <code className="bg-background px-1 rounded">redis-cli -h {host} -p {port}</code></li>
                      </ul>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={runDiagnostics} variant="outline" className="w-full" size="sm">
              <Terminal className="w-4 h-4 mr-2" />
              Run Again
            </Button>
          </div>
        )}

        {/* Quick Start Guide */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
            <Server className="w-4 h-4" />
            Quick Start
          </h4>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">1.</span>
              <span>Start Redis:</span>
              <code className="bg-background px-1 rounded text-xs">redis-server</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">2.</span>
              <span>Test:</span>
              <code className="bg-background px-1 rounded text-xs">redis-cli ping</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">3.</span>
              <span>Should return:</span>
              <code className="bg-background px-1 rounded text-xs">PONG</code>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
