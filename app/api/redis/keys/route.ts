import { NextRequest, NextResponse } from "next/server"
import { getRedisClient, getAllKeys, getKeysBasic } from "@/lib/redis"
import { withAPISecurity } from "@/lib/api-security"

async function getKeysHandler(request: NextRequest) {
  try {
    const redisClient = getRedisClient()
    if (!redisClient) {
      return NextResponse.json({ error: "Redis client not connected" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const pattern = searchParams.get('pattern') || '*'
    const limit = parseInt(searchParams.get('limit') || '10000')
    const basic = searchParams.get('basic') === 'true'
    const offset = parseInt(searchParams.get('offset') || '0')

    // For large datasets, use basic info only
    const keys = basic 
      ? await getKeysBasic(pattern, limit)
      : await getAllKeys(pattern, limit)

    // Apply offset for pagination
    const paginatedKeys = keys.slice(offset, offset + (parseInt(searchParams.get('pageSize') || '100')))

    return NextResponse.json({
      success: true,
      keys: paginatedKeys,
      total: keys.length,
      hasMore: offset + paginatedKeys.length < keys.length,
      offset,
      limit,
      performance: {
        totalKeys: keys.length,
        loadedKeys: paginatedKeys.length,
        isBasicMode: basic,
        estimatedLoadTime: keys.length > 1000 ? 'Large dataset detected - using optimized loading' : 'Normal loading'
      }
    })
  } catch (error) {
    console.error("Error fetching Redis keys:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch keys" 
    }, { status: 500 })
  }
}

export const GET = withAPISecurity(getKeysHandler)