import { type NextRequest, NextResponse } from "next/server"
import { getRedisClient, executeRedisCommand } from "@/lib/redis"

export async function POST(request: NextRequest) {
  let trimmedCommand = ""
  
  try {
    const { command } = await request.json()
    console.log("API: Received command:", command)

    if (!command || typeof command !== "string") {
      console.log("API: Invalid command format")
      return NextResponse.json({ error: "Command is required" }, { status: 400 })
    }

    const redisClient = getRedisClient()
    console.log("API: Redis client status:", redisClient ? "connected" : "not connected")
    
    if (!redisClient) {
      console.log("API: No Redis client available")
      return NextResponse.json({ error: "Redis client not connected" }, { status: 400 })
    }

    trimmedCommand = command.trim()
    const parts = trimmedCommand.split(/\s+/)
    const cmd = parts[0].toUpperCase()

    console.log("Executing Redis command:", command)

    let result: any

    try {
      switch (cmd) {
        case "PING":
          result = await executeRedisCommand("ping")
          break

        case "INFO":
          result = await executeRedisCommand("info")
          break

        case "DBSIZE":
          result = await executeRedisCommand("dbsize")
          break

        case "KEYS":
          if (parts[1]) {
            const keys = await executeRedisCommand("keys", parts[1])
            if (keys.length === 0) {
              result = "(empty list or set)"
            } else {
              result = keys.map((key: string, index: number) => `${index + 1}) "${key}"`).join("\n")
            }
          } else {
            throw new Error("KEYS requires a pattern argument")
          }
          break

        case "GET":
          if (parts[1]) {
            result = await executeRedisCommand("get", parts[1])
            if (result === null) {
              result = "(nil)"
            }
          } else {
            throw new Error("GET requires a key argument")
          }
          break

        case "SET":
          if (parts[1] && parts[2]) {
            result = await executeRedisCommand("set", parts[1], parts.slice(2).join(" "))
          } else {
            throw new Error("SET requires key and value arguments")
          }
          break

        case "DEL":
          if (parts[1]) {
            result = await executeRedisCommand("del", parts[1])
          } else {
            throw new Error("DEL requires a key argument")
          }
          break

        case "EXISTS":
          if (parts[1]) {
            result = await executeRedisCommand("exists", parts[1])
          } else {
            throw new Error("EXISTS requires a key argument")
          }
          break

        case "TYPE":
          if (parts[1]) {
            result = await executeRedisCommand("type", parts[1])
          } else {
            throw new Error("TYPE requires a key argument")
          }
          break

        case "TTL":
          if (parts[1]) {
            result = await executeRedisCommand("ttl", parts[1])
          } else {
            throw new Error("TTL requires a key argument")
          }
          break

        case "EXPIRE":
          if (parts[1] && parts[2]) {
            result = await executeRedisCommand("expire", parts[1], parseInt(parts[2]))
          } else {
            throw new Error("EXPIRE requires key and seconds arguments")
          }
          break

        case "HGETALL":
          if (parts[1]) {
            const hashData = await executeRedisCommand("hgetall", parts[1])
            if (Object.keys(hashData).length === 0) {
              result = "(empty list or set)"
            } else {
              let output = ""
              let index = 1
              for (const [key, value] of Object.entries(hashData)) {
                output += `${index}) "${key}"\n${index + 1}) "${value}"\n`
                index += 2
              }
              result = output.trim()
            }
          } else {
            throw new Error("HGETALL requires a key argument")
          }
          break

        case "HSET":
          if (parts[1] && parts.length >= 3) {
            const key = parts[1]
            const fields = parts.slice(2)
            if (fields.length % 2 !== 0) {
              throw new Error("HSET requires field-value pairs")
            }
            const args: (string | number)[] = []
            for (let i = 0; i < fields.length; i += 2) {
              args.push(fields[i], fields[i + 1])
            }
            result = await executeRedisCommand("hset", key, ...args)
          } else {
            throw new Error("HSET requires key and field-value pairs")
          }
          break

        case "HGET":
          if (parts[1] && parts[2]) {
            result = await executeRedisCommand("hget", parts[1], parts[2])
            if (result === null) {
              result = "(nil)"
            }
          } else {
            throw new Error("HGET requires key and field arguments")
          }
          break

        case "HDEL":
          if (parts[1] && parts[2]) {
            result = await executeRedisCommand("hdel", parts[1], parts[2])
          } else {
            throw new Error("HDEL requires key and field arguments")
          }
          break

        case "LRANGE":
          if (parts[1] && parts[2] !== undefined && parts[3] !== undefined) {
            const start = parseInt(parts[2])
            const stop = parseInt(parts[3])
            const listData = await executeRedisCommand("lrange", parts[1], start, stop)
            if (listData.length === 0) {
              result = "(empty list or set)"
            } else {
              result = listData.map((item: string, index: number) => `${index + 1}) "${item}"`).join("\n")
            }
          } else {
            throw new Error("LRANGE requires key, start, and stop arguments")
          }
          break

        case "LPUSH":
          if (parts[1] && parts[2]) {
            result = await executeRedisCommand("lpush", parts[1], ...parts.slice(2))
          } else {
            throw new Error("LPUSH requires key and value arguments")
          }
          break

        case "RPUSH":
          if (parts[1] && parts[2]) {
            result = await executeRedisCommand("rpush", parts[1], ...parts.slice(2))
          } else {
            throw new Error("RPUSH requires key and value arguments")
          }
          break

        case "LLEN":
          if (parts[1]) {
            result = await executeRedisCommand("llen", parts[1])
          } else {
            throw new Error("LLEN requires a key argument")
          }
          break

        case "SADD":
          if (parts[1] && parts[2]) {
            result = await executeRedisCommand("sadd", parts[1], ...parts.slice(2))
          } else {
            throw new Error("SADD requires key and member arguments")
          }
          break

        case "SMEMBERS":
          if (parts[1]) {
            const members = await executeRedisCommand("smembers", parts[1])
            if (members.length === 0) {
              result = "(empty list or set)"
            } else {
              result = members.map((member: string, index: number) => `${index + 1}) "${member}"`).join("\n")
            }
          } else {
            throw new Error("SMEMBERS requires a key argument")
          }
          break

        case "SCARD":
          if (parts[1]) {
            result = await executeRedisCommand("scard", parts[1])
          } else {
            throw new Error("SCARD requires a key argument")
          }
          break

        case "ZADD":
          if (parts[1] && parts.length >= 4) {
            const key = parts[1]
            const args: (string | number)[] = []
            for (let i = 2; i < parts.length; i += 2) {
              if (i + 1 < parts.length) {
                args.push(parseFloat(parts[i + 1]), parts[i])
              }
            }
            result = await executeRedisCommand("zadd", key, ...args)
          } else {
            throw new Error("ZADD requires key and score-member pairs")
          }
          break

        case "ZRANGE":
          if (parts[1] && parts[2] !== undefined && parts[3] !== undefined) {
            const start = parseInt(parts[2])
            const stop = parseInt(parts[3])
            const withScores = parts[4] === "WITHSCORES"
            const members = await executeRedisCommand("zrange", parts[1], start, stop, withScores ? "WITHSCORES" : "")
            if (members.length === 0) {
              result = "(empty list or set)"
            } else {
              if (withScores) {
                result = members.map((member: string, index: number) => `${Math.floor(index / 2) + 1}) "${member}"`).join("\n")
              } else {
                result = members.map((member: string, index: number) => `${index + 1}) "${member}"`).join("\n")
              }
            }
          } else {
            throw new Error("ZRANGE requires key, start, and stop arguments")
          }
          break

        case "ZCARD":
          if (parts[1]) {
            result = await executeRedisCommand("zcard", parts[1])
          } else {
            throw new Error("ZCARD requires a key argument")
          }
          break

        case "FLUSHDB":
          result = await executeRedisCommand("flushdb")
          break

        case "FLUSHALL":
          result = await executeRedisCommand("flushall")
          break

        default:
          throw new Error(`Unknown or unsupported command: ${cmd}`)
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
    console.error("Redis command execution error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Command execution failed",
        command: trimmedCommand,
      },
      { status: 400 },
    )
  }
}
