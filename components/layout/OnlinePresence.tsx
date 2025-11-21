"use client"

import { useState } from "react"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
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
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">{totalOnline}</span>
          <span className="text-xs text-gray-500">online</span>
        </Button>
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
