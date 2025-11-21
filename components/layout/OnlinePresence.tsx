"use client"

import { useState } from "react"
import { Users } from "lucide-react"
import { useSession } from "next-auth/react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useOnlinePresence } from "@/hooks/useOnlinePresence"
import { UserPresenceItem } from "./UserPresenceItem"

/**
 * Componente que muestra usuarios conectados en tiempo real en el navbar
 */
export function OnlinePresence() {
  const [open, setOpen] = useState(false)
  const { data: session } = useSession()
  const { onlineUsers, recentUsers } = useOnlinePresence()

  // Total incluye al usuario actual + otros usuarios conectados
  const totalOnline = onlineUsers.length + (session?.user ? 1 : 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          title="Usuarios conectados en tiempo real"
        >
          {/* Punto verde latente */}
          <div className="relative flex items-center justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            {totalOnline > 0 && (
              <div className="absolute w-2 h-2 bg-green-500 rounded-full animate-ping" />
            )}
          </div>

          {/* Texto con cantidad */}
          <span className="text-white text-sm font-medium">
            {totalOnline} {totalOnline === 1 ? "en línea" : "en línea"}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80" align="end" side="bottom">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span>Usuarios Conectados</span>
            </h3>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              {totalOnline} {totalOnline === 1 ? "persona" : "personas"}
            </span>
          </div>

          {/* Online Users */}
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {/* Current User */}
            {session?.user && (
              <UserPresenceItem
                key={session.user.id}
                user={{
                  id: session.user.id!,
                  name: session.user.name!,
                  lastName: session.user.lastName ?? undefined,
                  email: session.user.email!,
                  profilePhoto: session.user.profilePhoto ?? undefined,
                }}
                isOnline={true}
                isSelf={true}
              />
            )}

            {/* Other Users */}
            {onlineUsers.map(user => (
              <UserPresenceItem key={user.id} user={user} isOnline={true} />
            ))}
          </div>

          {/* Recent Users (Disconnected) */}
          {recentUsers.length > 0 && (
            <>
              <div className="border-t pt-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Desconectados recientemente
                </h4>
                <div className="space-y-1">
                  {recentUsers.map(user => (
                    <UserPresenceItem key={user.id} user={user} isOnline={false} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
