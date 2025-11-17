/**
 * Cache utilities using Next.js unstable_cache
 *
 * Provides strategic caching for frequently accessed, rarely changing data
 */

import { unstable_cache } from "next/cache"
import { revalidateTag } from "next/cache"

/**
 * Cache tags for different data types
 */
export const CacheTags = {
  CONFIGURACION: "configuracion",
  PROVEEDORES: "proveedores",
  DASHBOARD: "dashboard",
  OC_CHINA: "oc-china",
  AUDIT_LOGS: "audit-logs",
  NOTIFICACIONES: "notificaciones",
} as const

/**
 * Cache durations (in seconds)
 */
export const CacheDurations = {
  CONFIGURACION: 60 * 60, // 1 hour - config changes rarely
  PROVEEDORES: 60 * 30, // 30 minutes
  DASHBOARD: 60 * 5, // 5 minutes - needs fresh data but not real-time
  OC_CHINA: 60 * 2, // 2 minutes
  AUDIT_LOGS: 60 * 10, // 10 minutes
  NOTIFICACIONES: 60, // 1 minute - more real-time
} as const

/**
 * Create a cached function with automatic tag and revalidation
 */
export function createCachedFn<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  {
    tags,
    revalidate,
  }: {
    tags: string[]
    revalidate: number
  }
): T {
  return unstable_cache(fn, undefined, {
    tags,
    revalidate,
  }) as T
}

/**
 * Invalidate cache by tag
 */
export function invalidateCache(tag: string) {
  revalidateTag(tag)
}

/**
 * Invalidate multiple cache tags
 */
export function invalidateCaches(tags: string[]) {
  tags.forEach(tag => revalidateTag(tag))
}
