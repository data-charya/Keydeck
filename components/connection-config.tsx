"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Database, AlertCircle, Info } from "lucide-react"

interface ConnectionConfigProps {
  onConnect: (config: RedisConfig, connectionName?: string) => Promise<void>
}

export interface RedisConfig {
  host: string
  port: number
  password?: string
  database?: number
}

export function ConnectionConfig({ onConnect }: ConnectionConfigProps) {
  const [config, setConfig] = useState<RedisConfig>({
    host: "localhost",
    port: 6379,
    password: "",
    database: 0,
  })
  const [connectionName, setConnectionName] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      await onConnect(config, connectionName || undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to Redis")
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Connect to Redis
        </CardTitle>
        <CardDescription>Enter your Redis connection details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Help Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Connection Requirements</p>
              <div className="text-sm space-y-1">
                <p>• <strong>Remote Redis Only:</strong> This app can only connect to Redis servers accessible from the internet</p>
                <p>• <strong>Public IP/Domain:</strong> Use your Redis server's public IP or domain name</p>
                <p>• <strong>Local Redis:</strong> Not supported - browsers block local network access for security</p>
                <p>• <strong>Self-hosted:</strong> Run this app locally to connect to local Redis instances</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="connectionName">Connection Name (optional)</Label>
          <Input
            id="connectionName"
            value={connectionName}
            onChange={(e) => setConnectionName(e.target.value)}
            placeholder="My Redis Server"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="host">Host</Label>
            <Input
              id="host"
              value={config.host}
              onChange={(e) => setConfig({ ...config, host: e.target.value })}
              placeholder="your-redis-server.com or 1.2.3.4"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              type="number"
              value={config.port}
              onChange={(e) => setConfig({ ...config, port: Number.parseInt(e.target.value) || 6379 })}
              placeholder="6379"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password (optional)</Label>
          <Input
            id="password"
            type="password"
            value={config.password}
            onChange={(e) => setConfig({ ...config, password: e.target.value })}
            placeholder="Enter password if required"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="database">Database (optional)</Label>
          <Input
            id="database"
            type="number"
            value={config.database}
            onChange={(e) => setConfig({ ...config, database: Number.parseInt(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">{error}</p>
                <div className="text-sm space-y-1">
                  <p className="font-medium">Troubleshooting steps:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Make sure Redis server is running</li>
                    <li>Check if the host and port are correct</li>
                    <li>Verify network connectivity</li>
                    <li>Check if Redis requires authentication</li>
                  </ul>
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    <p className="font-medium">Quick test:</p>
                    <p>Run <code className="bg-background px-1 rounded">redis-cli ping</code> in terminal</p>
                    <p>Should return: <code className="bg-background px-1 rounded">PONG</code></p>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Button onClick={handleConnect} disabled={isConnecting || !config.host} className="w-full">
          {isConnecting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            "Connect to Redis"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
