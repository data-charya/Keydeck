"use client"
import { useEffect } from "react"
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database, Terminal, Search, Settings, Activity, BarChart3, Clock, HardDrive, TrendingUp, Plus } from "lucide-react"
import { ConnectionConfig } from "@/components/connection-config"
import { ConnectionManager } from "@/components/connection-manager"
import { ConnectionDiagnostics } from "@/components/connection-diagnostics"
import { SecuritySettings } from "@/components/security-settings"
import { KeyBrowser } from "@/components/key-browser"
import { RedisConsole } from "@/components/redis-console"
import { DashboardOverview } from "@/components/dashboard-overview"
import { PerformanceCharts } from "@/components/performance-charts"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRedisConnection } from "@/hooks/use-redis-connection"

export default function RedisGUI() {
  const { 
    connection, 
    isConnected, 
    connections,
    activeConnectionId,
    connect, 
    disconnect, 
    switchConnection,
    deleteConnection,
    updateConnectionName,
    restoreConnection 
  } = useRedisConnection()

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <Image 
                  src="/logo-dark.svg" 
                  alt="Redash" 
                  width={150} 
                  height={100}
                  className="dark:hidden"
                />
                <Image 
                  src="/logo-white.svg" 
                  alt="Redash" 
                  width={150} 
                  height={100}
                  className="hidden dark:block"
                />
                <p className="text-sm text-muted-foreground">Redis management for dummies</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isConnected && connection && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <Badge
                    variant="secondary"
                    className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                  >
                    {connection.name}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {connection.host}:{connection.port}
                  </span>
                </div>
              )}
              {!isConnected && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  <Badge variant="outline" className="text-muted-foreground">
                    Not Connected
                  </Badge>
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {!isConnected ? (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-foreground">Redis Connection</h2>
              <p className="text-muted-foreground">
                {connections.length > 0 
                  ? `You have ${connections.length} saved connection${connections.length > 1 ? 's' : ''} available`
                  : "Connect to your Redis server to get started"
                }
              </p>
            </div>

            {connections.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Available Connections */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Saved Connections</h3>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {connections.length}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    Click to connect instantly
                  </div>
                  <ConnectionManager
                    connections={connections}
                    activeConnectionId={activeConnectionId}
                    onConnect={connect}
                    onSwitchConnection={switchConnection}
                    onDeleteConnection={deleteConnection}
                    onUpdateConnectionName={updateConnectionName}
                  />
                </div>

                {/* New Connection Form */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">New Connection</h3>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    Create and save a new connection
                  </div>
                  <ConnectionConfig onConnect={connect} />
                </div>

                {/* Diagnostics Panel */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Diagnostics</h3>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    Test connection issues
                  </div>
                  <ConnectionDiagnostics 
                    host="localhost" 
                    port={6379}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* New Connection Form */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Connect to Redis</h3>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    Enter your Redis connection details
                  </div>
                  <ConnectionConfig onConnect={connect} />
                </div>

                {/* Diagnostics Panel */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Connection Diagnostics</h3>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    Troubleshoot connection issues
                  </div>
                  <ConnectionDiagnostics 
                    host="localhost" 
                    port={6379}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
              <TabsList className="grid w-full grid-cols-5 rounded-xl mb-6 bg-muted/50 backdrop-blur-sm border border-border/50 shadow-sm h-12 gap-2 p-2">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="charts" 
                className="flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Charts</span>
              </TabsTrigger>
              <TabsTrigger 
                value="browser" 
                className="flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Key Browser</span>
              </TabsTrigger>
              <TabsTrigger 
                value="console" 
                className="flex items-center gap-2"
              >
                <Terminal className="w-4 h-4" />
                <span>Console</span>
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </TabsTrigger>
              </TabsList>
            </div>

            <div className="min-h-[600px]">
              <TabsContent value="overview" className="mt-0">
              <div className="animate-in fade-in-0 duration-300">
                <DashboardOverview />
              </div>
            </TabsContent>

            <TabsContent value="charts" className="mt-0">
              <div className="animate-in fade-in-0 duration-300">
                <PerformanceCharts />
              </div>
            </TabsContent>

            <TabsContent value="browser" className="mt-0">
              <div className="animate-in fade-in-0 duration-300">
                <KeyBrowser />
              </div>
            </TabsContent>

            <TabsContent value="console" className="mt-0">
              <div className="animate-in fade-in-0 duration-300">
                <RedisConsole />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <div className="max-w-4xl space-y-6 animate-in fade-in-0 duration-300">
                <ConnectionManager
                  connections={connections}
                  activeConnectionId={activeConnectionId}
                  onConnect={connect}
                  onSwitchConnection={switchConnection}
                  onDeleteConnection={deleteConnection}
                  onUpdateConnectionName={updateConnectionName}
                />

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Current Connection
                    </CardTitle>
                    <CardDescription>Details about your active Redis connection</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="font-medium">Connection Details</span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Name: {connection?.name}</p>
                          <p>Host: {connection?.host}</p>
                          <p>Port: {connection?.port}</p>
                          <p>Database: {connection?.database || 0}</p>
                        </div>
                        <Button variant="outline" onClick={disconnect} size="sm" className="mt-2 bg-transparent">
                          Disconnect
                        </Button>
                      </div>

                      <div className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">Connection Status</span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Status: Connected</p>
                          <p>Uptime: Active</p>
                          <p>Last Connected: {connection?.lastConnected ? new Date(connection.lastConnected).toLocaleString() : 'Unknown'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <SecuritySettings />

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Application Settings
                    </CardTitle>
                    <CardDescription>Configure your Redis GUI preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-500" />
                          <span className="font-medium">Auto-refresh</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Automatically refresh key browser every 30 seconds
                        </p>
                        <Badge variant="outline" className="text-xs">
                          Enabled
                        </Badge>
                      </div>

                      <div className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-orange-500" />
                          <span className="font-medium">Memory Usage</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Show memory usage for keys and values</p>
                        <Badge variant="outline" className="text-xs">
                          Enabled
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  )
}
