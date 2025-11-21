"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { User } from "lucide-react"

interface MentionUser {
  id: string
  name: string
  lastName: string | null
  email: string
  profilePhoto: string | null
  displayName: string
  username: string
}

interface MentionAutocompleteProps {
  query: string
  onSelect: (user: MentionUser) => void
  onClose: () => void
  position: { top: number; left: number }
}

export function MentionAutocomplete({
  query,
  onSelect,
  onClose,
  position,
}: MentionAutocompleteProps) {
  const [users, setUsers] = useState<MentionUser[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch users when query changes
  useEffect(() => {
    if (query.length < 1) {
      setUsers([])
      return
    }

    const fetchUsers = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        const result = await response.json()
        if (result.success) {
          setUsers(result.data)
          setSelectedIndex(0)
        }
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchUsers, 200)
    return () => clearTimeout(debounce)
  }, [query])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (users.length === 0) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % users.length)
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + users.length) % users.length)
          break
        case "Enter":
          e.preventDefault()
          if (users[selectedIndex]) {
            onSelect(users[selectedIndex])
          }
          break
        case "Escape":
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [users, selectedIndex, onSelect, onClose])

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = containerRef.current?.children[selectedIndex] as HTMLElement
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [selectedIndex])

  if (loading) {
    return (
      <div
        className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-500"
        style={{ top: position.top, left: position.left }}
      >
        Buscando usuarios...
      </div>
    )
  }

  if (users.length === 0) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto"
      style={{ top: position.top, left: position.left, minWidth: "250px" }}
    >
      {users.map((user, index) => (
        <button
          key={user.id}
          type="button"
          onClick={() => onSelect(user)}
          className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
            index === selectedIndex ? "bg-blue-50" : ""
          }`}
        >
          {/* Avatar */}
          {user.profilePhoto ? (
            <Image
              src={user.profilePhoto}
              alt={user.displayName}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-white" />
            </div>
          )}

          {/* User info */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{user.displayName}</div>
            <div className="text-xs text-gray-500 truncate">@{user.username}</div>
          </div>
        </button>
      ))}
    </div>
  )
}
