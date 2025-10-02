import { type NextRequest, NextResponse } from "next/server"
import { connectToRedis, disconnectFromRedis, parseRedisUri } from "@/lib/redis"
import { getDetailedErrorInfo } from "@/lib/error-translator"
import { withAPISecurity } from "@/lib/api-security"

async function connectHandler(request: NextRequest) {
  try {
    const requestData = await request.json()
    const { uri, host, port, username, password, database, tls, connectTimeout, commandTimeout, maxRetriesPerRequest } = requestData

    let config: any

    // Handle URI connection
    if (uri) {
      try {
        config = parseRedisUri(uri)
      } catch (error) {
        return NextResponse.json({ 
          error: error instanceof Error ? error.message : "Invalid URI format" 
        }, { status: 400 })
      }
    } else {
      // Handle form-based connection
      if (!host || !port) {
        return NextResponse.json({ error: "Host and port are required" }, { status: 400 })
      }

      config = {
        host,
        port,
        username,
        password,
        database: database || 0,
        tls: tls || false,
        connectTimeout: connectTimeout || 10000,
        commandTimeout: commandTimeout || 5000,
        maxRetriesPerRequest: maxRetriesPerRequest || 5
      }
    }

    // Disconnect existing connection if any
    await disconnectFromRedis()

    // Connect to Redis with configuration
    const client = await connectToRedis(config)

    return NextResponse.json({
      success: true,
      message: "Connected to Redis successfully",
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to connect to Redis. Please check your connection details."
    const detailedError = getDetailedErrorInfo(errorMessage)
    
    return NextResponse.json(
      { 
        error: detailedError.message,
        title: detailedError.title,
        suggestions: detailedError.suggestions,
        technicalDetails: detailedError.technicalDetails
      },
      { status: 500 },
    )
  }
}

export const POST = withAPISecurity(connectHandler)
