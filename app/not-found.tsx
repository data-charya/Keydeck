"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Home, ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function NotFound() {
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

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-muted">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <CardTitle className="text-4xl font-bold">404</CardTitle>
            <CardDescription className="text-xl">
              Page Not Found
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                The page you're looking for doesn't exist or has been moved.
              </p>
              <p className="text-sm text-muted-foreground">
                This might be because the URL was typed incorrectly or the page has been removed.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="flex items-center gap-2">
                <Link href="/">
                  <Home className="w-4 h-4" />
                  Go Home
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
