import type React from "react"
import { cn } from "@/lib/utils"

interface OnlineStatusIndicatorProps {
  isOnline: boolean
  className?: string
}

const OnlineStatusIndicator: React.FC<OnlineStatusIndicatorProps> = ({ isOnline, className }) => {
  return (
    <div
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
        isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
        className,
      )}
    >
      <span className={cn("w-2 h-2 mr-1 rounded-full", isOnline ? "bg-green-400 animate-bounce" : "bg-red-400")} />
      {isOnline ? "On" : "Off"}
    </div>
  )
}

export default OnlineStatusIndicator