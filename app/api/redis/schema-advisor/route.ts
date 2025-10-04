import { NextRequest, NextResponse } from "next/server"
import { getRedisClient, executeRedisCommand } from "@/lib/redis"
import { withAPISecurity } from "@/lib/api-security"

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

async function getSchemaAnalysisHandler(request: NextRequest) {
  try {
    const redisClient = getRedisClient()
    if (!redisClient) {
      return NextResponse.json({ error: "Redis client not connected" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const sampleSize = parseInt(searchParams.get('sampleSize') || '10000')
    const includeLargeKeys = searchParams.get('includeLargeKeys') === 'true'

    // Get all keys with basic info
    const keys = await executeRedisCommand<string[]>('KEYS', '*')
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

    // Sample keys for analysis if dataset is large
    const keysToAnalyze = totalKeys > sampleSize 
      ? keys.sort(() => 0.5 - Math.random()).slice(0, sampleSize)
      : keys

    // Analyze each key
    const keyAnalyses: KeyAnalysis[] = []
    
    for (const key of keysToAnalyze) {
      try {
        const type = await executeRedisCommand<string>('TYPE', key)
        const ttl = await executeRedisCommand<number>('TTL', key)
        const memoryUsage = await executeRedisCommand<number>('MEMORY', 'USAGE', key)
        
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

        keyAnalyses.push({
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
      } catch (error) {
        console.warn(`Failed to analyze key ${key}:`, error)
      }
    }

    // Generate recommendations
    const recommendations = await analyzeKeyPatterns(keyAnalyses)

    // Analyze key patterns
    const patternMap = new Map<string, { count: number, sizes: number[], ttls: number[] }>()
    keyAnalyses.forEach(key => {
      if (!patternMap.has(key.pattern)) {
        patternMap.set(key.pattern, { count: 0, sizes: [], ttls: [] })
      }
      const p = patternMap.get(key.pattern)!
      p.count++
      p.sizes.push(key.size)
      p.ttls.push(key.ttl)
    })

    const keyPatterns = Array.from(patternMap.entries()).map(([pattern, data]) => ({
      pattern,
      count: data.count,
      percentage: Math.round((data.count / keyAnalyses.length) * 100),
      avgSize: Math.round(data.sizes.reduce((a, b) => a + b, 0) / data.sizes.length),
      avgTTL: Math.round(data.ttls.reduce((a, b) => a + b, 0) / data.ttls.length)
    })).sort((a, b) => b.count - a.count)

    // Analyze namespaces
    const namespaceMap = new Map<string, { count: number, separators: Set<string> }>()
    keyAnalyses.forEach(key => {
      if (!namespaceMap.has(key.namespace)) {
        namespaceMap.set(key.namespace, { count: 0, separators: new Set() })
      }
      const ns = namespaceMap.get(key.namespace)!
      ns.count++
      if (key.separator) {
        ns.separators.add(key.separator)
      }
    })

    const namespaceAnalysis = Array.from(namespaceMap.entries()).map(([namespace, data]) => ({
      namespace,
      count: data.count,
      percentage: Math.round((data.count / keyAnalyses.length) * 100),
      separator: Array.from(data.separators)[0] || '',
      consistency: data.separators.size === 1 ? 100 : Math.round((1 / data.separators.size) * 100)
    })).sort((a, b) => b.count - a.count)

    // TTL analysis
    const withTTL = keyAnalyses.filter(k => k.hasTTL).length
    const withoutTTL = keyAnalyses.length - withTTL

    // Memory analysis
    const largeKeys = keyAnalyses.filter(k => k.isLarge)
    const totalLargeMemory = largeKeys.reduce((sum, k) => sum + k.memoryUsage, 0)
    
    // Get memory fragmentation from Redis INFO
    const info = await executeRedisCommand<string>('INFO', 'memory')
    const fragmentationMatch = info.match(/mem_fragmentation_ratio:([\d.]+)/)
    const fragmentation = fragmentationMatch ? parseFloat(fragmentationMatch[1]) : 0

    // Type distribution
    const typeMap = new Map<string, { count: number, sizes: number[] }>()
    keyAnalyses.forEach(key => {
      if (!typeMap.has(key.type)) {
        typeMap.set(key.type, { count: 0, sizes: [] })
      }
      const t = typeMap.get(key.type)!
      t.count++
      t.sizes.push(key.size)
    })

    const typeDistribution = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      percentage: Math.round((data.count / keyAnalyses.length) * 100),
      avgSize: Math.round(data.sizes.reduce((a, b) => a + b, 0) / data.sizes.length)
    })).sort((a, b) => b.count - a.count)

    const analysis: SchemaAnalysis = {
      totalKeys,
      totalMemory: keyAnalyses.reduce((sum, k) => sum + k.memoryUsage, 0),
      recommendations,
      keyPatterns,
      namespaceAnalysis,
      ttlAnalysis: {
        withTTL,
        withoutTTL,
        percentage: Math.round((withTTL / keyAnalyses.length) * 100)
      },
      memoryAnalysis: {
        largeKeys: largeKeys.length,
        totalLargeMemory,
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
