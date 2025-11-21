import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { usePusher } from "./usePusher"

export interface OnlineUser {
  id: string
  name: string
  lastName?: string
  email: string
  profilePhoto?: string | null
  lastActiveAt?: string
  // Actividad del usuario (Fase 1 + Fase 4)
  activity?: {
    page: string // Ruta: "/ordenes"
    pageName: string // Nombre: "Órdenes de Compra"
    pageIcon: string // Emoji: "📋"
    timestamp: number // Cuando se actualizó
    entityName?: string // Fase 4: Nombre de entidad específica: "OC-2024-001"
  }
}

export interface PresenceMember {
  id: string
  info: OnlineUser
}

const RECENT_USERS_KEY = "online_presence_recent_users"
const DAYS_TO_KEEP = 14
const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Cargar usuarios recientes desde localStorage
 */
function loadRecentUsers(): OnlineUser[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(RECENT_USERS_KEY)
    if (!stored) return []

    const users: OnlineUser[] = JSON.parse(stored)
    const now = Date.now()
    const cutoff = now - DAYS_TO_KEEP * MS_PER_DAY

    // Filtrar usuarios más antiguos de 14 días
    return users.filter(user => {
      if (!user.lastActiveAt) return false
      const lastActive = new Date(user.lastActiveAt).getTime()
      return lastActive > cutoff
    })
  } catch {
    return []
  }
}

/**
 * Guardar usuarios recientes en localStorage
 */
function saveRecentUsers(users: OnlineUser[]) {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(RECENT_USERS_KEY, JSON.stringify(users))
  } catch (error) {
    console.error("Failed to save recent users:", error)
  }
}

/**
 * Hook para trackear usuarios conectados en tiempo real usando Pusher presence channel
 */
export function useOnlinePresence() {
  const pusher = usePusher()
  const { data: session } = useSession()
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [recentUsers, setRecentUsers] = useState<OnlineUser[]>(() => loadRecentUsers())

  useEffect(() => {
    if (!pusher || !session?.user) {
      return
    }

    // Wait for Pusher to connect before subscribing
    const setupPresenceChannel = () => {
      try {
        // Subscribe to global presence channel
        const channel = pusher.subscribe("presence-online-users") as any

        // When subscription succeeds, get initial member list
        channel.bind("pusher:subscription_succeeded", (members: any) => {
          const otherMembers: OnlineUser[] = []

          members.each((member: PresenceMember) => {
            if (member.id !== session.user?.id) {
              otherMembers.push(member.info)
            }
          })

          setOnlineUsers(otherMembers)
        })

        // When someone joins
        channel.bind("pusher:member_added", (member: PresenceMember) => {
          if (member.id === session.user?.id) {
            return
          }

          setOnlineUsers(prev => {
            // Avoid duplicates
            if (prev.some(u => u.id === member.id)) {
              return prev
            }
            return [...prev, member.info]
          })
        })

        // When someone leaves
        channel.bind("pusher:member_removed", (member: PresenceMember) => {
          if (member.id === session.user?.id) {
            return
          }

          setOnlineUsers(prev => prev.filter(u => u.id !== member.id))

          // Add to recent users list (mantener historial de 14 días)
          setRecentUsers(prev => {
            const userWithTimestamp = {
              ...member.info,
              lastActiveAt: new Date().toISOString(),
            }

            // Filtrar usuario actual de la lista
            const filtered = prev.filter(u => u.id !== member.id)

            // Agregar al inicio y guardar en localStorage
            const updated = [userWithTimestamp, ...filtered]
            saveRecentUsers(updated)

            return updated
          })
        })

        // Add error handling for subscription
        channel.bind("pusher:subscription_error", (error: any) => {
          console.error("❌ [OnlinePresence] Subscription error:", error)
        })

        // Listen for activity updates (Fase 3)
        channel.bind(
          "activity-updated",
          (data: { userId: string; activity: OnlineUser["activity"] }) => {
            // Don't update own activity from broadcasts
            if (data.userId === session.user?.id) {
              return
            }

            // Update the user's activity in the online users list
            setOnlineUsers(prev =>
              prev.map(user =>
                user.id === data.userId
                  ? {
                      ...user,
                      activity: data.activity,
                    }
                  : user
              )
            )

            console.log(
              `✅ [OnlinePresence] Activity updated for user ${data.userId}: ${data.activity?.pageIcon} ${data.activity?.pageName}`
            )
          }
        )

        return channel
      } catch (error) {
        console.error("❌ [OnlinePresence] Error setting up presence:", error)
        return null
      }
    }

    // Check connection state and setup channel accordingly
    const connectionState = pusher.connection.state
    let channel: any = null

    if (connectionState === "connected") {
      // Already connected, setup immediately
      channel = setupPresenceChannel()
    } else {
      // Wait for connection
      const handleConnected = () => {
        channel = setupPresenceChannel()
      }

      pusher.connection.bind("connected", handleConnected)

      // Cleanup function to unbind the event
      return () => {
        pusher.connection.unbind("connected", handleConnected)
        if (channel) {
          channel.unbind_all()
          pusher.unsubscribe("presence-online-users")
        }
      }
    }

    // Cleanup for when already connected
    return () => {
      if (channel) {
        channel.unbind_all()
        pusher.unsubscribe("presence-online-users")
      }
    }
  }, [pusher, session?.user])

  // Limpiar usuarios expirados periódicamente
  useEffect(() => {
    const interval = setInterval(
      () => {
        const cleaned = loadRecentUsers()
        setRecentUsers(cleaned)
      },
      60 * 60 * 1000
    ) // Cada hora

    return () => clearInterval(interval)
  }, [])

  // Filtrar usuarios online de la lista de recientes para evitar duplicados
  const filteredRecentUsers = recentUsers.filter(
    recentUser => !onlineUsers.some(onlineUser => onlineUser.id === recentUser.id)
  )

  return {
    onlineUsers,
    recentUsers: filteredRecentUsers,
    currentUser: session?.user,
  }
}
