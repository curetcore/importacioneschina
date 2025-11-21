import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { usePusher } from "./usePusher"

export interface OnlineUser {
  id: string
  name: string
  lastName?: string
  email: string
  lastActiveAt?: string
}

export interface PresenceMember {
  id: string
  info: OnlineUser
}

/**
 * Hook para trackear usuarios conectados en tiempo real usando Pusher presence channel
 */
export function useOnlinePresence() {
  const pusher = usePusher()
  const { data: session } = useSession()
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [recentUsers, setRecentUsers] = useState<OnlineUser[]>([])

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

          // Add to recent users list
          setRecentUsers(prev => {
            const filtered = prev.filter(u => u.id !== member.id)
            return [
              {
                ...member.info,
                lastActiveAt: new Date().toISOString(),
              },
              ...filtered,
            ].slice(0, 5) // Keep last 5 recent users
          })
        })

        // Add error handling for subscription
        channel.bind("pusher:subscription_error", (error: any) => {
          console.error("❌ [OnlinePresence] Subscription error:", error)
        })

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

  return {
    onlineUsers,
    recentUsers,
    currentUser: session?.user,
  }
}
