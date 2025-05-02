"use client"

import type React from "react"

import { useEffect, useRef } from "react"

interface InfiniteScrollProps {
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
  className?: string
  children: React.ReactNode
}

export function InfiniteScroll({ onLoadMore, hasMore, isLoading, className = "", children }: InfiniteScrollProps) {
  const observerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore()
        }
      },
      { threshold: 0.1 },
    )

    const currentObserver = observerRef.current
    if (currentObserver) {
      observer.observe(currentObserver)
    }

    return () => {
      if (currentObserver) {
        observer.unobserve(currentObserver)
      }
    }
  }, [onLoadMore, hasMore, isLoading])

  return (
    <div className={className} data-tauri-drag-region>
      {children}
      {(hasMore || isLoading) && (
        <div ref={observerRef} className="h-10 flex items-center justify-center">
          {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}
        </div>
      )}
    </div>
  )
}
