import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

/**
 * Skeleton component - Animated placeholder for loading states
 *
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-48" />
 * ```
 */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-gray-200", className)} />
}

interface TableSkeletonProps {
  rows?: number
  columns?: number
  showHeader?: boolean
}

/**
 * TableSkeleton - Skeleton loader for data tables
 * Matches the VirtualizedDataTable structure
 *
 * @example
 * ```tsx
 * {isLoading ? <TableSkeleton rows={10} columns={6} /> : <DataTable ... />}
 * ```
 */
export function TableSkeleton({ rows = 5, columns = 6, showHeader = true }: TableSkeletonProps) {
  return (
    <div className="w-full space-y-3">
      {/* Table Header */}
      {showHeader && (
        <div className="flex gap-4 border-b border-gray-200 pb-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-6 flex-1" />
          ))}
        </div>
      )}

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={`row-${i}`} className="flex gap-4 items-center py-2">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton
              key={`cell-${i}-${j}`}
              className={cn(
                "h-12 flex-1",
                // Add some variation to make it look more realistic
                j === 0 && "h-10",
                j === columns - 1 && "w-24 flex-initial"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

interface StatCardSkeletonProps {
  count?: number
}

/**
 * StatCardSkeleton - Skeleton loader for stat cards
 * Matches the StatCard component structure
 *
 * @example
 * ```tsx
 * {isLoading ? <StatCardSkeleton count={4} /> : <StatsGrid ... />}
 * ```
 */
export function StatCardSkeleton({ count = 4 }: StatCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={`stat-${i}`} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

interface CardSkeletonProps {
  className?: string
  showHeader?: boolean
  lines?: number
}

/**
 * CardSkeleton - Skeleton loader for generic cards
 *
 * @example
 * ```tsx
 * {isLoading ? <CardSkeleton lines={5} /> : <Card>...</Card>}
 * ```
 */
export function CardSkeleton({ className, showHeader = true, lines = 3 }: CardSkeletonProps) {
  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 p-6", className)}>
      {showHeader && (
        <>
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="border-b border-gray-200 mb-4" />
        </>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={`line-${i}`}
            className={cn(
              "h-4",
              // Vary the width to look more natural
              i === lines - 1 ? "w-3/4" : "w-full"
            )}
          />
        ))}
      </div>
    </div>
  )
}

interface FormSkeletonProps {
  fields?: number
}

/**
 * FormSkeleton - Skeleton loader for forms
 *
 * @example
 * ```tsx
 * {isLoading ? <FormSkeleton fields={6} /> : <Form>...</Form>}
 * ```
 */
export function FormSkeleton({ fields = 4 }: FormSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={`field-${i}`} className="space-y-2">
          <Skeleton className="h-4 w-32" /> {/* Label */}
          <Skeleton className="h-10 w-full" /> {/* Input */}
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-24" /> {/* Button */}
        <Skeleton className="h-10 w-24" /> {/* Button */}
      </div>
    </div>
  )
}
