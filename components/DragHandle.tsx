import { ComponentPropsWithoutRef } from "react";

export function DragHandle(props: ComponentPropsWithoutRef<"svg">) {
  return (
    <svg 
      {...props}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
      <circle cx="5" cy="5" r="1" />
      <circle cx="5" cy="12" r="1" />
      <circle cx="5" cy="19" r="1" />
      <circle cx="19" cy="5" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="19" cy="19" r="1" />
    </svg>
  );
} 