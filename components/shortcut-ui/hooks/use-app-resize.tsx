"use client"

import type React from "react"

import { createContext, useContext, useCallback, useRef, useEffect, useState, useMemo } from "react"
import { MAX_HEIGHT, MAX_WIDTH, WIDTH_OFFSET } from "@/utils/constants"
import { getCurrentWindow, PhysicalSize } from "@tauri-apps/api/window"

type WindowType = "chat" | "list" | "commands" | "settings" | "history"

type AppResizeContextType = {
  ActiveWindow: WindowType
  setActiveWindow: (window: WindowType) => void
  changeSize: () => Promise<void>
  webviewRef: React.RefObject<HTMLDivElement>
  ActiveWindowRef: React.MutableRefObject<WindowType>
}

const AppResizeContext = createContext<AppResizeContextType | undefined>(undefined)

export function useAppResize() {
  const context = useContext(AppResizeContext)
  if (context === undefined) {
    throw new Error("useAppResize must be used within an AppResizeProvider")
  }
  return context
}

export function AppResizeProvider({ children }: { children: React.ReactNode }) {
  const webviewRef = useRef<HTMLDivElement>(null)
  const [ActiveWindow, setActiveWindow] = useState<WindowType>("chat")
  const ActiveWindowRef = useRef<WindowType>("chat")

  // Memoize the changeSize function to prevent unnecessary recreations
  const changeSize = useCallback(async () => {
    if (!webviewRef.current) return

    try {
      const rect = webviewRef.current.getBoundingClientRect()
      const size = await getCurrentWindow().outerSize()
      const width = Math.min(Math.max(Math.ceil(rect.width * 1.3), size.width), MAX_WIDTH)
      const height = Math.min(Math.ceil(rect.height * 1.3), MAX_HEIGHT)

      if (width && height) {
        const currentWindow = getCurrentWindow()
        const newSize = new PhysicalSize(width, height)
        await currentWindow.setSize(newSize)
        await currentWindow.setMinSize(newSize)
        await currentWindow.setMaxSize(new PhysicalSize(width + WIDTH_OFFSET, height))
      }
    } catch (error) {
      console.error("Error resizing window:", error)
    }
  }, [])

  // Update the ref whenever ActiveWindow changes
  useEffect(() => {
    ActiveWindowRef.current = ActiveWindow
  }, [ActiveWindow])

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      changeSize,
      ActiveWindow,
      setActiveWindow,
      webviewRef,
      ActiveWindowRef,
    }),
    [changeSize, ActiveWindow],
  )

  return <AppResizeContext.Provider value={contextValue}>{children}</AppResizeContext.Provider>
}

export function useSizeChange(callback: () => void, deps: React.DependencyList = []) {
  const { changeSize, ActiveWindow } = useAppResize()

  useEffect(() => {
    let isMounted = true

    const handleResize = async () => {
      if (!isMounted) return
      await changeSize()
      if (isMounted && callback) {
        callback()
      }
    }

    handleResize()

    return () => {
      isMounted = false
    }
  }, [ActiveWindow, changeSize, callback, ...deps])
}

