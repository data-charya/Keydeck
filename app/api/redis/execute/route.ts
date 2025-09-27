import { type NextRequest, NextResponse } from "next/server"
import { getRedisClient, executeRedisCommand } from "@/lib/redis"

export async function POST(request: NextRequest) {
  let trimmedCommand = ""
  
  try {
    const { command } = await request.json()

    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "Command is required" }, { status: 400 })
    }

    const redisClient = getRedisClient()
    
    if (!redisClient) {
      return NextResponse.json({ error: "Redis client not connected" }, { status: 400 })
    }

    trimmedCommand = command.trim()
    const parts = trimmedCommand.split(/\s+/)
    const cmd = parts[0].toLowerCase()

    let result: any

    try {
      // Parse command arguments, handling quoted strings and numbers
      const args: any[] = []
      for (let i = 1; i < parts.length; i++) {
        const arg = parts[i]
        
        // Handle quoted strings
        if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
          args.push(arg.slice(1, -1))
        }
        // Handle numbers
        else if (!isNaN(Number(arg)) && arg !== '') {
          args.push(Number(arg))
        }
        // Handle boolean-like values
        else if (arg.toLowerCase() === 'true') {
          args.push(true)
        }
        else if (arg.toLowerCase() === 'false') {
          args.push(false)
        }
        // Handle special Redis keywords
        else if (arg.toUpperCase() === 'WITHSCORES' || arg.toUpperCase() === 'LIMIT' || 
                 arg.toUpperCase() === 'EX' || arg.toUpperCase() === 'PX' ||
                 arg.toUpperCase() === 'NX' || arg.toUpperCase() === 'XX') {
          args.push(arg.toUpperCase())
        }
        // Default to string
        else {
          args.push(arg)
        }
      }

      // Execute the command with all arguments
      result = await executeRedisCommand(cmd, ...args)
      
      // Format the result for better display
      if (result === null) {
        result = "(nil)"
      } else if (result === undefined) {
        result = "(empty)"
      } else if (Array.isArray(result)) {
        if (result.length === 0) {
          result = "(empty list or set)"
        } else {
          // Format arrays nicely
          result = result.map((item: any, index: number) => {
            if (typeof item === 'object' && item !== null) {
              return `${index + 1}) ${JSON.stringify(item)}`
            }
            return `${index + 1}) "${item}"`
          }).join("\n")
        }
      } else if (typeof result === 'object' && result !== null) {
        // Format objects (like hash results) nicely
        const entries = Object.entries(result)
        if (entries.length === 0) {
          result = "(empty hash)"
        } else {
          let output = ""
          let index = 1
          for (const [key, value] of entries) {
            output += `${index}) "${key}"\n${index + 1}) "${value}"\n`
            index += 2
          }
          result = output.trim()
        }
      }

      return NextResponse.json({
        success: true,
        result: result,
        command: command,
      })
    } catch (redisError) {
      throw new Error(`Redis command failed: ${redisError instanceof Error ? redisError.message : 'Unknown error'}`)
    }
  } catch (error) {
    console.error("Execute API: Redis command execution error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Command execution failed",
        command: trimmedCommand,
      },
      { status: 400 },
    )
  }
}
