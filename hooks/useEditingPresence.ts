import { useEffect, useState } from "react"
import { usePusher } from "./usePusher"

export interface EditingUser {
  userId: string
  userName: string
  userEmail: string
  startedAt: string
}

export interface UseEditingPresenceOptions {
  resourceType: "order" | "payment" | "expense" | "inventory"
  resourceId: string
  currentUser: {
    id: string
    name: string
    email: string
  }
  enabled?: boolean
}

export function useEditingPresence(options: UseEditingPresenceOptions) {
  const { resourceType, resourceId, currentUser, enabled = true } = options
  const pusher = usePusher()
  const [editingUsers, setEditingUsers] = useState<EditingUser[]>([])

  useEffect(() => {
    if (!enabled || !pusher || !resourceId) return

    const channelName = `presence-editing-${resourceType}-${resourceId}`

    try {
      // Subscribe to presence channel
      const channel = pusher.subscribe(channelName)

      // When we successfully join
      channel.bind("pusher:subscription_succeeded", () => {
        // Announce we're editing
        channel.trigger("client-editing-started", {
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          startedAt: new Date().toISOString(),
        })
      })

      // When someone starts editing
      channel.bind("client-editing-started", (data: EditingUser) => {
        // Don't add ourselves
        if (data.userId === currentUser.id) return

        setEditingUsers(prev => {
          // Remove if already exists (prevents duplicates)
          const filtered = prev.filter(u => u.userId !== data.userId)
          return [...filtered, data]
        })
      })

      // When someone stops editing
      channel.bind("client-editing-stopped", (data: { userId: string }) => {
        if (data.userId === currentUser.id) return

        setEditingUsers(prev => prev.filter(u => u.userId !== data.userId))
      })

      // Cleanup: announce we're leaving
      return () => {
        channel.trigger("client-editing-stopped", {
          userId: currentUser.id,
        })
        channel.unbind_all()
        pusher.unsubscribe(channelName)
      }
    } catch (error) {
      console.error("Error setting up editing presence:", error)
    }
  }, [enabled, pusher, resourceType, resourceId, currentUser])

  return {
    editingUsers,
    isAnyoneEditing: editingUsers.length > 0,
  }
}
