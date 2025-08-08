import * as React from "react"
import { cn } from "../../lib/utils"

const EmptyState = React.forwardRef(({ className, icon, title, description, action, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed text-center",
      className
    )}
    {...props}
  >
    {icon && (
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
    )}
    
    <div className="mt-6 max-w-sm">
      {title && (
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm text-muted-foreground mb-6">
          {description}
        </p>
      )}
      {action}
    </div>
  </div>
))
EmptyState.displayName = "EmptyState"

export { EmptyState }