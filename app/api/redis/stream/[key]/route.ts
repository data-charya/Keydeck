import { type NextRequest, NextResponse } from "next/server"
import { getRedisClient, getStreamEntries } from "@/lib/redis"

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const key = decodeURIComponent(params.key)
    const redisClient = getRedisClient()
    
    if (!redisClient) {
      return NextResponse.json({ error: "Redis client not connected" }, { status: 400 })
    }

    // Get stream entries
    const entries = await getStreamEntries(key, '-', '+', 50) // Get last 50 entries

    return NextResponse.json({
      success: true,
      entries: entries,
      key: key
    })
  } catch (error) {
    console.error("Stream API error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get stream entries",
        key: params.key,
      },
      { status: 400 }
    )
  }
}
