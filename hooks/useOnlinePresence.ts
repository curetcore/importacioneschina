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
      console.log("📡 [OnlinePresence] Pusher or session not available")
      return
    }

    console.log("🚀 [OnlinePresence] Setting up presence channel")

    try {
      // Subscribe to global presence channel
      const channel = pusher.subscribe("presence-online-users") as any

      // When subscription succeeds, get initial member list
      channel.bind("pusher:subscription_succeeded", (members: any) => {
        console.log("✅ [OnlinePresence] Subscription succeeded")

        const membersList: OnlineUser[] = []
        members.each((member: PresenceMember) => {
          if (member.id !== session.user?.id) {
            membersList.push(member.info)
          }
        })

        setOnlineUsers(membersList)
        console.log(`👥 [OnlinePresence] ${membersList.length} users online`)
      })

      // When someone joins
      channel.bind("pusher:member_added", (member: PresenceMember) => {
        console.log("➕ [OnlinePresence] User joined:", member.info.name)

        if (member.id === session.user?.id) return

        setOnlineUsers(prev => {
          // Avoid duplicates
          if (prev.some(u => u.id === member.id)) return prev
          return [...prev, member.info]
        })
      })

      // When someone leaves
      channel.bind("pusher:member_removed", (member: PresenceMember) => {
        console.log("➖ [OnlinePresence] User left:", member.info.name)

        if (member.id === session.user?.id) return

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

      return () => {
        console.log("📤 [OnlinePresence] Cleaning up presence channel")
        channel.unbind_all()
        pusher.unsubscribe("presence-online-users")
      }
    } catch (error) {
      console.error("❌ [OnlinePresence] Error setting up presence:", error)
    }
  }, [pusher, session?.user])

  return {
    onlineUsers,
    recentUsers,
    currentUser: session?.user,
  }
}
