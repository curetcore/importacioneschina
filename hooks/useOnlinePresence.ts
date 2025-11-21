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
      console.log("📡 [OnlinePresence] Pusher or session not available", {
        hasPusher: !!pusher,
        hasSession: !!session,
        hasUser: !!session?.user,
      })
      return
    }

    console.log("🚀 [OnlinePresence] Setting up presence channel for user:", session.user.email)

    try {
      // Subscribe to global presence channel
      const channel = pusher.subscribe("presence-online-users") as any

      // Log subscription state
      console.log("📡 [OnlinePresence] Channel subscription state:", channel.subscriptionState)

      // When subscription succeeds, get initial member list
      channel.bind("pusher:subscription_succeeded", (members: any) => {
        console.log("✅ [OnlinePresence] Subscription succeeded!")

        const allMembers: any[] = []
        const otherMembers: OnlineUser[] = []

        members.each((member: PresenceMember) => {
          allMembers.push({ id: member.id, info: member.info })

          if (member.id !== session.user?.id) {
            otherMembers.push(member.info)
          }
        })

        console.log("👥 [OnlinePresence] All members:", allMembers)
        console.log("👥 [OnlinePresence] Other members (excluding me):", otherMembers)
        console.log("👤 [OnlinePresence] My ID:", session.user?.id)

        setOnlineUsers(otherMembers)
        console.log(`✅ [OnlinePresence] State updated: ${otherMembers.length} users online`)
      })

      // When someone joins
      channel.bind("pusher:member_added", (member: PresenceMember) => {
        console.log("➕ [OnlinePresence] User joined:", {
          id: member.id,
          info: member.info,
          isMe: member.id === session.user?.id,
        })

        if (member.id === session.user?.id) {
          console.log("⏭️  [OnlinePresence] Ignoring self join event")
          return
        }

        setOnlineUsers(prev => {
          // Avoid duplicates
          if (prev.some(u => u.id === member.id)) {
            console.log("⚠️  [OnlinePresence] User already in list, skipping")
            return prev
          }
          const updated = [...prev, member.info]
          console.log(`✅ [OnlinePresence] Added user, new count: ${updated.length}`)
          return updated
        })
      })

      // When someone leaves
      channel.bind("pusher:member_removed", (member: PresenceMember) => {
        console.log("➖ [OnlinePresence] User left:", {
          id: member.id,
          info: member.info,
        })

        if (member.id === session.user?.id) {
          console.log("⏭️  [OnlinePresence] Ignoring self leave event")
          return
        }

        setOnlineUsers(prev => {
          const updated = prev.filter(u => u.id !== member.id)
          console.log(`✅ [OnlinePresence] Removed user, new count: ${updated.length}`)
          return updated
        })

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
