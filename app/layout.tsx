import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Redash',
  description: 'Redis management for dummies',
  generator: 'Next.js',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Redash - Redis Management for Dummies',
    description: 'A modern, intuitive Redis GUI for managing your Redis databases with ease',
    type: 'website',
    images: [
      {
        url: '/og_image.png',
        width: 1200,
        height: 630,
        alt: 'Redash - Redis Management for Dummies',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Redash - Redis Management for Dummies',
    description: 'A modern, intuitive Redis GUI for managing your Redis databases with ease',
    images: ['/logo-dark.svg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
