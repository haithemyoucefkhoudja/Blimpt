"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "@/providers/theme-provider"

function ThemeIndicator() {
  const { theme, setTheme } = useTheme()
  const [isRotating, setIsRotating] = useState(false)

  const handleClick = () => {
    setIsRotating(true)
    setTheme(theme === "system" ? "dark" : theme === "dark" ? "light" : "system")
  }

  useEffect(() => {
    if (isRotating) {
      const timer = setTimeout(() => setIsRotating(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isRotating])

  const getIcon = () => {
    switch (theme) {
      case "dark":
        return <Moon className="h-[1.2rem] w-[1.2rem]" />
      case "light":
        return <Sun className="h-[1.2rem] w-[1.2rem]" />
      case "system":
        return <Monitor className="h-[1.2rem] w-[1.2rem]" />
      default:
        return <Sun className="h-[1.2rem] w-[1.2rem]" />
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleClick}
      className={`rounded-full transition-transform duration-300 ease-in-out ${isRotating ? "rotate-180" : ""}`}
    >
      <div className={`transition-opacity duration-300 ease-in-out ${isRotating ? "opacity-0" : "opacity-100"}`}>
        {getIcon()}
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export default ThemeIndicator

