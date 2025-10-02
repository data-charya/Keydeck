"use client"

import { useState, useEffect } from "react"
import { secureApiRequest } from "@/lib/api-client"
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
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface RedisStats {
  version: string
  uptime: string
  connectedClients: number
  usedMemory: string
  usedMemoryPeak: string
  maxMemory: string
  usedMemoryBytes: number
  maxMemoryBytes: number
  memoryUsagePercentage: number
  memoryFragmentationRatio: number
  memoryFragmentationBytes: number
  totalKeys: number
  totalCommands: number
  keyspaceHits: number
  keyspaceMisses: number
  opsPerSec: number
  redisMode: string
  os: string
  archBits: string
  processId: string
  tcpPort: string
  uptimeInSeconds: number
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
      const response = await secureApiRequest("/api/redis/stats")
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

  const getMemoryStatus = () => {
    if (!stats) return { status: 'unknown', color: 'gray', message: 'Unknown' }
    
    const percentage = stats.memoryUsagePercentage
    if (percentage >= 90) return { status: 'critical', color: 'red', message: 'Critical' }
    if (percentage >= 75) return { status: 'warning', color: 'yellow', message: 'Warning' }
    if (percentage >= 50) return { status: 'moderate', color: 'blue', message: 'Moderate' }
    return { status: 'good', color: 'green', message: 'Good' }
  }

  const getFragmentationStatus = () => {
    if (!stats) return { status: 'unknown', color: 'gray', message: 'Unknown' }
    
    const ratio = stats.memoryFragmentationRatio
    if (ratio > 1.5) return { status: 'high', color: 'red', message: 'High Fragmentation' }
    if (ratio > 1.2) return { status: 'moderate', color: 'yellow', message: 'Moderate Fragmentation' }
    return { status: 'good', color: 'green', message: 'Low Fragmentation' }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getOSInfo = (osString: string) => {
    if (!osString || typeof osString !== 'string') {
      return {
        name: 'Unknown',
        color: 'text-gray-500',
        bgColor: 'bg-gray-50 dark:bg-gray-800',
        borderColor: 'border-gray-200 dark:border-gray-700',
        logo: '🖥️',
        description: 'Operating system information not available'
      }
    }
    const os = osString.toLowerCase()
    
    if (os.includes('linux')) {
      return {
        name: 'Linux',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        description: 'Linux-based system',
        logo: '🐧'
      }
    } else if (os.includes('darwin') || os.includes('macos')) {
      return {
        name: 'macOS',
        color: 'text-gray-600 dark:text-gray-300',
        bgColor: 'bg-gray-50 dark:bg-gray-900',
        borderColor: 'border-gray-200 dark:border-gray-700',
        description: 'Apple macOS system',
        logo: '🍎'
      }
    } else if (os.includes('windows')) {
      return {
        name: 'Windows',
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-950',
        borderColor: 'border-blue-200 dark:border-blue-800',
        description: 'Microsoft Windows system',
        logo: '🪟'
      }
    } else if (os.includes('freebsd')) {
      return {
        name: 'FreeBSD',
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-950',
        borderColor: 'border-red-200 dark:border-red-800',
        description: 'FreeBSD Unix system',
        logo: '🔴'
      }
    } else if (os.includes('openbsd')) {
      return {
        name: 'OpenBSD',
        color: 'text-purple-500',
        bgColor: 'bg-purple-50 dark:bg-purple-950',
        borderColor: 'border-purple-200 dark:border-purple-800',
        description: 'OpenBSD Unix system',
        logo: '🟣'
      }
    } else if (os.includes('netbsd')) {
      return {
        name: 'NetBSD',
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-950',
        borderColor: 'border-green-200 dark:border-green-800',
        description: 'NetBSD Unix system',
        logo: '🟢'
      }
    } else if (os.includes('solaris') || os.includes('sunos')) {
      return {
        name: 'Solaris',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        description: 'Oracle Solaris system',
        logo: '☀️'
      }
    } else if (os.includes('aix')) {
      return {
        name: 'AIX',
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-50 dark:bg-indigo-950',
        borderColor: 'border-indigo-200 dark:border-indigo-800',
        description: 'IBM AIX system',
        logo: '🔵'
      }
    } else if (os.includes('hp-ux')) {
      return {
        name: 'HP-UX',
        color: 'text-pink-500',
        bgColor: 'bg-pink-50 dark:bg-pink-950',
        borderColor: 'border-pink-200 dark:border-pink-800',
        description: 'HP-UX Unix system',
        logo: '🩷'
      }
    } else {
      return {
        name: 'Unknown',
        color: 'text-gray-500',
        bgColor: 'bg-gray-50 dark:bg-gray-900',
        borderColor: 'border-gray-200 dark:border-gray-700',
        description: 'Unknown operating system',
        logo: '❓'
      }
    }
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

      {/* Prominent Memory Usage Card */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <HardDrive className="w-6 h-6 text-blue-500" />
            Memory Usage & Capacity
          </CardTitle>
          <CardDescription>Current memory utilization and capacity information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Memory Usage */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-${getMemoryStatus().color}-500`} />
                  <span className="font-semibold">Memory Usage</span>
                  <Badge 
                    variant={getMemoryStatus().status === 'critical' ? 'destructive' : 
                            getMemoryStatus().status === 'warning' ? 'secondary' : 'outline'}
                    className={`ml-2 ${
                      getMemoryStatus().status === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      getMemoryStatus().status === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}
                  >
                    {getMemoryStatus().message}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{stats?.usedMemory || "0B"}</div>
                  <div className="text-sm text-muted-foreground">
                    {stats?.maxMemoryBytes && stats.maxMemoryBytes > 0 ? `of ${stats.maxMemory}` : 'No limit set'}
                  </div>
                </div>
              </div>
              
              {stats?.maxMemoryBytes && stats.maxMemoryBytes > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Usage: {stats.memoryUsagePercentage}%</span>
                    <span>{formatBytes(stats.usedMemoryBytes)} / {formatBytes(stats.maxMemoryBytes)}</span>
                  </div>
                  <Progress 
                    value={stats.memoryUsagePercentage} 
                    className={`h-3 ${
                      stats.memoryUsagePercentage >= 90 ? 'bg-red-100' :
                      stats.memoryUsagePercentage >= 75 ? 'bg-yellow-100' :
                      'bg-green-100'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Memory Details */}
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Peak Memory</span>
                  <span className="text-sm font-mono">{stats?.usedMemoryPeak || "0B"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fragmentation</span>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline"
                      className={`text-xs ${
                        getFragmentationStatus().status === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        getFragmentationStatus().status === 'moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}
                    >
                      {stats?.memoryFragmentationRatio?.toFixed(2)}x
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {getFragmentationStatus().message}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
        {/* Enhanced Server Information */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Server className="w-6 h-6 text-green-500" />
              Server Information
            </CardTitle>
            <CardDescription>Redis server details and system configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Primary Server Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold">Redis Version</span>
                </div>
                <p className="text-lg font-mono font-bold text-green-600 dark:text-green-400">
                  {stats?.version || "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats?.redisMode === 'standalone' ? 'Standalone Mode' : 
                   stats?.redisMode === 'cluster' ? 'Cluster Mode' : 'Unknown Mode'}
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold">Uptime</span>
                </div>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {stats?.uptime || "0 minutes"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats?.uptimeInSeconds ? `${Math.floor(stats.uptimeInSeconds / 86400)} days total` : ''}
                </p>
              </div>
            </div>

            <Separator />

            {/* Operating System Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Operating System</h4>
              {stats?.os && (
                <div className={`p-4 rounded-lg border ${getOSInfo(stats.os).bgColor} ${getOSInfo(stats.os).borderColor}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-white dark:bg-black flex items-center justify-center`}>
                      <div className="text-center">
                        <div className="text-2xl mb-1">{getOSInfo(stats.os).logo}</div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-lg">{getOSInfo(stats.os).name}</h5>
                        <Badge variant="outline" className={`text-xs ${getOSInfo(stats.os).color} ${getOSInfo(stats.os).bgColor} ${getOSInfo(stats.os).borderColor}`}>
                          {stats.archBits}-bit
                        </Badge>
                      </div>
                      <p className={`text-sm text-muted-foreground mt-1 ${getOSInfo(stats.os).color}`}>
                        {getOSInfo(stats.os).description}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground dark:text-white mt-1">
                        {stats.os}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* System Details */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">System Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Process ID</label>
                  <p className="text-sm font-mono">{stats?.processId || "Unknown"}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">TCP Port</label>
                  <p className="text-sm font-mono">{stats?.tcpPort || "6379"}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Performance Summary */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Performance Summary</h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">Total Commands Processed</span>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {stats?.totalCommands?.toLocaleString() || "0"}
                  </Badge>
                </div>
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
