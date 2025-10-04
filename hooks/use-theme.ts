'use client'

import { useTheme as useNextTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function useTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme()
  const [colorTheme, setColorTheme] = useState('default')

  // Load color theme from localStorage on mount
  useEffect(() => {
    const savedColorTheme = localStorage.getItem('color-theme')
    if (savedColorTheme) {
      setColorTheme(savedColorTheme)
    }
  }, [])

  useEffect(() => {
    // Apply the color theme as a data attribute to the document
    const root = document.documentElement
    
    if (colorTheme && colorTheme !== 'default') {
      root.setAttribute('data-theme', colorTheme)
    } else {
      root.removeAttribute('data-theme')
    }
  }, [colorTheme])

  const setColorThemeAndPreserveMode = (newColorTheme: string) => {
    setColorTheme(newColorTheme)
    localStorage.setItem('color-theme', newColorTheme)
    // Don't change the light/dark mode, just the color theme
  }

  return {
    theme, // This is for light/dark mode (light, dark, system)
    setTheme, // This is for light/dark mode
    resolvedTheme, // This is the resolved light/dark mode
    systemTheme,
    colorTheme, // This is the color theme (default, blue, green, etc.)
    setColorTheme: setColorThemeAndPreserveMode,
  }
}
