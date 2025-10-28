import { NextRequest, NextResponse } from "next/server"
import { getRedisClient, executeRedisCommand } from "@/lib/redis"
import { withAPISecurity } from "@/lib/api-security"
import type Redis from 'ioredis'

interface KeyAnalysis {
  key: string
  type: string
  ttl: number
  size: number
  memoryUsage: number
  namespace: string
  separator: string
  hasTTL: boolean
  isLarge: boolean
  pattern: string
}

interface SchemaRecommendation {
  id: string
  type: 'warning' | 'info' | 'error' | 'success'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  affectedKeys: number
  percentage: number
  suggestion: string
  command?: string
}

interface SchemaAnalysis {
  totalKeys: number
  totalMemory: number
  recommendations: SchemaRecommendation[]
  keyPatterns: {
    pattern: string
    count: number
    percentage: number
    avgSize: number
    avgTTL: number
  }[]
  namespaceAnalysis: {
    namespace: string
    count: number
    percentage: number
    separator: string
    consistency: number
  }[]
  ttlAnalysis: {
    withTTL: number
    withoutTTL: number
    percentage: number
  }
  memoryAnalysis: {
    largeKeys: number
    totalLargeMemory: number
    fragmentation: number
  }
  typeDistribution: {
    type: string
    count: number
    percentage: number
    avgSize: number
  }[]
}

async function analyzeKeyPatterns(keys: KeyAnalysis[]): Promise<SchemaRecommendation[]> {
  const recommendations: SchemaRecommendation[] = []
  
  // Analyze TTL usage
  const withoutTTL = keys.filter(k => !k.hasTTL).length
  const ttlPercentage = ((keys.length - withoutTTL) / keys.length) * 100
  
  if (ttlPercentage < 80) {
    recommendations.push({
      id: 'ttl-usage',
      type: 'warning',
      title: 'Low TTL Usage',
      description: `${Math.round(100 - ttlPercentage)}% of keys have no TTL set`,
      impact: 'high',
      affectedKeys: withoutTTL,
      percentage: Math.round(100 - ttlPercentage),
      suggestion: 'Consider setting TTLs for keys to prevent memory leaks and improve cache efficiency',
      command: 'EXPIRE key seconds'
    })
  }

  // Analyze key naming consistency
  const namespaces = new Map<string, { count: number, separators: Set<string> }>()
  keys.forEach(key => {
    const parts = key.key.split(/[:.-]/)
    if (parts.length > 1) {
      const namespace = parts[0]
      const separator = key.separator
      
      if (!namespaces.has(namespace)) {
        namespaces.set(namespace, { count: 0, separators: new Set() })
      }
      const ns = namespaces.get(namespace)!
      ns.count++
      ns.separators.add(separator)
    }
  })

  for (const [namespace, data] of namespaces) {
    if (data.separators.size > 1) {
      recommendations.push({
        id: `naming-${namespace}`,
        type: 'info',
        title: 'Inconsistent Naming Separators',
        description: `Namespace "${namespace}" uses multiple separators: ${Array.from(data.separators).join(', ')}`,
        impact: 'medium',
        affectedKeys: data.count,
        percentage: Math.round((data.count / keys.length) * 100),
        suggestion: 'Standardize on a single separator (recommend colon : for Redis best practices)',
        command: 'RENAME old_key new_key'
      })
    }
  }

  // Analyze large keys
  const largeKeys = keys.filter(k => k.isLarge)
  if (largeKeys.length > 0) {
    const totalLargeMemory = largeKeys.reduce((sum, k) => sum + k.memoryUsage, 0)
    recommendations.push({
      id: 'large-keys',
      type: 'warning',
      title: 'Large Keys Detected',
      description: `${largeKeys.length} keys exceed 1MB (${Math.round(totalLargeMemory / 1024 / 1024)}MB total)`,
      impact: 'medium',
      affectedKeys: largeKeys.length,
      percentage: Math.round((largeKeys.length / keys.length) * 100),
      suggestion: 'Consider splitting large keys or using compression for better performance',
      command: 'MEMORY USAGE key'
    })
  }

  // Analyze key patterns
  const patterns = new Map<string, { count: number, sizes: number[] }>()
  keys.forEach(key => {
    const pattern = key.pattern
    if (!patterns.has(pattern)) {
      patterns.set(pattern, { count: 0, sizes: [] })
    }
    const p = patterns.get(pattern)!
    p.count++
    p.sizes.push(key.size)
  })

  // Check for overly generic patterns
  for (const [pattern, data] of patterns) {
    if (data.count > keys.length * 0.3 && pattern.includes('*')) {
      recommendations.push({
        id: `pattern-${pattern}`,
        type: 'info',
        title: 'Generic Key Pattern',
        description: `Pattern "${pattern}" represents ${Math.round((data.count / keys.length) * 100)}% of all keys`,
        impact: 'low',
        affectedKeys: data.count,
        percentage: Math.round((data.count / keys.length) * 100),
        suggestion: 'Consider more specific naming patterns for better organization',
        command: 'KEYS pattern'
      })
    }
  }

  return recommendations
}

