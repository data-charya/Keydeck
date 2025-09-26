"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Database, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Clock,
  Server,
  Activity
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RedisConnection {
  id: string
  name: string
  host: string
  port: number
  password?: string
  database?: number
  isConnected: boolean
  lastConnected?: Date
}

interface ConnectionManagerProps {
  connections: RedisConnection[]
  activeConnectionId: string | null
  onConnect: (config: any, name?: string) => Promise<void>
  onSwitchConnection: (connectionId: string) => Promise<void>
  onDeleteConnection: (connectionId: string) => void
  onUpdateConnectionName: (connectionId: string, newName: string) => void
  onUpdateConnection: (connectionId: string, updatedConfig: Partial<RedisConnection>) => void
}

export function ConnectionManager({
  connections,
  activeConnectionId,
  onConnect,
  onSwitchConnection,
  onDeleteConnection,
  onUpdateConnectionName,
  onUpdateConnection,
}: ConnectionManagerProps) {
  const [isAddingConnection, setIsAddingConnection] = useState(false)
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [isEditingConnection, setIsEditingConnection] = useState(false)
  const [editingConnection, setEditingConnection] = useState<RedisConnection | null>(null)
  const { toast } = useToast()

  const handleAddConnection = async (config: any, name?: string) => {
    try {
      await onConnect(config, name)
      setIsAddingConnection(false)
      toast({
        title: "Connection added",
        description: `Successfully connected to ${name || `${config.host}:${config.port}`}`,
      })
    } catch (error) {
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect",
        variant: "destructive",
      })
    }
  }

  const handleSwitchConnection = async (connectionId: string) => {
    try {
      await onSwitchConnection(connectionId)
      toast({
        title: "Switched connection",
        description: "Successfully switched to the selected connection",
      })
    } catch (error) {
      toast({
        title: "Switch failed",
        description: error instanceof Error ? error.message : "Failed to switch connection",
        variant: "destructive",
      })
    }
  }

  const handleDeleteConnection = (connectionId: string) => {
    const connection = connections.find(conn => conn.id === connectionId)
    onDeleteConnection(connectionId)
    toast({
      title: "Connection deleted",
      description: `Deleted connection: ${connection?.name || connectionId}`,
    })
  }

  const startEditing = (connection: RedisConnection) => {
    setEditingConnectionId(connection.id)
    setEditingName(connection.name)
  }

  const saveEdit = () => {
    if (editingConnectionId && editingName.trim()) {
      onUpdateConnectionName(editingConnectionId, editingName.trim())
      setEditingConnectionId(null)
      setEditingName("")
      toast({
        title: "Connection updated",
        description: "Connection name updated successfully",
      })
    }
  }

  const cancelEdit = () => {
    setEditingConnectionId(null)
    setEditingName("")
  }

  const startEditingConnection = (connection: RedisConnection) => {
    setEditingConnection(connection)
    setIsEditingConnection(true)
  }

  const saveConnectionEdit = (updatedConfig: Partial<RedisConnection>) => {
    if (editingConnection) {
      onUpdateConnection(editingConnection.id, updatedConfig)
      setIsEditingConnection(false)
      setEditingConnection(null)
      toast({
        title: "Connection updated",
        description: "Connection details updated successfully",
      })
    }
  }

  const cancelConnectionEdit = () => {
    setIsEditingConnection(false)
    setEditingConnection(null)
  }

  const formatLastConnected = (date?: Date) => {
    if (!date) return "Never"
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return "Just now"
  }

  return (
    <Card>
      <CardContent className="p-0">
        {connections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No connections saved</p>
            <p className="text-sm">Add your first Redis connection to get started</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2 p-3">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className={`p-2 border rounded-lg transition-all duration-200 cursor-pointer ${
                    activeConnectionId === connection.id
                      ? "bg-primary/5 border-primary shadow-sm"
                      : "hover:bg-muted/50 hover:shadow-sm"
                  }`}
                  onClick={() => activeConnectionId !== connection.id && handleSwitchConnection(connection.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          connection.isConnected ? "bg-green-500" : "bg-gray-400"
                        }`} />
                        <Server className="w-4 h-4 text-muted-foreground" />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        {editingConnectionId === connection.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="h-8"
                              autoFocus
                            />
                            <Button size="sm" onClick={saveEdit} className="h-8 px-2">
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit} className="h-8 px-2">
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <h3 className="font-medium truncate">{connection.name}</h3>
                            <div className="text-sm text-muted-foreground">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="truncate block">
                                      {connection.host}:{connection.port}
                                      {connection.database && connection.database !== 0 && ` (db${connection.database})`}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-md">
                                    <div className="font-mono text-xs break-all">
                                      {connection.host}:{connection.port}
                                      {connection.database && connection.database !== 0 && ` (db${connection.database})`}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeConnectionId === connection.id && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </Badge>
                      )}
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatLastConnected(connection.lastConnected)}
                      </div>

                      <div className="relative">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Toggle dropdown visibility
                            const dropdown = e.currentTarget.nextElementSibling as HTMLElement
                            if (dropdown) {
                              dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block'
                            }
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        <div 
                          className="absolute right-0 top-8 bg-white dark:bg-gray-800 border shadow-lg z-[9999] min-w-[160px] rounded-md hidden"
                          style={{ display: 'none' }}
                        >
                          <div 
                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-nowrap cursor-pointer flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              onConnect(connection)
                              // Hide dropdown
                              const dropdown = e.currentTarget.parentElement as HTMLElement
                              if (dropdown) dropdown.style.display = 'none'
                            }}
                          >
                            <Activity className="w-4 h-4" />
                            Test Connection
                          </div>
                          <div 
                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-nowrap cursor-pointer flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              startEditingConnection(connection)
                              // Hide dropdown
                              const dropdown = e.currentTarget.parentElement as HTMLElement
                              if (dropdown) dropdown.style.display = 'none'
                            }}
                          >
                            <Edit className="w-4 h-4" />
                            Edit Connection
                          </div>
                          <div 
                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-nowrap cursor-pointer flex items-center gap-2 text-red-600 dark:text-red-400"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteConnection(connection.id)
                              // Hide dropdown
                              const dropdown = e.currentTarget.parentElement as HTMLElement
                              if (dropdown) dropdown.style.display = 'none'
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Connection
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Edit Connection Dialog */}
        <Dialog open={isEditingConnection} onOpenChange={setIsEditingConnection}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Connection</DialogTitle>
              <DialogDescription>
                Update the connection details for {editingConnection?.name}
              </DialogDescription>
            </DialogHeader>
            {editingConnection && (
              <EditConnectionForm
                connection={editingConnection}
                onSave={saveConnectionEdit}
                onCancel={cancelConnectionEdit}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

// Connection form component for adding new connections
function ConnectionForm({ 
  onSubmit, 
  onCancel 
}: { 
  onSubmit: (config: any, name?: string) => Promise<void>
  onCancel: () => void 
}) {
  const [config, setConfig] = useState({
    host: "localhost",
    port: 6379,
    password: "",
    database: 0,
  })
  const [connectionName, setConnectionName] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      await onSubmit(config, connectionName || undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to Redis")
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Connection Name (optional)</label>
        <Input
          value={connectionName}
          onChange={(e) => setConnectionName(e.target.value)}
          placeholder="My Redis Server"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Host</label>
          <Input
            value={config.host}
            onChange={(e) => setConfig({ ...config, host: e.target.value })}
            placeholder="localhost"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Port</label>
          <Input
            type="number"
            value={config.port}
            onChange={(e) => setConfig({ ...config, port: Number.parseInt(e.target.value) || 6379 })}
            placeholder="6379"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Password (optional)</label>
        <Input
          type="password"
          value={config.password}
          onChange={(e) => setConfig({ ...config, password: e.target.value })}
          placeholder="Enter password if required"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Database (optional)</label>
        <Input
          type="number"
          value={config.database}
          onChange={(e) => setConfig({ ...config, database: Number.parseInt(e.target.value) || 0 })}
          placeholder="0"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isConnecting || !config.host}>
          {isConnecting ? "Connecting..." : "Connect"}
        </Button>
      </div>
    </div>
  )
}

// Edit connection form component
function EditConnectionForm({
  connection,
  onSave,
  onCancel
}: {
  connection: RedisConnection
  onSave: (config: Partial<RedisConnection>) => void
  onCancel: () => void
}) {
  const [config, setConfig] = useState({
    name: connection.name,
    host: connection.host,
    port: connection.port,
    password: connection.password || "",
    database: connection.database || 0,
  })

  const handleSubmit = () => {
    onSave(config)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Connection Name</label>
        <Input
          value={config.name}
          onChange={(e) => setConfig({ ...config, name: e.target.value })}
          placeholder="My Redis Server"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Host</label>
          <Input
            value={config.host}
            onChange={(e) => setConfig({ ...config, host: e.target.value })}
            placeholder="your-redis-server.com or 1.2.3.4"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Port</label>
          <Input
            type="number"
            value={config.port}
            onChange={(e) => setConfig({ ...config, port: Number.parseInt(e.target.value) || 6379 })}
            placeholder="6379"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Password (optional)</label>
        <Input
          type="password"
          value={config.password}
          onChange={(e) => setConfig({ ...config, password: e.target.value })}
          placeholder="Enter password if required"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Database (optional)</label>
        <Input
          type="number"
          value={config.database}
          onChange={(e) => setConfig({ ...config, database: Number.parseInt(e.target.value) || 0 })}
          placeholder="0"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!config.host || !config.name}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}
