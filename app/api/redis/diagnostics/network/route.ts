import { NextRequest, NextResponse } from "next/server"
import { createRedisClient } from "@/lib/redis"
import { withAPISecurity } from "@/lib/api-security"

async function networkHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const host = searchParams.get('host') || 'localhost'
    const port = parseInt(searchParams.get('port') || '6379')

    // Test basic network connectivity using a simple Redis client
    const client = createRedisClient({ host, port })
    
    try {
      // Try to connect and ping
      await client.connect()
      await client.ping()
      await client.quit()
      
      return NextResponse.json({
        success: true,
        details: `Successfully connected to ${host}:${port}`
      })
    } catch (error) {
      await client.quit().catch(() => {})
      
      return NextResponse.json({
        success: false,
        details: `Cannot connect to ${host}:${port} - ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      details: `Network test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
}

export const GET = withAPISecurity(networkHandler)