// Optimized function to scan keys using SCAN (non-blocking)
async function scanAllKeys(client: Redis, pattern: string = '*', limit: number = 100000): Promise<string[]> {
  const keys: string[] = []
  let cursor = '0'
  
  do {
    const result = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 1000)
    cursor = result[0]
    keys.push(...result[1])
    
    if (keys.length >= limit) {
      break
    }
  } while (cursor !== '0')
  
  return keys
}

// Single-pass aggregation for all metrics
interface AggregatedData {
  patternMap: Map<string, { count: number, sizes: number[], ttls: number[] }>
  namespaceMap: Map<string, { count: number, separators: Set<string> }>
  typeMap: Map<string, { count: number, sizes: number[] }>
  totalMemory: number
  withTTL: number
  withoutTTL: number
  largeKeys: KeyAnalysis[]
  totalLargeMemory: number
}

function aggregateKeyData(keyAnalyses: KeyAnalysis[]): AggregatedData {
  const patternMap = new Map<string, { count: number, sizes: number[], ttls: number[] }>()
  const namespaceMap = new Map<string, { count: number, separators: Set<string> }>()
  const typeMap = new Map<string, { count: number, sizes: number[] }>()
  
  let totalMemory = 0
  let withTTL = 0
  let withoutTTL = 0
  const largeKeys: KeyAnalysis[] = []
  let totalLargeMemory = 0
  
  // Single pass through all keys
  for (const key of keyAnalyses) {
    // Pattern analysis
    if (!patternMap.has(key.pattern)) {
      patternMap.set(key.pattern, { count: 0, sizes: [], ttls: [] })
    }
    const patternData = patternMap.get(key.pattern)!
    patternData.count++
    patternData.sizes.push(key.size)
    patternData.ttls.push(key.ttl)
    
    // Namespace analysis
    if (!namespaceMap.has(key.namespace)) {
      namespaceMap.set(key.namespace, { count: 0, separators: new Set() })
    }
    const namespaceData = namespaceMap.get(key.namespace)!
    namespaceData.count++
    if (key.separator) {
      namespaceData.separators.add(key.separator)
    }
    
    // Type distribution
    if (!typeMap.has(key.type)) {
      typeMap.set(key.type, { count: 0, sizes: [] })
    }
    const typeData = typeMap.get(key.type)!
    typeData.count++
    typeData.sizes.push(key.size)
    
    // Memory and TTL totals
    totalMemory += key.memoryUsage
    if (key.hasTTL) {
      withTTL++
    } else {
      withoutTTL++
    }
    
    // Large keys
    if (key.isLarge) {
      largeKeys.push(key)
      totalLargeMemory += key.memoryUsage
    }
  }
  
  return {
    patternMap,
    namespaceMap,
    typeMap,
    totalMemory,
    withTTL,
    withoutTTL,
    largeKeys,
    totalLargeMemory
  }
}

