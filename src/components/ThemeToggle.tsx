"use client"

import { useTheme } from "@/components/ThemeProvider"
import { Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div style={{ width: 36, height: 36 }} />
  }

  const isDark = theme === "dark"

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark"
    setTheme(newTheme)
  }

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-ghost"
      style={{ padding: "0.5rem", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}
      title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}
