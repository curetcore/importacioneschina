"use client"

import { useState } from "react"
import { Users } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useOnlinePresence } from "@/hooks/useOnlinePresence"
import { UserPresenceItem } from "./UserPresenceItem"

/**
 * Componente que muestra usuarios conectados en tiempo real en el navbar
 */
export function OnlinePresence() {
  const [open, setOpen] = useState(false)
  const { onlineUsers, recentUsers } = useOnlinePresence()

  const totalOnline = onlineUsers.length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Usuarios conectados en tiempo real"
        >
          <Users size={20} className="text-white" />
          {totalOnline > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {totalOnline > 9 ? "9+" : totalOnline}
            </span>
          )}
          {/* Indicador de tiempo real activo */}
          <span className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full h-2.5 w-2.5 border-2 border-white"></span>
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
          {onlineUsers.length > 0 && (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {onlineUsers.map(user => (
                <UserPresenceItem key={user.id} user={user} isOnline={true} />
              ))}
            </div>
          )}

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

          {/* Empty State */}
          {onlineUsers.length === 0 && recentUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No hay otros usuarios conectados</p>
              <p className="text-xs text-gray-400 mt-1">
                Serás el primero en ver cuando alguien se conecte
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
