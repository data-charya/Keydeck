'use client'

import * as React from 'react'
import { Check, Palette } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const themes = [
  {
    name: 'Classic',
    value: 'default',
    description: 'Timeless and elegant',
    colors: {
      light: 'bg-gradient-to-br from-slate-100 to-slate-200',
      dark: 'bg-gradient-to-br from-slate-800 to-slate-900'
    }
  },
  {
    name: 'Ocean Breeze',
    value: 'blue',
    description: 'Deep sea vibes',
    colors: {
      light: 'bg-gradient-to-br from-blue-200 to-cyan-300',
      dark: 'bg-gradient-to-br from-blue-800 to-indigo-900'
    }
  },
  {
    name: 'Forest Magic',
    value: 'green',
    description: 'Nature\'s embrace',
    colors: {
      light: 'bg-gradient-to-br from-emerald-200 to-teal-300',
      dark: 'bg-gradient-to-br from-green-800 to-emerald-900'
    }
  },
  {
    name: 'Cosmic Purple',
    value: 'purple',
    description: 'Galaxy dreams',
    colors: {
      light: 'bg-gradient-to-br from-purple-200 to-violet-300',
      dark: 'bg-gradient-to-br from-purple-800 to-violet-900'
    }
  },
  {
    name: 'Sunset Glow',
    value: 'orange',
    description: 'Golden hour vibes',
    colors: {
      light: 'bg-gradient-to-br from-orange-200 to-amber-300',
      dark: 'bg-gradient-to-br from-orange-800 to-red-900'
    }
  },
  {
    name: 'Fire & Passion',
    value: 'red',
    description: 'Bold and fierce',
    colors: {
      light: 'bg-gradient-to-br from-orange-200 to-red-300',
      dark: 'bg-gradient-to-br from-orange-800 to-red-900'
    }
  },
  {
    name: 'Cherry Blossom',
    value: 'pink',
    description: 'Sweet and dreamy',
    colors: {
      light: 'bg-gradient-to-br from-fuchsia-200 to-pink-300',
      dark: 'bg-gradient-to-br from-fuchsia-800 to-pink-900'
    }
  },
  {
    name: 'Midnight Sky',
    value: 'indigo',
    description: 'Deep space mystery',
    colors: {
      light: 'bg-gradient-to-br from-violet-200 to-indigo-300',
      dark: 'bg-gradient-to-br from-violet-800 to-indigo-900'
    }
  }
]

export function ThemeSelector() {
  const { setColorTheme, colorTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" className="hover:cursor-pointer" size="icon">
        <Palette className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Select theme</span>
      </Button>
    )
  }

  const currentTheme = themes.find(t => t.value === colorTheme) || themes[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="hover:cursor-pointer" title="Select color theme">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Select theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Color Themes</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.value}
            onClick={() => setColorTheme(themeOption.value)}
            className="flex items-center justify-between hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full ${themeOption.colors.light} dark:${themeOption.colors.dark} border-2 border-border shadow-sm ring-1 ring-black/5 dark:ring-white/10`} />
              <div>
                <div className="font-medium">{themeOption.name}</div>
                <div className="text-xs text-muted-foreground">{themeOption.description}</div>
              </div>
            </div>
            {colorTheme === themeOption.value && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
