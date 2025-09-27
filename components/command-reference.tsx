"use client"

import React, { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Search, BookOpen, Copy, ExternalLink, Code, Clock, Tag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { REDIS_COMMANDS_DATA, COMMAND_CATEGORIES, searchCommands, type RedisCommand } from "@/lib/redis-commands"

interface CommandReferenceProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCommandSelect?: (command: string) => void
}

export function CommandReference({ open, onOpenChange, onCommandSelect }: CommandReferenceProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const { toast } = useToast()

  const filteredCommands = useMemo(() => {
    let commands = REDIS_COMMANDS_DATA

    // Filter by category
    if (selectedCategory !== "all") {
      commands = commands.filter(cmd => cmd.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      commands = searchCommands(searchQuery).filter(cmd => 
        selectedCategory === "all" || cmd.category === selectedCategory
      )
    }

    return commands
  }, [searchQuery, selectedCategory])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    })
  }

  const handleCommandSelect = (command: string) => {
    if (onCommandSelect) {
      onCommandSelect(command)
      onOpenChange(false)
    }
  }

  const CommandCard = ({ command }: { command: RedisCommand }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-mono">{command.name}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {command.category}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(command.syntax, "Syntax")}
              className="h-6 px-2"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <CardDescription className="text-sm">
          {command.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Syntax</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="bg-muted rounded-md p-3 font-mono text-sm flex-1 cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => handleCommandSelect(command.syntax)}
              title="Click to use in console"
            >
              {command.syntax}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(command.syntax, "Syntax")}
              className="h-8 px-2"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {command.examples.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Examples</span>
            </div>
            <div className="space-y-2">
              {command.examples.map((example, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="bg-muted rounded-md p-2 font-mono text-sm flex-1 cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleCommandSelect(example)}
                    title="Click to use in console"
                  >
                    {example}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(example, "Example")}
                    className="h-8 px-2"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Complexity: {command.complexity}</span>
          </div>
          <div className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            <span>Since: {command.since}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Redis Command Reference
            </DialogTitle>
            <DialogDescription>
              Comprehensive guide to Redis commands with syntax, examples, and usage details
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Search and Filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search commands, descriptions, or syntax..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm bg-background"
              >
                <option value="all">All</option>
                {COMMAND_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <Separator />

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''} found
              {searchQuery && ` for "${searchQuery}"`}
              {selectedCategory !== "all" && ` in ${selectedCategory}`}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {REDIS_COMMANDS_DATA.length} total commands
              </Badge>
            </div>
          </div>
        </div>

        {/* Commands List - Scrollable Area */}
        <div className="flex-1 px-6 min-h-0">
          <ScrollArea className="h-full">
            <div className="space-y-4 pb-4">
              {filteredCommands.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No commands found</p>
                  <p className="text-xs mt-2">Try adjusting your search or category filter</p>
                </div>
              ) : (
                filteredCommands.map((command) => (
                  <CommandCard key={command.name} command={command} />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Commands are organized by category and include syntax, examples, and complexity information
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
