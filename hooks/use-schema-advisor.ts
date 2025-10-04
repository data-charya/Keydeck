import { useState } from "react"
import { secureApiRequest } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

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

export function useSchemaAdvisor() {
  const [analysis, setAnalysis] = useState<SchemaAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await secureApiRequest('/api/redis/schema-advisor', {
        method: 'GET'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAnalysis(data.analysis)
        toast({
          title: "Schema Analysis Complete",
          description: `Analyzed ${data.metadata.totalKeys} keys with ${data.analysis.recommendations.length} recommendations`,
        })
      } else {
        setError(data.error || 'Failed to analyze schema')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze schema')
    } finally {
      setLoading(false)
    }
  }

  const clearAnalysis = () => {
    setAnalysis(null)
    setError(null)
  }

  return {
    analysis,
    loading,
    error,
    runAnalysis,
    clearAnalysis
  }
}
