"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Database, 
  Clock, 
  HardDrive, 
  Key, 
  TrendingUp,
  BarChart3,
  Settings,
  Lightbulb,
  Target,
  Zap
} from "lucide-react"
import { useSchemaAdvisor } from "@/hooks/use-schema-advisor"

interface SchemaAdvisorProps {
  className?: string
}

export function SchemaAdvisor({ className }: SchemaAdvisorProps) {
  const { analysis, loading, error, runAnalysis } = useSchemaAdvisor()

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      default: return 'outline'
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFragmentationColor = (ratio: number) => {
    if (ratio < 1.1) return 'text-green-600'
    if (ratio < 1.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-yellow-500" />
            Schema Advisor
          </h2>
          <p className="text-muted-foreground">
            Analyze your Redis schema for best practices and optimization opportunities
          </p>
        </div>
        <Button 
          onClick={runAnalysis} 
          disabled={loading}
          className="flex items-center gap-2 hover:cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysis && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 p-2 h-12">
            <TabsTrigger className="hover:cursor-pointer" value="overview">Overview</TabsTrigger>
            <TabsTrigger className="hover:cursor-pointer" value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger className="hover:cursor-pointer" value="patterns">Key Patterns</TabsTrigger>
            <TabsTrigger className="hover:cursor-pointer" value="namespaces">Namespaces</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analysis.totalKeys.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(analysis.totalMemory)} total memory
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">TTL Coverage</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analysis.ttlAnalysis.percentage}%</div>
                  <p className="text-xs text-muted-foreground">
                    {analysis.ttlAnalysis.withTTL} keys with TTL
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Large Keys</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analysis.memoryAnalysis.largeKeys}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(analysis.memoryAnalysis.totalLargeMemory)} total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fragmentation</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getFragmentationColor(analysis.memoryAnalysis.fragmentation)}`}>
                    {analysis.memoryAnalysis.fragmentation.toFixed(2)}x
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Memory fragmentation ratio
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Data Type Distribution</CardTitle>
                <CardDescription>Breakdown of key types in your Redis instance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.typeDistribution.map((type, index) => (
                    <div key={type.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{type.type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {type.count} keys ({type.percentage}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${type.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-16 text-right">
                          {formatBytes(type.avgSize)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Recommendations
                </CardTitle>
                <CardDescription>
                  {analysis.recommendations.length} recommendations to improve your Redis schema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {analysis.recommendations.map((rec) => (
                      <div key={rec.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          {getRecommendationIcon(rec.type)}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{rec.title}</h4>
                              <Badge variant={getImpactColor(rec.impact)}>
                                {rec.impact} impact
                              </Badge>
                              <Badge variant="outline">
                                {rec.affectedKeys} keys ({rec.percentage}%)
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {rec.description}
                            </p>
                            <div className="bg-muted p-3 rounded-md">
                              <p className="text-sm font-medium mb-1">💡 Suggestion:</p>
                              <p className="text-sm">{rec.suggestion}</p>
                              {rec.command && (
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground mb-1">Example command:</p>
                                  <code className="text-xs bg-background px-2 py-1 rounded">
                                    {rec.command}
                                  </code>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Key Patterns
                </CardTitle>
                <CardDescription>
                  Most common key patterns in your Redis instance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {analysis.keyPatterns.slice(0, 20).map((pattern, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {pattern.pattern}
                          </code>
                          <Badge variant="outline">
                            {pattern.count} keys ({pattern.percentage}%)
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>Avg Size: {formatBytes(pattern.avgSize)}</div>
                          <div>Avg TTL: {pattern.avgTTL > 0 ? `${pattern.avgTTL}s` : 'No TTL'}</div>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${pattern.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="namespaces" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Namespace Analysis
                </CardTitle>
                <CardDescription>
                  Analysis of key namespaces and naming consistency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {analysis.namespaceAnalysis.slice(0, 20).map((ns, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                              {ns.namespace}
                            </code>
                            {ns.separator && (
                              <Badge variant="outline">Separator: {ns.separator}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {ns.count} keys ({ns.percentage}%)
                            </Badge>
                            <Badge 
                              variant={ns.consistency === 100 ? "default" : "secondary"}
                              className="flex items-center gap-1"
                            >
                              <Zap className="h-3 w-3" />
                              {ns.consistency}% consistent
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${ns.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!analysis && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
            <p className="text-muted-foreground text-center mb-4">
              Click "Run Analysis" to get insights about your Redis schema and best practices
            </p>
            <Button className="hover:cursor-pointer" onClick={runAnalysis}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Start Analysis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
