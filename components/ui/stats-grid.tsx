import * as React from "react"
import { cn } from "@/lib/utils"

export interface StatsGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns in the grid (responsive) */
  cols?: 2 | 3 | 4
  /** Children (StatCard components) */
  children: React.ReactNode
}

const colsClasses = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
}

const StatsGrid = React.forwardRef<HTMLDivElement, StatsGridProps>(
  ({ className, cols = 4, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "grid gap-4",
          colsClasses[cols],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
StatsGrid.displayName = "StatsGrid"

export { StatsGrid }
