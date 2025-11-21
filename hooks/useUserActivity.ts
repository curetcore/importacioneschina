"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import {
  getPageConfig,
  extractEntityId,
  fetchEntityName,
  detectAction,
  type UserActivity,
} from "@/lib/activity-helpers"

/**
 * Hook para rastrear la actividad del usuario en tiempo real
 * Detecta la página actual, la entidad que está viendo, y la acción que está realizando
 */
export function useUserActivity(): UserActivity {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [activity, setActivity] = useState<UserActivity>(() => {
    const config = getPageConfig(pathname)
    // Don't use searchParams in initial state to avoid SSR issues
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

  // Actualizar actividad cuando cambia la ruta o query params (Fase 4 + Fase 6)
  useEffect(() => {
    const config = getPageConfig(pathname)
    const action = detectAction(pathname, searchParams)

    // Crear actividad base
    const baseActivity: UserActivity = {
      page: pathname,
      pageName: config.name,
      pageIcon: config.icon,
      pageColor: config.color,
      action,
      timestamp: Date.now(),
    }

    setActivity(baseActivity)

    // Fase 4: Detectar y fetchear nombre de entidad si aplica
    const entityInfo = extractEntityId(pathname)
    if (entityInfo) {
      // Fetch async del nombre de la entidad
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
