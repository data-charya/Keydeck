"use client"

import { useState, useEffect } from "react"
import { secureApiRequest } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Key, RefreshCw, Trash2, Copy, Eye, EyeOff, Database, Hash, List, FileText, Layers, Waves, MapPin, Binary, BarChart3, Filter, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KeyValueViewer } from "@/components/key-value-viewer"
import { useToast } from "@/hooks/use-toast"

interface RedisKey {
  key: string
  type: string
  ttl: number
  size: number
}

export function KeyBrowser() {
  const [keys, setKeys] = useState<RedisKey[]>([])
  const [filteredKeys, setFilteredKeys] = useState<RedisKey[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setTypeFilter("all")
  }

  // Get unique types from keys with counts
  const getUniqueTypes = () => {
    const typeCounts: Record<string, number> = {}
    keys.forEach(key => {
      if (key?.type) {
        typeCounts[key.type] = (typeCounts[key.type] || 0) + 1
      }
    })
    
    return Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => a.type.localeCompare(b.type))
  }

  const loadKeys = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await secureApiRequest("/api/redis/keys")
      if (!response.ok) {
        throw new Error("Failed to load keys")
      }

      const data = await response.json()
      setKeys(data.keys || [])
      setFilteredKeys(data.keys || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load keys")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteKey = async (key: string) => {
    try {
      const response = await secureApiRequest(`/api/redis/keys/${encodeURIComponent(key)}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete key")
      }

      toast({
        title: "Key deleted",
        description: `Successfully deleted key: ${key}`,
      })

      // Refresh keys list
      await loadKeys()
      if (selectedKey === key) {
        setSelectedKey(null)
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete key",
        variant: "destructive",
      })
    }
  }

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast({
      title: "Copied",
      description: "Key copied to clipboard",
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "string":
        return <FileText className="w-4 h-4 dark:text-blue-400" />
      case "hash":
        return <Hash className="w-4 h-4 dark:text-green-600" />
      case "list":
        return <List className="w-4 h-4 dark:text-purple-400" />
      case "set":
        return <Database className="w-4 h-4 !dark:text-orange-100" />
      case "zset":
        return <Layers className="w-4 h-4 dark:text-red-400" />
      case "stream":
        return <Waves className="w-4 h-4 dark:text-cyan-400" />
      case "rejson-rl":
        return <FileText className="w-4 h-4 dark:text-indigo-400" />
      default:
        return <Key className="w-4 h-4 dark:text-gray-400" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "string":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "hash":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "list":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "set":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "zset":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "stream":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200"
      case "rejson-rl":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getTypeBorderColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "string":
        return "border-blue-500 dark:border-blue-400"
      case "hash":
        return "border-green-500 dark:border-green-400"
      case "list":
        return "border-purple-500 dark:border-purple-400"
      case "set":
        return "border-orange-500 dark:border-orange-400"
      case "zset":
        return "border-red-500 dark:border-red-400"
      case "stream":
        return "border-cyan-500 dark:border-cyan-400"
      case "rejson-rl":
        return "border-indigo-500 dark:border-indigo-400"
      default:
        return "border-gray-500 dark:border-gray-400"
    }
  }

  const getTypeBackgroundColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "string":
        return "bg-blue-50 dark:bg-blue-950/20"
      case "hash":
        return "bg-green-50 dark:bg-green-950/20"
      case "list":
        return "bg-purple-50 dark:bg-purple-950/20"
      case "set":
        return "bg-orange-50 dark:bg-orange-950/20"
      case "zset":
        return "bg-red-50 dark:bg-red-950/20"
      case "stream":
        return "bg-cyan-50 dark:bg-cyan-950/20"
      case "rejson-rl":
        return "bg-indigo-50 dark:bg-indigo-950/20"
      default:
        return "bg-gray-50 dark:bg-gray-950/20"
    }
  }

  const getTypeLeftBorderColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "string":
        return "border-l-blue-500 dark:border-l-blue-400"
      case "hash":
        return "border-l-green-500 dark:border-l-green-400"
      case "list":
        return "border-l-purple-500 dark:border-l-purple-400"
      case "set":
        return "border-l-orange-500 dark:border-l-orange-400"
      case "zset":
        return "border-l-red-500 dark:border-l-red-400"
      case "stream":
        return "border-l-cyan-500 dark:border-l-cyan-400"
      case "rejson-rl":
        return "border-l-indigo-500 dark:border-l-indigo-400"
      default:
        return "border-l-gray-500 dark:border-l-gray-400"
    }
  }

  useEffect(() => {
    loadKeys()
  }, [])

  useEffect(() => {
    let filtered = keys

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((key) => 
        key && key.key && typeof key.key === 'string' && 
        key.key.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((key) => 
        key && key.type && key.type.toLowerCase() === typeFilter.toLowerCase()
      )
    }

    setFilteredKeys(filtered)
  }, [searchTerm, typeFilter, keys])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Keys List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Redis Keys
              </CardTitle>
              <CardDescription>Browse and manage your Redis keys</CardDescription>
            </div>
            <Button onClick={loadKeys} disabled={isLoading} size="sm" variant="outline">
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search keys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types ({keys.length})</SelectItem>
                {getUniqueTypes().map((typeInfo) => (
                  <SelectItem 
                    key={typeInfo.type} 
                    value={typeInfo.type}
                    className={`${typeFilter === typeInfo.type ? getTypeBackgroundColor(typeInfo.type) : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        typeInfo.type.toLowerCase() === 'string' ? 'bg-blue-500' :
                        typeInfo.type.toLowerCase() === 'hash' ? 'bg-green-500' :
                        typeInfo.type.toLowerCase() === 'list' ? 'bg-purple-500' :
                        typeInfo.type.toLowerCase() === 'set' ? 'bg-orange-500' :
                        typeInfo.type.toLowerCase() === 'zset' ? 'bg-red-500' :
                        typeInfo.type.toLowerCase() === 'stream' ? 'bg-cyan-500' :
                        typeInfo.type.toLowerCase() === 'rejson-rl' ? 'bg-indigo-500' :
                        'bg-gray-500'
                      }`} />
                      <span className="capitalize">{typeInfo.type}</span>
                      <span className="text-muted-foreground">({typeInfo.count})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredKeys.length} of {keys.length} keys
            </span>
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                {searchTerm && <span>Search: "{searchTerm}"</span>}
                {typeFilter !== "all" && <span>Type: {typeFilter}</span>}
              </div>
              {(searchTerm || typeFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-6 px-2 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3 pr-2">
              {isLoading ? (
                // Skeleton loading states
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="p-4 border rounded-xl bg-card/50 border-border/60">
                    <div className="flex items-start gap-3">
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-5 w-12 rounded-full" />
                        </div>
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Skeleton className="w-7 h-7 rounded" />
                        <Skeleton className="w-7 h-7 rounded" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                filteredKeys.map((keyData) => (
                <div
                  key={keyData.key}
                  className={`group relative p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20 ${
                    selectedKey === keyData.key 
                      ? `${getTypeBackgroundColor(keyData.type)} ${getTypeBorderColor(keyData.type)} shadow-sm ring-1 ring-current/20 border-l-4 ${getTypeLeftBorderColor(keyData.type)}` 
                      : `bg-card/50 border-border hover:border-border hover:bg-muted/30`
                  }`}
                  onClick={() => setSelectedKey(keyData.key)}
                >
                  
                  {/* Main content */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-lg ${getTypeColor(keyData.type)}/20 flex-shrink-0`}>
                        {getTypeIcon(keyData.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1">
                                    <span 
                                      className="font-mono text-sm font-medium truncate text-foreground cursor-help text-wrap"
                                      title={keyData.key}
                                    >
                                      {keyData.key}
                                    </span>
                                    {keyData.key.length > 30 && (
                                      <span className="text-xs text-muted-foreground flex-shrink-0">
                                        ...
                                      </span>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-md">
                                  <div className="font-mono text-xs break-all">
                                    {keyData.key}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={`${getTypeColor(keyData.type)} text-xs font-medium px-2 py-0.5 flex-shrink-0`}
                          >
                            {keyData.type.toUpperCase()}
                          </Badge>
                        </div>
                        
                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            <span>{keyData.size?.toLocaleString() || '0'} bytes</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${keyData.ttl > 0 ? 'bg-orange-500' : 'bg-gray-400'}`} />
                            <span>{keyData.ttl > 0 ? `TTL: ${keyData.ttl}s` : "No expiry"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyKey(keyData.key)
                        }}
                        className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        title="Copy key"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteKey(keyData.key)
                        }}
                        className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                        title="Delete key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                ))
              )}

              {filteredKeys.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-muted/50">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-foreground">
                        {searchTerm ? "No keys found" : "No keys in database"}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        {searchTerm 
                          ? `No keys match your search "${searchTerm}". Try a different search term.`
                          : "This Redis database appears to be empty. Add some keys to get started."
                        }
                      </p>
                    </div>
                    {searchTerm && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSearchTerm("")}
                        className="mt-2"
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Key Value Viewer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Key Details
          </CardTitle>
          <CardDescription>View and edit key values</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedKey ? (
            <KeyValueViewer keyName={selectedKey} onKeyDeleted={() => setSelectedKey(null)} />
          ) : (
            <div className="flex items-center justify-center h-[500px] text-muted-foreground">
              <div className="text-center">
                <EyeOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a key to view its details</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
