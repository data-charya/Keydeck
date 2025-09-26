"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Activity,
  MemoryStick,
  Users,
  TrendingUp,
  RefreshCw,
  Play,
  Pause,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from "lucide-react"

interface PerformanceData {
  timestamp: number
  opsPerSec: number
  memoryUsage: number
  connectedClients: number
  hitRatio: number
  keyspaceHits: number
  keyspaceMisses: number
}

interface ChartData {
  time: string
  opsPerSec: number
  memoryUsage: number
  connectedClients: number
  hitRatio: number
}

const CHART_COLORS = {
  opsPerSec: "#3b82f6",
  memoryUsage: "#10b981",
  connectedClients: "#f59e0b",
  hitRatio: "#8b5cf6",
  hits: "#22c55e",
  misses: "#ef4444",
}

export function PerformanceCharts() {
  const [data, setData] = useState<PerformanceData[]>([])
  const [isCollecting, setIsCollecting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const collectData = async () => {
    try {
      const response = await fetch("/api/redis/stats")
      if (!response.ok) {
        throw new Error("Failed to load Redis statistics")
      }

      const result = await response.json()
      const stats = result.stats

      const newDataPoint: PerformanceData = {
        timestamp: Date.now(),
        opsPerSec: stats.opsPerSec || 0,
        memoryUsage: parseMemoryUsage(stats.usedMemory),
        connectedClients: stats.connectedClients || 0,
        hitRatio: calculateHitRatio(stats.keyspaceHits, stats.keyspaceMisses),
        keyspaceHits: stats.keyspaceHits || 0,
        keyspaceMisses: stats.keyspaceMisses || 0,
      }

      setData(prev => {
        const updated = [...prev, newDataPoint]
        // Keep only last 60 data points (5 minutes at 5-second intervals)
        return updated.slice(-60)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to collect data")
    }
  }

  const parseMemoryUsage = (memoryStr: string): number => {
    if (!memoryStr) return 0
    
    const match = memoryStr.match(/^(\d+(?:\.\d+)?)([KMGT]?B)$/)
    if (!match) return 0
    
    const value = parseFloat(match[1])
    const unit = match[2]
    
    const multipliers: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024,
    }
    
    return value * (multipliers[unit] || 1)
  }

  const calculateHitRatio = (hits: number, misses: number): number => {
    if (hits + misses === 0) return 0
    return Math.round((hits / (hits + misses)) * 100)
  }

  const formatMemory = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  const startCollection = () => {
    setIsCollecting(true)
    setError(null)
    
    // Collect initial data
    collectData()
    
    // Set up interval for data collection
    intervalRef.current = setInterval(collectData, 5000) // Every 5 seconds
  }

  const stopCollection = () => {
    setIsCollecting(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const clearData = () => {
    setData([])
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Transform data for charts
  const chartData: ChartData[] = data.map((point, index) => ({
    time: new Date(point.timestamp).toLocaleTimeString(),
    opsPerSec: point.opsPerSec,
    memoryUsage: point.memoryUsage,
    connectedClients: point.connectedClients,
    hitRatio: point.hitRatio,
  }))

  // Calculate averages
  const averages = data.length > 0 ? {
    opsPerSec: Math.round(data.reduce((sum, point) => sum + point.opsPerSec, 0) / data.length),
    memoryUsage: data.reduce((sum, point) => sum + point.memoryUsage, 0) / data.length,
    connectedClients: Math.round(data.reduce((sum, point) => sum + point.connectedClients, 0) / data.length),
    hitRatio: Math.round(data.reduce((sum, point) => sum + point.hitRatio, 0) / data.length),
  } : null

  // Hit/Miss pie chart data
  const latestData = data[data.length - 1]
  const pieData = latestData ? [
    { name: 'Hits', value: latestData.keyspaceHits, color: CHART_COLORS.hits },
    { name: 'Misses', value: latestData.keyspaceMisses, color: CHART_COLORS.misses },
  ] : []

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'memoryUsage' ? formatMemory(entry.value) : entry.value}
              {entry.name === 'hitRatio' && '%'}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Performance Charts</h2>
          <p className="text-muted-foreground">Real-time Redis performance monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={isCollecting ? stopCollection : startCollection}
            variant={isCollecting ? "destructive" : "default"}
            size="sm"
          >
            {isCollecting ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </Button>
          <Button onClick={clearData} variant="outline" size="sm" disabled={data.length === 0}>
            Clear Data
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-4 animate-in fade-in-0 slide-in-from-top-2 duration-300">
        <Badge 
          variant={isCollecting ? "default" : "secondary"}
          className={`transition-all duration-200 ${isCollecting ? 'animate-pulse' : ''}`}
        >
          {isCollecting ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Collecting
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              Stopped
            </div>
          )}
        </Badge>
        <span className="text-sm text-muted-foreground transition-all duration-200">
          Data points: <span className="font-mono font-semibold">{data.length}</span> / 60
        </span>
        {averages && (
          <span className="text-sm text-muted-foreground transition-all duration-200">
            Avg Ops/sec: <span className="font-mono font-semibold text-blue-600">{averages.opsPerSec}</span> | 
            Avg Hit Ratio: <span className="font-mono font-semibold text-green-600">{averages.hitRatio}%</span>
          </span>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start data collection to begin monitoring Redis performance metrics
            </p>
            <Button onClick={startCollection}>
              <Play className="w-4 h-4 mr-2" />
              Start Monitoring
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 backdrop-blur-sm border border-border/50 shadow-sm">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 group relative overflow-hidden transition-all duration-200 hover:scale-[1.02]"
            >
              <BarChart3 className="w-4 h-4 transition-all duration-200" />
              <span className="transition-all duration-200">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="operations" 
              className="flex items-center gap-2 group relative overflow-hidden transition-all duration-200 hover:scale-[1.02]"
            >
              <Activity className="w-4 h-4 transition-all duration-200" />
              <span className="transition-all duration-200">Operations</span>
            </TabsTrigger>
            <TabsTrigger 
              value="memory" 
              className="flex items-center gap-2 group relative overflow-hidden transition-all duration-200 hover:scale-[1.02]"
            >
              <MemoryStick className="w-4 h-4 transition-all duration-200" />
              <span className="transition-all duration-200">Memory</span>
            </TabsTrigger>
            <TabsTrigger 
              value="clients" 
              className="flex items-center gap-2 group relative overflow-hidden transition-all duration-200 hover:scale-[1.02]"
            >
              <Users className="w-4 h-4 transition-all duration-200" />
              <span className="transition-all duration-200">Clients</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overview Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Operations per Second */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Operations per Second
                  </CardTitle>
                  <CardDescription>Real-time command throughput</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="opsPerSec"
                        stroke={CHART_COLORS.opsPerSec}
                        fill={CHART_COLORS.opsPerSec}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Hit Ratio */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Cache Hit Ratio
                  </CardTitle>
                  <CardDescription>Keyspace hit/miss performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="hitRatio"
                        stroke={CHART_COLORS.hitRatio}
                        strokeWidth={2}
                        dot={{ fill: CHART_COLORS.hitRatio }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Hit/Miss Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Hit/Miss Distribution
                </CardTitle>
                <CardDescription>Latest keyspace hits vs misses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value.toLocaleString()}`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Operations Performance
                </CardTitle>
                <CardDescription>Detailed operations per second analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="opsPerSec"
                      stroke={CHART_COLORS.opsPerSec}
                      strokeWidth={3}
                      name="Operations/sec"
                      dot={{ fill: CHART_COLORS.opsPerSec, strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="memory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MemoryStick className="w-5 h-5" />
                  Memory Usage
                </CardTitle>
                <CardDescription>Redis memory consumption over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis tickFormatter={(value) => formatMemory(value)} />
                    <Tooltip 
                      content={<CustomTooltip />}
                      formatter={(value: number) => [formatMemory(value), 'Memory Usage']}
                    />
                    <Area
                      type="monotone"
                      dataKey="memoryUsage"
                      stroke={CHART_COLORS.memoryUsage}
                      fill={CHART_COLORS.memoryUsage}
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Connected Clients
                </CardTitle>
                <CardDescription>Number of active client connections</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="connectedClients" 
                      fill={CHART_COLORS.connectedClients}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