// Optimized function to analyze keys in batches using pipelining
async function analyzeKeysBatch(client: Redis, keys: string[]): Promise<KeyAnalysis[]> {
  const batchSize = 500 // Process 500 keys at a time with pipelining
  const analyses: KeyAnalysis[] = []
  
  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, i + batchSize)
    
    // Create pipeline for all commands in this batch
    const pipeline = client.pipeline()
    
    // Queue all commands for this batch
    batch.forEach(key => {
      pipeline.type(key)
      pipeline.ttl(key)
      pipeline.memory('USAGE', key)
    })
    
    // Execute all commands in parallel
    const results = await pipeline.exec()
    
    if (!results) continue
    
    // Process results (3 commands per key)
    batch.forEach((key, index) => {
      const baseIndex = index * 3
      const typeResult = results[baseIndex]
      const ttlResult = results[baseIndex + 1]
      const memoryResult = results[baseIndex + 2]
      
      // Check for errors
      if (typeResult?.[0] || ttlResult?.[0] || memoryResult?.[0]) {
        return // Skip keys with errors
      }
      
      const type = typeResult[1] as string
      const ttl = ttlResult[1] as number
      const memoryUsage = (memoryResult[1] as number) || 0
      
      // Determine namespace and separator
      const separatorMatch = key.match(/[:.-]/)
      const separator = separatorMatch ? separatorMatch[0] : ''
      const namespace = separator ? key.split(separator)[0] : key
      
      // Create pattern (replace numbers and specific values with wildcards)
      const pattern = key
        .replace(/\d+/g, '*')
        .replace(/[a-f0-9]{8,}/g, '*') // Replace UUIDs/hashes
        .replace(/\d{4}-\d{2}-\d{2}/g, '*') // Replace dates
        .replace(/\d{13}/g, '*') // Replace timestamps
      
      analyses.push({
        key,
        type,
        ttl,
        size: memoryUsage,
        memoryUsage,
        namespace,
        separator,
        hasTTL: ttl > 0,
        isLarge: memoryUsage > 1024 * 1024, // 1MB
        pattern
      })
    })
  }
  
  return analyses
}

