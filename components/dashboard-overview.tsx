"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Database,
  Activity,
  Clock,
  HardDrive,
  Users,
  Zap,
  TrendingUp,
  Server,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface RedisStats {
  version: string
  uptime: string
  connectedClients: number
  usedMemory: string
  usedMemoryPeak: string
  totalKeys: number
  totalCommands: number
  keyspaceHits: number
  keyspaceMisses: number
  opsPerSec: number
}

interface KeyTypeStats {
  type: string
  count: number
  percentage: number
  color: string
}

export function DashboardOverview() {
  const [stats, setStats] = useState<RedisStats | null>(null)
  const [keyTypes, setKeyTypes] = useState<KeyTypeStats[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStats = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/redis/stats")
      if (!response.ok) {
        throw new Error("Failed to load Redis statistics")
      }

      const data = await response.json()
      setStats(data.stats)
      setKeyTypes(data.keyTypes)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load statistics")
    } finally {
      setIsLoading(false)
    }
  }

  const getHitRatio = () => {
    if (!stats || stats.keyspaceHits + stats.keyspaceMisses === 0) return 0
    return Math.round((stats.keyspaceHits / (stats.keyspaceHits + stats.keyspaceMisses)) * 100)
  }

  useEffect(() => {
    loadStats()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Redis Overview</h2>
          <p className="text-muted-foreground">Real-time statistics and performance metrics</p>
        </div>
        <Button onClick={loadStats} disabled={isLoading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
            <Database className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalKeys || 0}</div>
            <p className="text-xs text-muted-foreground">Across all databases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Clients</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.connectedClients || 0}</div>
            <p className="text-xs text-muted-foreground">Active connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operations/sec</CardTitle>
            <Zap className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.opsPerSec || 0}</div>
            <p className="text-xs text-muted-foreground">Current throughput</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hit Ratio</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getHitRatio()}%</div>
            <p className="text-xs text-muted-foreground">Cache efficiency</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Server Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Server Information
            </CardTitle>
            <CardDescription>Redis server details and configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Version</label>
                <p className="text-sm font-mono">{stats?.version || "N/A"}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Uptime</label>
                <p className="text-sm">{stats?.uptime || "N/A"}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Memory Usage</span>
                </div>
                <Badge variant="outline">{stats?.usedMemory || "N/A"}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Peak Memory</span>
                </div>
                <Badge variant="outline">{stats?.usedMemoryPeak || "N/A"}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">Total Commands</span>
                </div>
                <Badge variant="outline">{stats?.totalCommands?.toLocaleString() || "N/A"}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Key Types Distribution
            </CardTitle>
            <CardDescription>Breakdown of Redis data types in use</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {keyTypes.length > 0 ? (
              keyTypes.map((keyType) => (
                <div key={keyType.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${keyType.color}`} />
                      <span className="text-sm font-medium capitalize">{keyType.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{keyType.count}</span>
                      <Badge variant="outline" className="text-xs">
                        {keyType.percentage}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={keyType.percentage} className="h-2" />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No key type data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>Cache performance and hit/miss statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Keyspace Hits</span>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  {stats?.keyspaceHits?.toLocaleString() || 0}
                </Badge>
              </div>
              <Progress value={getHitRatio()} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Keyspace Misses</span>
                <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  {stats?.keyspaceMisses?.toLocaleString() || 0}
                </Badge>
              </div>
              <Progress value={100 - getHitRatio()} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Hit Ratio</span>
                <Badge
                  variant="secondary"
                  className={
                    getHitRatio() > 80
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : getHitRatio() > 60
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }
                >
                  {getHitRatio()}%
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {getHitRatio() > 80 ? "Excellent" : getHitRatio() > 60 ? "Good" : "Needs attention"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
