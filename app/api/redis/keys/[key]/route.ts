import { type NextRequest, NextResponse } from "next/server"
import { getRedisClient, getKeyInfo } from "@/lib/redis"

export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const key = decodeURIComponent(params.key)
    const redisClient = getRedisClient()

    if (!redisClient) {
      return NextResponse.json({ error: "Redis client not connected" }, { status: 400 })
    }

    console.log("Fetching details for key:", key)

    const keyDetails = await getKeyInfo(key)

    if (!keyDetails) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 })
    }

    return NextResponse.json(keyDetails)
  } catch (error) {
    console.error("Error fetching key details:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch key details" 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const key = decodeURIComponent(params.key)
    const { value, type } = await request.json()
    const redisClient = getRedisClient()

    if (!redisClient) {
      return NextResponse.json({ error: "Redis client not connected" }, { status: 400 })
    }

    console.log("Updating key:", key, "with value:", value)

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
      default:
        throw new Error(`Unsupported key type: ${type}`)
    }

    return NextResponse.json({
      success: true,
      message: "Key updated successfully",
    })
  } catch (error) {
    console.error("Error updating key:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to update key" 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const key = decodeURIComponent(params.key)
    const redisClient = getRedisClient()

    if (!redisClient) {
      return NextResponse.json({ error: "Redis client not connected" }, { status: 400 })
    }

    console.log("Deleting key:", key)

    const result = await redisClient.del(key)

    if (result === 0) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Key deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting key:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to delete key" 
    }, { status: 500 })
  }
}