async function getSchemaAnalysisHandler(request: NextRequest) {
  try {
    const redisClient = getRedisClient()
    if (!redisClient) {
      return NextResponse.json({ error: "Redis client not connected" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const sampleSize = parseInt(searchParams.get('sampleSize') || '10000')
    const includeLargeKeys = searchParams.get('includeLargeKeys') === 'true'

    // Use SCAN to get all keys (non-blocking)
    const keys = await scanAllKeys(redisClient, '*', 100000)
    const totalKeys = keys.length

    if (totalKeys === 0) {
      return NextResponse.json({
        success: true,
        analysis: {
          totalKeys: 0,
          totalMemory: 0,
          recommendations: [],
          keyPatterns: [],
          namespaceAnalysis: [],
          ttlAnalysis: { withTTL: 0, withoutTTL: 0, percentage: 0 },
          memoryAnalysis: { largeKeys: 0, totalLargeMemory: 0, fragmentation: 0 },
          typeDistribution: []
        }
      })
    }

    // Environment-based safety check - prevent analyzing too much data
    const isProduction = process.env.NODE_ENV === 'production'
    const isWebDeployment = process.env.IS_WEB_DEPLOYMENT === 'true'
    const isLocalDevelopment = !isProduction && !isWebDeployment
    
    // Set limits based on deployment type
    const maxKeysWebDeployment = parseInt(process.env.SCHEMA_ADVISOR_MAX_KEYS_WEB || '1000')
    const maxKeysProduction = parseInt(process.env.SCHEMA_ADVISOR_MAX_KEYS || '5000')
    const maxKeysDevelopment = parseInt(process.env.SCHEMA_ADVISOR_MAX_KEYS_DEV || '100000')

    // Web deployment has the strictest limits
    if (isWebDeployment && totalKeys > maxKeysWebDeployment) {
      return NextResponse.json({
        success: false,
        error: "Dataset too large for web deployment analysis",
        message: `Your Redis instance contains ${totalKeys.toLocaleString()} keys, which exceeds the web deployment limit of ${maxKeysWebDeployment.toLocaleString()} keys.`,
        suggestion: "For large datasets, please run the schema analysis locally using Docker to avoid performance impact on the shared web environment.",
        totalKeys,
        limit: maxKeysWebDeployment,
        environment: "web-deployment",
        deploymentType: "web",
        dockerCommand: "docker run -it --rm -v $(pwd):/app -w /app node:18 npm run schema-analyze"
      }, { status: 413 }) // Payload Too Large
    }

    // Production deployment limits
    if (isProduction && !isWebDeployment && totalKeys > maxKeysProduction) {
      return NextResponse.json({
        success: false,
        error: "Dataset too large for production analysis",
        message: `Your Redis instance contains ${totalKeys.toLocaleString()} keys, which exceeds the production limit of ${maxKeysProduction.toLocaleString()} keys.`,
        suggestion: "For large datasets, please run the schema analysis locally using Docker to avoid performance impact on your production environment.",
        totalKeys,
        limit: maxKeysProduction,
        environment: "production",
        deploymentType: "production",
        dockerCommand: "docker run -it --rm -v $(pwd):/app -w /app node:18 npm run schema-analyze"
      }, { status: 413 })
    }

    // Development limits (most permissive)
    if (isLocalDevelopment && totalKeys > maxKeysDevelopment) {
      return NextResponse.json({
        success: false,
        error: "Dataset too large for development analysis",
        message: `Your Redis instance contains ${totalKeys.toLocaleString()} keys, which exceeds the development limit of ${maxKeysDevelopment.toLocaleString()} keys.`,
        suggestion: "Consider using a smaller sample or running analysis locally with Docker for better performance.",
        totalKeys,
        limit: maxKeysDevelopment,
        environment: "development",
        deploymentType: "local"
      }, { status: 413 })
    }

    // Sample keys for analysis if dataset is large
    const keysToAnalyze = totalKeys > sampleSize 
      ? keys.sort(() => 0.5 - Math.random()).slice(0, sampleSize)
      : keys

    // Analyze keys using optimized batched pipelining
    console.log(`Analyzing ${keysToAnalyze.length} keys using pipelined batch processing...`)
    const keyAnalyses = await analyzeKeysBatch(redisClient, keysToAnalyze)
    console.log(`Successfully analyzed ${keyAnalyses.length} keys`)

    // Single-pass aggregation for better performance
    console.log('Aggregating analysis data in single pass...')
    const aggregated = aggregateKeyData(keyAnalyses)
    
    // Generate recommendations
    const recommendations = await analyzeKeyPatterns(keyAnalyses)

    // Build key patterns from aggregated data
    const keyPatterns = Array.from(aggregated.patternMap.entries()).map(([pattern, data]) => ({
      pattern,
      count: data.count,
      percentage: Math.round((data.count / keyAnalyses.length) * 100),
      avgSize: Math.round(data.sizes.reduce((a, b) => a + b, 0) / data.sizes.length),
      avgTTL: Math.round(data.ttls.reduce((a, b) => a + b, 0) / data.ttls.length)
    })).sort((a, b) => b.count - a.count)

    // Build namespace analysis from aggregated data
    const namespaceAnalysis = Array.from(aggregated.namespaceMap.entries()).map(([namespace, data]) => ({
      namespace,
      count: data.count,
      percentage: Math.round((data.count / keyAnalyses.length) * 100),
      separator: Array.from(data.separators)[0] || '',
      consistency: data.separators.size === 1 ? 100 : Math.round((1 / data.separators.size) * 100)
    })).sort((a, b) => b.count - a.count)

    // Build type distribution from aggregated data
    const typeDistribution = Array.from(aggregated.typeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      percentage: Math.round((data.count / keyAnalyses.length) * 100),
      avgSize: Math.round(data.sizes.reduce((a, b) => a + b, 0) / data.sizes.length)
    })).sort((a, b) => b.count - a.count)
    
    // Get memory fragmentation from Redis INFO
    const info = await executeRedisCommand<string>('INFO', 'memory')
    const fragmentationMatch = info.match(/mem_fragmentation_ratio:([\d.]+)/)
    const fragmentation = fragmentationMatch ? parseFloat(fragmentationMatch[1]) : 0

    const analysis: SchemaAnalysis = {
      totalKeys,
      totalMemory: aggregated.totalMemory,
      recommendations,
      keyPatterns,
      namespaceAnalysis,
      ttlAnalysis: {
        withTTL: aggregated.withTTL,
        withoutTTL: aggregated.withoutTTL,
        percentage: Math.round((aggregated.withTTL / keyAnalyses.length) * 100)
      },
      memoryAnalysis: {
        largeKeys: aggregated.largeKeys.length,
        totalLargeMemory: aggregated.totalLargeMemory,
        fragmentation
      },
      typeDistribution
    }

    return NextResponse.json({
      success: true,
      analysis,
      metadata: {
        sampleSize: keyAnalyses.length,
        totalKeys,
        analysisTime: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Error analyzing Redis schema:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to analyze schema" 
    }, { status: 500 })
  }
}

export const GET = withAPISecurity(getSchemaAnalysisHandler)
