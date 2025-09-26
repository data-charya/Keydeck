import { type NextRequest, NextResponse } from "next/server"
import { connectToRedis, disconnectFromRedis } from "@/lib/redis"
import { getDetailedErrorInfo } from "@/lib/error-translator"

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()
    const { host, port, username, password, database } = config

    // Basic validation
    if (!host || !port) {
      return NextResponse.json({ error: "Host and port are required" }, { status: 400 })
    }

    // Disconnect existing connection if any
    await disconnectFromRedis()

    // Connect to Redis
    const client = await connectToRedis({
      host,
      port,
      username,
      password,
      database: database || 0
    })

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
