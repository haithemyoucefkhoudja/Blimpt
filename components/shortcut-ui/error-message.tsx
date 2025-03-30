import type React from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ErrorMessageProps {
  message: string
  className?: string
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className }) => {
  return (
    <div data-tauri-drag-region className={cn("w-full flex justify-center my-4", className)}>
      <div data-tauri-drag-region
        className={cn(
          "flex w-full items-center px-4 py-3 rounded relative max-w-md",
          "bg-red-50 border border-red-400 text-red-700",
          "dark:bg-red-900/50 dark:border-red-800 dark:text-red-200",
        )}
        role="alert"
      >
        <AlertCircle className="w-6 h-6 mr-2" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  )
}

