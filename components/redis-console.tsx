"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Terminal, Send, Trash2, Copy, Clock, CheckCircle, XCircle, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRedisConnection } from "@/hooks/use-redis-connection"

interface ConsoleEntry {
  id: string
  command: string
  response: string
  timestamp: Date
  status: "success" | "error" | "info"
  executionTime: number
}

const REDIS_COMMANDS = [
  "GET",
  "SET",
  "DEL",
  "EXISTS",
  "KEYS",
  "TYPE",
  "TTL",
  "EXPIRE",
  "HGET",
  "HSET",
  "HGETALL",
  "HDEL",
  "HKEYS",
  "HVALS",
  "LPUSH",
  "RPUSH",
  "LPOP",
  "RPOP",
  "LLEN",
  "LRANGE",
  "SADD",
  "SREM",
  "SMEMBERS",
  "SCARD",
  "SISMEMBER",
  "ZADD",
  "ZREM",
  "ZRANGE",
  "ZCARD",
  "ZSCORE",
  "PING",
  "INFO",
  "FLUSHDB",
  "FLUSHALL",
  "DBSIZE",
]

export function RedisConsole() {
  const [command, setCommand] = useState("")
  const [history, setHistory] = useState<ConsoleEntry[]>([])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isExecuting, setIsExecuting] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const { isConnected, connection } = useRedisConnection()

  const executeCommand = async () => {
    if (!command.trim() || isExecuting) return

    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect to Redis first before executing commands.",
        variant: "destructive",
      })
      return
    }

    const trimmedCommand = command.trim()
    setIsExecuting(true)
    const startTime = Date.now()

    try {
      console.log("Executing command:", trimmedCommand)
      
      const response = await fetch("/api/redis/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command: trimmedCommand }),
      })

      console.log("Response status:", response.status)
      const data = await response.json()
      console.log("Response data:", data)
      
      const executionTime = Date.now() - startTime

      const entry: ConsoleEntry = {
        id: Date.now().toString(),
        command: trimmedCommand,
        response: data.result || data.error || "No response",
        timestamp: new Date(),
        status: response.ok ? "success" : "error",
        executionTime,
      }

      setHistory((prev) => [...prev, entry])

      // Add to command history if not duplicate
      if (commandHistory[0] !== trimmedCommand) {
        setCommandHistory((prev) => [trimmedCommand, ...prev.slice(0, 49)]) // Keep last 50 commands
      }

      // Show toast for errors
      if (!response.ok) {
        toast({
          title: "Command Error",
          description: data.error || "Command execution failed",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Console execution error:", error)
      const executionTime = Date.now() - startTime
      const entry: ConsoleEntry = {
        id: Date.now().toString(),
        command: trimmedCommand,
        response: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date(),
        status: "error",
        executionTime,
      }

      setHistory((prev) => [...prev, entry])
      
      toast({
        title: "Connection Error",
        description: "Failed to execute command. Make sure you're connected to Redis.",
        variant: "destructive",
      })
    } finally {
      setIsExecuting(false)
      setCommand("")
      setHistoryIndex(-1)
      setShowSuggestions(false)
    }
  }

  const clearHistory = () => {
    setHistory([])
    toast({
      title: "Console cleared",
      description: "Command history has been cleared",
    })
  }

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd)
    toast({
      title: "Copied",
      description: "Command copied to clipboard",
    })
  }

  const copyResponse = (response: string) => {
    navigator.clipboard.writeText(response)
    toast({
      title: "Copied",
      description: "Response copied to clipboard",
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (showSuggestions && suggestions.length > 0) {
        setCommand(suggestions[0])
        setShowSuggestions(false)
      } else {
        executeCommand()
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setCommand(commandHistory[newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCommand(commandHistory[newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setCommand("")
      }
    } else if (e.key === "Tab") {
      e.preventDefault()
      if (suggestions.length > 0) {
        setCommand(suggestions[0])
        setShowSuggestions(false)
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  const handleCommandChange = (value: string) => {
    setCommand(value)
    setHistoryIndex(-1)

    // Show command suggestions
    if (value.trim()) {
      const matches = REDIS_COMMANDS.filter((cmd) => cmd.toLowerCase().startsWith(value.toLowerCase()))
      setSuggestions(matches)
      setShowSuggestions(matches.length > 0 && matches[0].toLowerCase() !== value.toLowerCase())
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const getStatusIcon = (status: ConsoleEntry["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "info":
        return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  const formatResponse = (response: string, status: ConsoleEntry["status"]) => {
    try {
      // Try to parse as JSON for better formatting
      const parsed = JSON.parse(response)
      return JSON.stringify(parsed, null, 2)
    } catch {
      // Return as-is if not JSON
      return response
    }
  }

  useEffect(() => {
    // Scroll to bottom when new entries are added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history])

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  return (
    <Card className="h-[700px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Redis Console
            </CardTitle>
            <CardDescription>
              Execute Redis commands directly
              {connection && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({connection.name}: {connection.host}:{connection.port})
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isConnected ? "default" : "destructive"} 
              className="text-xs"
            >
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {history.length} commands
            </Badge>
            <Button onClick={clearHistory} size="sm" variant="outline" disabled={history.length === 0}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Command History */}
        <ScrollArea className="flex-1 border rounded-lg p-4 bg-muted/20" ref={scrollRef}>
          <div className="space-y-4 font-mono text-sm">
            {history.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No commands executed yet</p>
                <p className="text-xs mt-2">Try: PING, INFO, or KEYS *</p>
              </div>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(entry.status)}
                      <span className="text-xs text-muted-foreground">{entry.timestamp.toLocaleTimeString()}</span>
                      <Badge variant="outline" className="text-xs">
                        {entry.executionTime}ms
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => copyCommand(entry.command)} className="h-6 px-2">
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-background border rounded p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-primary">redis&gt;</span>
                      <span className="text-foreground">{entry.command}</span>
                    </div>
                    <div
                      className={`pl-4 border-l-2 ${
                        entry.status === "success"
                          ? "border-green-500 text-green-700 dark:text-green-300"
                          : entry.status === "error"
                            ? "border-red-500 text-red-700 dark:text-red-300"
                            : "border-blue-500 text-blue-700 dark:text-blue-300"
                      }`}
                    >
                      <pre className="whitespace-pre-wrap text-xs">{formatResponse(entry.response, entry.status)}</pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyResponse(entry.response)}
                        className="h-6 px-2 mt-2"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Command Input */}
        <div className="space-y-2">
          {showSuggestions && suggestions.length > 0 && (
            <div className="bg-muted rounded-md p-2">
              <div className="text-xs text-muted-foreground mb-1">Suggestions:</div>
              <div className="flex flex-wrap gap-1">
                {suggestions.slice(0, 5).map((suggestion) => (
                  <Button
                    key={suggestion}
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCommand(suggestion + " ")
                      setShowSuggestions(false)
                      inputRef.current?.focus()
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
              <Terminal className="w-4 h-4" />
              <span>redis&gt;</span>
            </div>
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={command}
                onChange={(e) => handleCommandChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isConnected ? "Enter Redis command (e.g., PING, GET key, SET key value)" : "Connect to Redis first"}
                className="font-mono"
                disabled={isExecuting || !isConnected}
              />
            </div>
            <Button onClick={executeCommand} disabled={!command.trim() || isExecuting || !isConnected} size="sm">
              {isExecuting ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Press <kbd className="px-1 py-0.5 bg-muted rounded">↑</kbd>{" "}
            <kbd className="px-1 py-0.5 bg-muted rounded">↓</kbd> for history,{" "}
            <kbd className="px-1 py-0.5 bg-muted rounded">Tab</kbd> for autocomplete,{" "}
            <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> to execute
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
