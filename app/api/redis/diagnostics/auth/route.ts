import { NextRequest, NextResponse } from "next/server"
import { createRedisClient } from "@/lib/redis"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const host = searchParams.get('host') || 'localhost'
    const port = parseInt(searchParams.get('port') || '6379')
    const username = searchParams.get('username') || ''
    const password = searchParams.get('password') || ''

    // Test authentication if password is provided
    if (!password) {
      // Test without password first
      const client = createRedisClient({ 
        host, 
        port,
        username: username || undefined
      })
      
      try {
        await client.connect()
        await client.ping()
        await client.quit()
        
        return NextResponse.json({
          success: true,
          details: `No authentication required - Redis server allows anonymous access`
        })
      } catch (error) {
        await client.quit().catch(() => {})
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        if (errorMessage.includes('NOAUTH')) {
          return NextResponse.json({
            success: false,
            requiresAuth: true,
            details: `Redis server requires authentication - Please provide a password`
          })
        } else {
          return NextResponse.json({
            success: false,
            details: `Cannot test authentication: ${errorMessage}`
          })
        }
      }
    } else {
      // Test with password
      const client = createRedisClient({ 
        host, 
        port,
        username: username || undefined,
        password
      })
      
      try {
        await client.connect()
        await client.ping()
        await client.quit()
        
        return NextResponse.json({
          success: true,
          details: `Authentication successful with provided password`
        })
      } catch (error) {
        await client.quit().catch(() => {})
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        if (errorMessage.includes('WRONGPASS')) {
          return NextResponse.json({
            success: false,
            details: `Authentication failed - Incorrect password provided`
          })
        } else {
          return NextResponse.json({
            success: false,
            details: `Authentication test failed: ${errorMessage}`
          })
        }
      }
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      details: `Authentication test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
}
