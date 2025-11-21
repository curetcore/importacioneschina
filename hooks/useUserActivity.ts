"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import {
  getPageConfig,
  extractEntityId,
  fetchEntityName,
  detectAction,
  type UserActivity,
} from "@/lib/activity-helpers"

/**
 * Hook interno que usa useSearchParams (debe estar en Suspense)
 */
function useUserActivityWithParams(): UserActivity {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [activity, setActivity] = useState<UserActivity>(() => {
    const config = getPageConfig(pathname)
    const action = detectAction(pathname, undefined)
    return {
      page: pathname,
      pageName: config.name,
      pageIcon: config.icon,
      pageColor: config.color,
      action,
      timestamp: Date.now(),
    }
  })

  useEffect(() => {
    const config = getPageConfig(pathname)
    const action = detectAction(pathname, searchParams)

    const baseActivity: UserActivity = {
      page: pathname,
      pageName: config.name,
      pageIcon: config.icon,
      pageColor: config.color,
      action,
      timestamp: Date.now(),
    }

    setActivity(baseActivity)

    const entityInfo = extractEntityId(pathname)
    if (entityInfo) {
      fetchEntityName(entityInfo.type, entityInfo.id).then(entityName => {
        if (entityName) {
          setActivity(prev => ({
            ...prev,
            entityName,
          }))
        }
      })
    }
  }, [pathname, searchParams])

  return activity
}

/**
 * Fallback sin useSearchParams para SSR
 */
function useUserActivityFallback(): UserActivity {
  const pathname = usePathname()

  const [activity, setActivity] = useState<UserActivity>(() => {
    const config = getPageConfig(pathname)
    const action = detectAction(pathname, undefined)
    return {
      page: pathname,
      pageName: config.name,
      pageIcon: config.icon,
      pageColor: config.color,
      action,
      timestamp: Date.now(),
    }
  })

  useEffect(() => {
    const config = getPageConfig(pathname)
    const action = detectAction(pathname, undefined)

    const baseActivity: UserActivity = {
      page: pathname,
      pageName: config.name,
      pageIcon: config.icon,
      pageColor: config.color,
      action,
      timestamp: Date.now(),
    }

    setActivity(baseActivity)

    const entityInfo = extractEntityId(pathname)
    if (entityInfo) {
      fetchEntityName(entityInfo.type, entityInfo.id).then(entityName => {
        if (entityName) {
          setActivity(prev => ({
            ...prev,
            entityName,
          }))
        }
      })
    }
  }, [pathname])

  return activity
}

/**
 * Hook para rastrear la actividad del usuario en tiempo real
 * Detecta la página actual, la entidad que está viendo, y la acción que está realizando
 *
 * Compatible con SSR - usa fallback sin searchParams durante pre-render
 */
export function useUserActivity(): UserActivity {
  // Use fallback for SSR compatibility
  return useUserActivityFallback()
}

/**
 * Hook extendido que incluye detección de entidad específica
 * (Se implementará en Fase 4)
 */
export function useUserActivityExtended(): UserActivity {
  const activity = useUserActivity()

  // TODO: Fase 4 - Detectar entidad desde URL params o context
  // const params = useParams()
  // const entityName = detectEntityName(params)

  return activity
}
