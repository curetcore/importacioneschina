import { OnlineUser } from "@/hooks/useOnlinePresence"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Image from "next/image"
import { useEffect, useState } from "react"
import {
  BarChart3,
  ClipboardList,
  DollarSign,
  Truck,
  Package,
  FileText,
  Settings,
  TrendingUp,
  Bell,
  Globe,
  Edit,
  Plus,
  type LucideIcon,
} from "lucide-react"

// Mapeo de nombres de íconos a componentes lucide-react
const ICON_MAP: Record<string, LucideIcon> = {
  BarChart3,
  ClipboardList,
  DollarSign,
  Truck,
  Package,
  FileText,
  Settings,
  TrendingUp,
  Bell,
  Globe,
  Edit,
  Plus,
}

interface UserPresenceItemProps {
  user: OnlineUser
  isOnline: boolean
  isSelf?: boolean
}

export function UserPresenceItem({ user, isOnline, isSelf = false }: UserPresenceItemProps) {
  // Fase 5: Estado para forzar re-render cada minuto y actualizar timestamps
  const [, setTick] = useState(0)
  // Mostrar "Nombre Apellido" completo
  const firstName = user.name || ""
  const lastName = user.lastName || ""
  const fullName = `${firstName} ${lastName}`.trim() || user.email.split("@")[0]
  const displayName = isSelf ? `${fullName} (Tú)` : fullName

  // Iniciales: Primera letra nombre + primera letra apellido
  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    }
    const fallback = firstName || user.email
    return fallback
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const initials = getInitials()

  const getLastActiveText = () => {
    if (isOnline) {
      return "Activo ahora"
    }

    if (user.lastActiveAt) {
      try {
        const timeAgo = formatDistanceToNow(new Date(user.lastActiveAt), {
          addSuffix: true,
          locale: es,
        })
        return `Última vez: ${timeAgo}`
      } catch {
        return "Desconectado"
      }
    }

    return "Desconectado"
  }

  // Fase 5: Actualizar timestamps cada minuto para mantener la frescura
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1)
    }, 60000) // Cada minuto

    return () => clearInterval(interval)
  }, [])

  // Obtener actividad del usuario (simplificado - tiempo real sin timestamps)
  const getActivityText = (): { text: string; Icon: LucideIcon | null; color: string } | null => {
    if (!isOnline || !user.activity) {
      return null
    }

    // ⚠️ NO mostrar actividad si solo está "En línea" (es redundante con "Activo ahora")
    if (user.activity.pageName === "En línea" && !user.activity.entityName) {
      return null
    }

    // Acortar nombres de páginas
    const shortPageName = user.activity.pageName
      .replace("Órdenes de Compra", "Órdenes")
      .replace("Pagos China", "Pagos")
      .replace("Gastos Logísticos", "Gastos")
      .replace("Análisis de Costos", "Análisis")
      .replace("Configuración", "Config")
      .replace("Notificaciones", "Notif")

    const action = user.activity.action || ""
    let Icon = ICON_MAP[user.activity.pageIcon] || Globe
    let color = user.activity.pageColor || "text-gray-500"
    let baseText = ""

    // Si está viendo/editando una entidad específica
    if (user.activity.entityName) {
      if (action === "Editando") {
        baseText = `Editando ${user.activity.entityName}`
        Icon = Edit
        color = "text-orange-500"
      } else {
        // Solo mostrar el nombre de la entidad
        baseText = user.activity.entityName
      }
    } else if (action === "Creando") {
      // Creando nueva entidad
      baseText = `Creando ${shortPageName}`
      Icon = Plus
      color = "text-green-500"
    } else {
      // Navegando en una sección
      baseText = shortPageName
    }

    return { text: baseText, Icon, color }
  }

  const activityData = getActivityText()

  return (
    <div className="flex items-center gap-3 py-2 px-1 rounded-md hover:bg-gray-50 transition-colors">
      {/* Avatar con badge de estado */}
      <div className="relative flex-shrink-0">
        {user.profilePhoto ? (
          <Image
            src={user.profilePhoto}
            alt={displayName}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200"
            unoptimized
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            {initials}
          </div>
        )}

        {/* Badge de estado (verde = online, gris = offline) */}
        <div
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
        />
      </div>

      {/* Información del usuario */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>

        <p
          className={`text-xs truncate ${
            isOnline ? "text-green-600 font-medium" : "text-gray-500"
          }`}
          suppressHydrationWarning
        >
          {getLastActiveText()}
        </p>

        {/* Actividad del usuario (Fase 2) - Solo visible cuando está online */}
        {activityData && (
          <div className="flex items-center gap-1.5 mt-0.5">
            {activityData.Icon && (
              <activityData.Icon className={`w-3 h-3 flex-shrink-0 ${activityData.color}`} />
            )}
            <p className="text-xs text-gray-500 truncate" suppressHydrationWarning>
              {activityData.text}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
