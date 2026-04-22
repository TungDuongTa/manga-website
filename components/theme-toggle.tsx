"use client"

import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="relative flex h-8 w-16 items-center rounded-full bg-secondary p-1">
        <span className="absolute left-1 h-6 w-6 rounded-full bg-primary shadow-lg" />
      </div>
    )
  }

  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex h-8 w-16 items-center rounded-full bg-secondary p-1 transition-colors hover:bg-secondary/80"
      aria-label="Toggle theme"
    >
      {/* Background sliding indicator */}
      <span
        className={`absolute h-6 w-6 rounded-full bg-primary shadow-lg transition-all duration-300 ease-in-out ${
          isDark ? "left-1" : "left-[calc(100%-1.75rem)]"
        }`}
      />
      
      {/* Moon icon (left side - dark mode) */}
      <span
        className={`relative z-10 flex h-6 w-6 items-center justify-center transition-colors duration-300 ${
          isDark ? "text-primary-foreground" : "text-muted-foreground"
        }`}
      >
        <Moon className="h-3.5 w-3.5" />
      </span>
      
      {/* Sun icon (right side - light mode) */}
      <span
        className={`relative z-10 ml-auto flex h-6 w-6 items-center justify-center transition-colors duration-300 ${
          !isDark ? "text-primary-foreground" : "text-muted-foreground"
        }`}
      >
        <Sun className="h-3.5 w-3.5" />
      </span>
    </button>
  )
}
