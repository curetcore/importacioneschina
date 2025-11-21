"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { getPageConfig, type UserActivity } from "@/lib/activity-helpers"

/**
 * Hook para rastrear la actividad del usuario en tiempo real
 * Detecta la página actual y opcionalmente la entidad que está viendo
 */
export function useUserActivity(): UserActivity {
  const pathname = usePathname()
  const [activity, setActivity] = useState<UserActivity>(() => {
    const config = getPageConfig(pathname)
    return {
      page: pathname,
      pageName: config.name,
      pageIcon: config.icon,
      pageColor: config.color,
      timestamp: Date.now(),
    }
  })

  // Actualizar actividad cuando cambia la ruta
  useEffect(() => {
    const config = getPageConfig(pathname)

    setActivity({
      page: pathname,
      pageName: config.name,
      pageIcon: config.icon,
      pageColor: config.color,
      timestamp: Date.now(),
    })
  }, [pathname])

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
