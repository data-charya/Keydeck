import { NextRequest, NextResponse } from "next/server"
import { createRedisClient } from "@/lib/redis"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const host = searchParams.get('host') || 'localhost'
    const port = parseInt(searchParams.get('port') || '6379')

    // Test Redis server response with PING command
    const client = createRedisClient({ 
      host, 
      port
    })
    
    try {
      await client.connect()
      
      // Test PING command
      const pingResult = await client.ping()
      
      // Test INFO command to get server details
      const info = await client.info('server')
      const serverInfo = info.split('\n').find(line => line.startsWith('redis_version:'))
      const version = serverInfo ? serverInfo.split(':')[1] : 'Unknown'
      
      await client.quit()
      
      return NextResponse.json({
        success: true,
        details: `Redis server is responding (PING: ${pingResult}, Version: ${version.trim()})`
      })
    } catch (error) {
      await client.quit().catch(() => {})
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      if (errorMessage.includes('NOAUTH')) {
        return NextResponse.json({
          success: false,
          details: `Redis server requires authentication - Password needed`
        })
      } else if (errorMessage.includes('WRONGPASS')) {
        return NextResponse.json({
          success: false,
          details: `Redis server authentication failed - Incorrect password`
        })
      } else {
        return NextResponse.json({
          success: false,
          details: `Redis server not responding: ${errorMessage}`
        })
      }
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      details: `PING test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
}
