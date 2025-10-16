"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"
import Image from "next/image"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
    
    // If this is a 404 error, redirect to not-found page
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      window.location.href = '/not-found'
      return
    }
  }, [error])

  const getErrorType = (error: Error) => {
    // Check for HTTP status codes in error message
    const statusMatch = error.message.match(/(\d{3})/)
    const statusCode = statusMatch ? parseInt(statusMatch[1]) : null
    
    // 4xx Client Errors
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      switch (statusCode) {
        case 400:
          return {
            title: "Invalid Request",
            description: "The request was invalid or malformed. Please check your input and try again.",
            suggestion: "retry"
          }
        case 401:
          return {
            title: "Authentication Required",
            description: "You need to log in to access this resource. Please check your credentials.",
            suggestion: "retry"
          }
        case 403:
          return {
            title: "Access Denied",
            description: "You don't have permission to access this resource. Please contact your administrator.",
            suggestion: "retry"
          }
        case 404:
          return {
            title: "Resource Not Found",
            description: "The requested resource could not be found. It may have been moved or deleted.",
            suggestion: "retry"
          }
        case 408:
          return {
            title: "Request Timeout",
            description: "The request took too long to complete. Please try again with a simpler request.",
            suggestion: "retry"
          }
        case 429:
          return {
            title: "Too Many Requests",
            description: "You've made too many requests. Please wait a moment before trying again.",
            suggestion: "retry"
          }
        default:
          return {
            title: "Client Error",
            description: "There was an issue with your request. Please check your input and try again.",
            suggestion: "retry"
          }
      }
    }
    
    // 5xx Server Errors
    if (statusCode && statusCode >= 500 && statusCode < 600) {
      switch (statusCode) {
        case 500:
          return {
            title: "Server Error",
            description: "Our servers encountered an internal error. We're working to fix this issue.",
            suggestion: "retry"
          }
        case 502:
          return {
            title: "Bad Gateway",
            description: "Our servers are temporarily unavailable. Please try again in a few moments.",
            suggestion: "retry"
          }
        case 503:
          return {
            title: "Service Unavailable",
            description: "Our service is temporarily down for maintenance. Please try again later.",
            suggestion: "retry"
          }
        case 504:
          return {
            title: "Gateway Timeout",
            description: "Our servers are taking longer than expected to respond. Please try again.",
            suggestion: "retry"
          }
        default:
          return {
            title: "Server Error",
            description: "Our servers are experiencing issues. We're working to resolve this quickly.",
            suggestion: "retry"
          }
      }
    }
    
    // Application-specific errors
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return {
        title: "Application Update Available",
        description: "A new version of the application is available. Please refresh to get the latest features and improvements.",
        suggestion: "refresh"
      }
    }
    
    if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
      return {
        title: "Connection Problem",
        description: "We're having trouble connecting to our servers. Please check your internet connection and try again.",
        suggestion: "retry"
      }
    }
    
    if (error.message.includes('Redis') || error.message.includes('connection')) {
      return {
        title: "Redis Server Unavailable",
        description: "We couldn't connect to your Redis server. Please check your connection settings and try again.",
        suggestion: "retry"
      }
    }
    
    // Default fallback
    return {
      title: "Oops! Something went wrong",
      description: "We encountered an unexpected issue. Don't worry, our team has been notified and we're working to fix it.",
      suggestion: "retry"
    }
  }

  const errorInfo = getErrorType(error)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Image
            src="/logo-dark.svg"
            alt="KeyDeck"
            width={120}
            height={80}
            className="dark:hidden mx-auto mb-4"
          />
          <Image
            src="/logo-white.svg"
            alt="KeyDeck"
            width={120}
            height={80}
            className="hidden dark:block mx-auto mb-4"
          />
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

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {errorInfo.suggestion === "refresh" ? (
                <Button 
                  onClick={() => window.location.reload()} 
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Page
                </Button>
              ) : (
                <Button 
                  onClick={reset} 
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
              )}
              
              <Button 
                onClick={() => window.location.href = '/'} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>If this problem persists, please check your connection settings or contact support.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
