"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Clock, Edit, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface KeyValueViewerProps {
  keyName: string
  onKeyDeleted: () => void
}

interface KeyDetails {
  key: string
  type: string
  value: any
  ttl: number
  size: number
}

export function KeyValueViewer({ keyName, onKeyDeleted }: KeyValueViewerProps) {
  const [keyDetails, setKeyDetails] = useState<KeyDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadKeyDetails = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/redis/keys/${encodeURIComponent(keyName)}`)
      if (!response.ok) {
        throw new Error("Failed to load key details")
      }

      const data = await response.json()
      setKeyDetails(data)
      setEditValue(typeof data.value === "string" ? data.value : JSON.stringify(data.value, null, 2))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load key details")
    } finally {
      setIsLoading(false)
    }
  }

  const saveValue = async () => {
    if (!keyDetails) return

    try {
      const response = await fetch(`/api/redis/keys/${encodeURIComponent(keyName)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          value: editValue,
          type: keyDetails.type,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save value")
      }

      toast({
        title: "Value saved",
        description: "Key value updated successfully",
      })

      setIsEditing(false)
      await loadKeyDetails()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save value",
        variant: "destructive",
      })
    }
  }

  const formatValue = (value: any, type: string) => {
    switch (type.toLowerCase()) {
      case "string":
        return value
      case "hash":
      case "list":
      case "set":
      case "zset":
        return JSON.stringify(value, null, 2)
      case "rejson-rl":
        // REJSON data is already parsed as an object, format it nicely
        return JSON.stringify(value, null, 2)
      default:
        return String(value)
    }
  }

  const renderValue = () => {
    if (!keyDetails) return null

    if (isEditing) {
      return (
        <div className="space-y-4">
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
            placeholder="Enter value..."
          />
          <div className="flex items-center gap-2">
            <Button onClick={saveValue} size="sm">
              <Check className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              onClick={() => {
                setIsEditing(false)
                setEditValue(
                  typeof keyDetails.value === "string" ? keyDetails.value : JSON.stringify(keyDetails.value, null, 2),
                )
              }}
              size="sm"
              variant="outline"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <ScrollArea className="h-[300px] w-full border rounded-md p-4">
          <pre className="text-sm font-mono whitespace-pre-wrap">{formatValue(keyDetails.value, keyDetails.type)}</pre>
        </ScrollArea>
        <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
          <Edit className="w-4 h-4 mr-2" />
          Edit Value
        </Button>
      </div>
    )
  }

  useEffect(() => {
    if (keyName) {
      loadKeyDetails()
    }
  }, [keyName])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!keyDetails) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No key details available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metadata */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Key Information</h3>
          <Button onClick={loadKeyDetails} size="sm" variant="outline">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Key Name</label>
            <Input value={keyDetails.key} readOnly className="font-mono" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Type</label>
            <div>
              <Badge variant="secondary">{keyDetails.type}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Size</label>
            <p className="text-sm">{keyDetails.size} bytes</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">TTL</label>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <p className="text-sm">{keyDetails.ttl > 0 ? `${keyDetails.ttl} seconds` : "No expiry"}</p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Key Value */}
      <div className="space-y-4">
        <h3 className="font-semibold">Value</h3>
        {renderValue()}
      </div>
    </div>
  )
}
