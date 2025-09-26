import { NextResponse } from "next/server"
import { getRedisClient, getAllKeys } from "@/lib/redis"

export async function GET() {
  try {
    const redisClient = getRedisClient()
    if (!redisClient) {
      return NextResponse.json({ error: "Redis client not connected" }, { status: 400 })
    }

    console.log("Fetching Redis keys")

    const keys = await getAllKeys()

    return NextResponse.json({
      success: true,
      keys: keys,
    })
  } catch (error) {
    console.error("Error fetching Redis keys:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch keys" 
    }, { status: 500 })
  }
}
