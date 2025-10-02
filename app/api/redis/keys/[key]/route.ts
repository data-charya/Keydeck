import { type NextRequest, NextResponse } from "next/server"
import { getRedisClient, getKeyInfo } from "@/lib/redis"
import { withAPISecurity } from "@/lib/api-security"

async function getKeyHandler(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const key = decodeURIComponent(params.key)
    const redisClient = getRedisClient()

    if (!redisClient) {
      return NextResponse.json({ error: "Redis client not connected" }, { status: 400 })
    }

    const keyDetails = await getKeyInfo(key)

    if (!keyDetails) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 })
    }

    return NextResponse.json(keyDetails)
  } catch (error) {
    console.error("Key Details API: Error fetching key details:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch key details" 
    }, { status: 500 })
  }
}

async function putKeyHandler(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const key = decodeURIComponent(params.key)
    const { value, type } = await request.json()
    const redisClient = getRedisClient()

    if (!redisClient) {
      return NextResponse.json({ error: "Redis client not connected" }, { status: 400 })
    }

    // Update the key based on its type
    switch (type.toLowerCase()) {
      case 'string':
        await redisClient.set(key, value)
        break
      case 'hash':
        if (typeof value === 'object') {
          await redisClient.del(key) // Clear existing hash
          if (Object.keys(value).length > 0) {
            await redisClient.hset(key, value)
          }
        }
        break
      case 'list':
        if (Array.isArray(value)) {
          await redisClient.del(key) // Clear existing list
          if (value.length > 0) {
            await redisClient.lpush(key, ...value)
          }
        }
        break
      case 'set':
        if (Array.isArray(value)) {
          await redisClient.del(key) // Clear existing set
          if (value.length > 0) {
            await redisClient.sadd(key, ...value)
          }
        }
        break
      case 'zset':
        if (typeof value === 'object') {
          await redisClient.del(key) // Clear existing zset
          const args: (string | number)[] = []
          for (const [member, score] of Object.entries(value)) {
            args.push(parseFloat(score as string), member)
          }
          if (args.length > 0) {
            await redisClient.zadd(key, ...args)
          }
        }
        break
      case 'rejson-rl':
        // Handle REJSON (RedisJSON) keys
        try {
          // Parse the JSON value to ensure it's valid
          const jsonValue = typeof value === 'string' ? JSON.parse(value) : value
          // Use JSON.SET to update the REJSON key
          await redisClient.call('JSON.SET', key, '.', JSON.stringify(jsonValue))
        } catch (jsonError) {
          throw new Error(`Invalid JSON format: ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}`)
        }
        break
      default:
        throw new Error(`Unsupported key type: ${type}`)
    }

    return NextResponse.json({
      success: true,
      message: "Key updated successfully",
    })
  } catch (error) {
    console.error("Key Update API: Error updating key:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to update key" 
    }, { status: 500 })
  }
}

async function deleteKeyHandler(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const key = decodeURIComponent(params.key)
    const redisClient = getRedisClient()

    if (!redisClient) {
      return NextResponse.json({ error: "Redis client not connected" }, { status: 400 })
    }

    const result = await redisClient.del(key)

    if (result === 0) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Key deleted successfully",
    })
  } catch (error) {
    console.error("Key Delete API: Error deleting key:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to delete key" 
    }, { status: 500 })
  }
}

export const GET = withAPISecurity(getKeyHandler)
export const PUT = withAPISecurity(putKeyHandler)
export const DELETE = withAPISecurity(deleteKeyHandler)
