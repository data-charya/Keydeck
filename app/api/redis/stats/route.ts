import { NextResponse } from "next/server"
import { getRedisClient, getRedisInfo, getAllKeys } from "@/lib/redis"

export async function GET() {
  try {
    const redisClient = getRedisClient()
    if (!redisClient) {
      return NextResponse.json({ error: "Redis client not connected" }, { status: 400 })
    }

    // Get Redis server info
    const info = await getRedisInfo()
    
    // Get all keys to calculate key type distribution
    const keys = await getAllKeys()
    
    // Calculate key type distribution
    const keyTypeCounts: Record<string, number> = {}
    keys.forEach(key => {
      keyTypeCounts[key.type] = (keyTypeCounts[key.type] || 0) + 1
    })

    const totalKeys = keys.length
    const keyTypes = Object.entries(keyTypeCounts).map(([type, count]) => ({
      type,
      count,
      percentage: totalKeys > 0 ? Math.round((count / totalKeys) * 100) : 0,
      color: getTypeColor(type)
    }))

    // Format uptime
    const uptimeSeconds = parseInt(info.uptime_in_seconds || '0')
    const uptimeDays = Math.floor(uptimeSeconds / 86400)
    const uptimeHours = Math.floor((uptimeSeconds % 86400) / 3600)
    const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60)
    
    let uptimeString = ''
    if (uptimeDays > 0) uptimeString += `${uptimeDays} day${uptimeDays > 1 ? 's' : ''}`
    if (uptimeHours > 0) uptimeString += `${uptimeString ? ', ' : ''}${uptimeHours} hour${uptimeHours > 1 ? 's' : ''}`
    if (uptimeMinutes > 0 && uptimeDays === 0) uptimeString += `${uptimeString ? ', ' : ''}${uptimeMinutes} minute${uptimeMinutes > 1 ? 's' : ''}`

    // Calculate memory usage percentage and capacity info
    const usedMemoryBytes = parseInt(info.used_memory || '0')
    const maxMemoryBytes = parseInt(info.maxmemory || '0')
    const memoryUsagePercentage = maxMemoryBytes > 0 ? Math.round((usedMemoryBytes / maxMemoryBytes) * 100) : 0
    
    // Get additional memory info
    const memoryFragmentationRatio = parseFloat(info.mem_fragmentation_ratio || '1.0')
    const memoryFragmentationBytes = parseInt(info.mem_fragmentation_bytes || '0')
    
    const stats = {
      version: info.redis_version || "Unknown",
      uptime: uptimeString || "0 minutes",
      connectedClients: parseInt(info.connected_clients || '0'),
      usedMemory: info.used_memory_human || "0B",
      usedMemoryPeak: info.used_memory_peak_human || "0B",
      maxMemory: info.maxmemory_human || "Unlimited",
      usedMemoryBytes: usedMemoryBytes,
      maxMemoryBytes: maxMemoryBytes,
      memoryUsagePercentage: memoryUsagePercentage,
      memoryFragmentationRatio: memoryFragmentationRatio,
      memoryFragmentationBytes: memoryFragmentationBytes,
      totalKeys: totalKeys,
      totalCommands: parseInt(info.total_commands_processed || '0'),
      keyspaceHits: parseInt(info.keyspace_hits || '0'),
      keyspaceMisses: parseInt(info.keyspace_misses || '0'),
      opsPerSec: parseInt(info.instantaneous_ops_per_sec || '0'),
      // Additional server info
      redisMode: info.redis_mode || "standalone",
      os: info.os || "Unknown",
      archBits: info.arch_bits || "64",
      processId: info.process_id || "Unknown",
      tcpPort: info.tcp_port || "6379",
      uptimeInSeconds: uptimeSeconds,
    }

    return NextResponse.json({
      success: true,
      stats: stats,
      keyTypes: keyTypes,
    })
  } catch (error) {
    console.error("Error fetching Redis statistics:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch statistics" 
    }, { status: 500 })
  }
}

function getTypeColor(type: string): string {
  switch (type.toLowerCase()) {
    case "string":
      return "bg-blue-500"
    case "hash":
      return "bg-green-500"
    case "list":
      return "bg-purple-500"
    case "set":
      return "bg-orange-500"
    case "zset":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}
