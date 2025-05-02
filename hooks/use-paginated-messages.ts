"use client"

import { Message } from "@/types/Message"
import { useState, useCallback, useMemo } from "react"


interface UsePaginatedMessagesOptions {
  pageSize?: number
  initialPage?: number
}

/**
 * A simple hook to paginate an existing array of messages
 *
 * @param messages - The array of messages to paginate
 * @param options - Pagination options
 * @returns Pagination controls and paginated messages
 */
export function usePaginatedMessages(messages: Message[] | null, options: UsePaginatedMessagesOptions = {}) {
  const { pageSize = 5, initialPage = 0 } = options
  const [currentPage, setCurrentPage] = useState(initialPage)

  // Calculate total pages
  const totalPages = useMemo(() => {
    if (!messages || messages.length === 0) return 0
    return Math.ceil(messages.length / pageSize)
  }, [messages, pageSize])

  // Get current page of messages
  const paginatedMessages = useMemo(() => {
    if (!messages || messages.length === 0) return []
    const startIndex = currentPage * pageSize
    return messages.slice(startIndex, startIndex + pageSize)
  }, [messages, currentPage, pageSize])

  // Load next page
  const loadMore = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1)
      return true
    }
    return false
  }, [currentPage, totalPages])

  // Check if there are more pages
  const hasMore = useMemo(() => {
    return currentPage < totalPages - 1
  }, [currentPage, totalPages])

  // Reset pagination when messages change
  const reset = useCallback(() => {
    setCurrentPage(initialPage)
  }, [initialPage])

  return {
    paginatedMessages,
    loadMore,
    hasMore,
    currentPage,
    totalPages,
    reset,
  }
}
