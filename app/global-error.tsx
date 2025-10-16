"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error)
  }, [error])

  const getErrorType = (error: Error) => {
    // Check for HTTP status codes in error message
    const statusMatch = error.message.match(/(\d{3})/)
    const statusCode = statusMatch ? parseInt(statusMatch[1]) : null
    
    // 4xx Client Errors
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return {
        title: "Client Error",
        description: "There was an issue with your request. Please check your input and try again.",
        isClientError: true
      }
    }
    
    // 5xx Server Errors
    if (statusCode && statusCode >= 500 && statusCode < 600) {
      return {
        title: "Server Error",
        description: "Our servers are experiencing issues. We're working to resolve this quickly.",
        isClientError: false
      }
    }
    
    // Default for other errors
    return {
      title: "Critical Application Error",
      description: "A critical error has occurred that prevented the application from loading properly.",
      isClientError: false
    }
  }

  const errorInfo = getErrorType(error)

  return (
    <html>
      <body>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <div className="text-2xl font-bold text-foreground mb-2">KeyDeck</div>
              <p className="text-muted-foreground">Cache command simplified</p>
            </div>

            <Card className="border-destructive/20">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-destructive/10">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-destructive">
                  {errorInfo.title}
                </CardTitle>
                <CardDescription className="text-lg">
                  {errorInfo.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <Alert>
                  <Bug className="h-4 w-4" />
                  <AlertDescription>
                    We're sorry for the inconvenience. Our team has been notified about this issue.
                    {error.digest && (
                      <span className="block mt-1 text-sm text-muted-foreground">
                        Reference: {error.digest}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="font-semibold">What you can try:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {errorInfo.isClientError ? (
                      <>
                        <li>• Check your input and try again</li>
                        <li>• Make sure you have the correct permissions</li>
                        <li>• Verify your connection settings</li>
                        <li>• Try refreshing the page</li>
                      </>
                    ) : (
                      <>
                        <li>• Refresh the page to reload the application</li>
                        <li>• Clear your browser cache and cookies</li>
                        <li>• Check if you have a stable internet connection</li>
                        <li>• Try using a different browser or incognito mode</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => window.location.reload()} 
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Application
                  </Button>
                  
                  <Button 
                    onClick={reset} 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  <p>If this problem persists, the application may need to be restarted or updated.</p>
                  <p className="mt-1">Please contact support if you continue to experience issues.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </body>
    </html>
  )
}
