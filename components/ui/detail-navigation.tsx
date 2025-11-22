"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DetailNavigationProps {
  currentId: string
  apiEndpoint: string // e.g., "/api/oc-china"
  basePath: string // e.g., "/ordenes"
  className?: string
}

/**
 * Componente de navegación prev/next para páginas de detalle
 * Permite navegar entre registros sin volver a la lista
 */
export function DetailNavigation({
  currentId,
  apiEndpoint,
  basePath,
  className = "",
}: DetailNavigationProps) {
  const router = useRouter()
  const [prevId, setPrevId] = useState<string | null>(null)
  const [nextId, setNextId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${apiEndpoint}?limit=1000`)
        if (!response.ok) return

        const result = await response.json()
        const items = result.success ? result.data : []

        // Encontrar índice actual
        const currentIndex = items.findIndex((item: any) => item.id === currentId)
        if (currentIndex === -1) return

        // Determinar prev/next
        setPrevId(currentIndex > 0 ? items[currentIndex - 1].id : null)
        setNextId(currentIndex < items.length - 1 ? items[currentIndex + 1].id : null)
      } catch (error) {
        console.error("Error fetching navigation:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNavigation()
  }, [currentId, apiEndpoint])

  const handlePrev = () => {
    if (prevId) {
      router.push(`${basePath}/${prevId}`)
    }
  }

  const handleNext = () => {
    if (nextId) {
      router.push(`${basePath}/${nextId}`)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Button variant="secondary" size="sm" disabled>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="sm" disabled>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        variant="secondary"
        size="sm"
        onClick={handlePrev}
        disabled={!prevId}
        title="Anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleNext}
        disabled={!nextId}
        title="Siguiente"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}
