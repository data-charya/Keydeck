import { type NextRequest, NextResponse } from "next/server"
import { connectToRedis, disconnectFromRedis } from "@/lib/redis"

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()
    const { host, port, password, database } = config

    console.log("Connect API: Received config:", { host, port, database, hasPassword: !!password })

    // Basic validation
    if (!host || !port) {
      console.log("Connect API: Missing host or port")
      return NextResponse.json({ error: "Host and port are required" }, { status: 400 })
    }

    // Disconnect existing connection if any
    console.log("Connect API: Disconnecting existing connection")
    await disconnectFromRedis()

    // Connect to Redis
    console.log("Connect API: Connecting to Redis...")
    const client = await connectToRedis({
      host,
      port,
      password,
      database: database || 0
    })

    console.log("Connect API: Connected to Redis successfully:", { host, port, database: database || 0 })

    return NextResponse.json({
      success: true,
      message: "Connected to Redis successfully",
    })
  } catch (error) {
    console.error("Connect API: Redis connection error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to connect to Redis. Please check your connection details." },
      { status: 500 },
    )
  }
}
