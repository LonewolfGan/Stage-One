import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full px-3 py-2",
          "text-[14px] text-[var(--ink)] font-normal",
          "bg-[var(--canvas-pure)]",
          "border border-[var(--hairline-strong)] rounded-[10px]",
          "placeholder:text-[var(--ink-tertiary)]",
          "transition-colors duration-150",
          "outline-none",
          "focus:border-[var(--ink)] focus:ring-2 focus:ring-[var(--ink)] focus:ring-offset-0",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
