import { type NextRequest, NextResponse } from "next/server"
import { connectToRedis, disconnectFromRedis } from "@/lib/redis"

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()
    const { host, port, password, database } = config

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
      password,
      database: database || 0
    })

    return NextResponse.json({
      success: true,
      message: "Connected to Redis successfully",
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to connect to Redis. Please check your connection details." },
      { status: 500 },
    )
  }
}
