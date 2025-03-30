import type React from "react"

export const Steps = ({ children }: { children: React.ReactNode }) => {
  return <div className="space-y-4">{children}</div>
}

export const Step = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={`flex items-center ${className}`}>{children}</div>
}

