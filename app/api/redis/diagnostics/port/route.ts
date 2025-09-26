import { NextRequest, NextResponse } from "next/server"
import { createRedisClient } from "@/lib/redis"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const host = searchParams.get('host') || 'localhost'
    const port = parseInt(searchParams.get('port') || '6379')

    // Test if the port is accessible and responding to Redis protocol
    const client = createRedisClient({ 
      host, 
      port
    })
    
    try {
      // Try to connect
      await client.connect()
      
      // Test basic Redis command
      const result = await client.ping()
      
      await client.quit()
      
      return NextResponse.json({
        success: true,
        details: `Port ${port} is accessible and responding to Redis commands (PING returned: ${result})`
      })
    } catch (error) {
      await client.quit().catch(() => {})
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Provide specific error messages based on common issues
      if (errorMessage.includes('ECONNREFUSED')) {
        return NextResponse.json({
          success: false,
          details: `Port ${port} is not accessible - Redis server is not running or not listening on this port`
        })
      } else if (errorMessage.includes('ETIMEDOUT')) {
        return NextResponse.json({
          success: false,
          details: `Port ${port} connection timed out - Check firewall settings or network connectivity`
        })
      } else if (errorMessage.includes('ENOTFOUND')) {
        return NextResponse.json({
          success: false,
          details: `Host ${host} not found - Check hostname or DNS resolution`
        })
      } else {
        return NextResponse.json({
          success: false,
          details: `Port ${port} test failed: ${errorMessage}`
        })
      }
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      details: `Port test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
}
