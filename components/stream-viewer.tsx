"use client"

import { useState, useEffect } from "react"
import { secureApiRequest } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Waves, Clock, Hash, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface StreamViewerProps {
  keyName: string
  streamData: any
}

interface StreamEntry {
  id: string
  fields: Record<string, string>
}

export function StreamViewer({ keyName, streamData }: StreamViewerProps) {
  const [entries, setEntries] = useState<StreamEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const loadStreamEntries = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await secureApiRequest(`/api/redis/stream/${encodeURIComponent(keyName)}`)
      if (!response.ok) {
        throw new Error("Failed to load stream entries")
      }

      const data = await response.json()
      setEntries(data.entries || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stream entries")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleEntryExpansion = (entryId: string) => {
    const newExpanded = new Set(expandedEntries)
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId)
    } else {
      newExpanded.add(entryId)
    }
    setExpandedEntries(newExpanded)
  }

  const formatStreamInfo = (info: any[]) => {
    const infoObj: Record<string, any> = {}
    for (let i = 0; i < info.length; i += 2) {
      if (info[i + 1] !== undefined) {
        infoObj[info[i]] = info[i + 1]
      }
    }
    return infoObj
  }

  useEffect(() => {
    if (streamData && streamData.recentEntries) {
      setEntries(streamData.recentEntries)
    }
  }, [streamData])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const streamInfo = streamData?.info ? formatStreamInfo(streamData.info) : {}

  return (
    <div className="space-y-6">
      {/* Stream Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Waves className="w-5 h-5" />
              <CardTitle>Stream Information</CardTitle>
            </div>
            <Button onClick={loadStreamEntries} disabled={isLoading} size="sm" variant="outline">
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <CardDescription>Details about the Redis stream</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Length</label>
              <p className="text-sm">{streamInfo.length || streamData?.length || 0} entries</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">First Entry ID</label>
              <p className="text-sm font-mono">{streamInfo['first-entry'] || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Last Entry ID</label>
              <p className="text-sm font-mono">{streamInfo['last-entry'] || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Groups</label>
              <p className="text-sm">{streamInfo.groups || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stream Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Stream Entries
          </CardTitle>
          <CardDescription>Recent entries in the stream</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading entries...</p>
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Waves className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No entries found in this stream</p>
                </div>
              ) : (
                entries.map((entry, index) => {
                  const isExpanded = expandedEntries.has(entry.id)
                  const fieldCount = Object.keys(entry.fields).length

                  return (
                    <div key={entry.id} className="border rounded-lg p-4">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleEntryExpansion(entry.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono text-xs">
                            {index + 1}
                          </Badge>
                          <div>
                            <p className="font-mono text-sm font-medium">{entry.id}</p>
                            <p className="text-xs text-muted-foreground">
                              {fieldCount} field{fieldCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="space-y-2">
                            {Object.entries(entry.fields).map(([field, value]) => (
                              <div key={field} className="flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-muted-foreground">Field:</span>
                                    <span className="font-mono text-sm font-medium">{field}</span>
                                  </div>
                                  <div className="bg-muted rounded-md p-2">
                                    <pre className="text-sm font-mono whitespace-pre-wrap break-words">{value}</pre>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
