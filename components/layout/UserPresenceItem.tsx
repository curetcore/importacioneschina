import { OnlineUser } from "@/hooks/useOnlinePresence"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface UserPresenceItemProps {
  user: OnlineUser
  isOnline: boolean
}

export function UserPresenceItem({ user, isOnline }: UserPresenceItemProps) {
  const displayName = [user.name, user.lastName].filter(Boolean).join(" ")
  const initials = displayName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

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

  return (
    <div className="flex items-center gap-3 py-2 px-1 rounded-md hover:bg-gray-50 transition-colors">
      {/* Avatar con badge de estado */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
          {initials}
        </div>

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
        >
          {getLastActiveText()}
        </p>
      </div>
    </div>
  )
}
