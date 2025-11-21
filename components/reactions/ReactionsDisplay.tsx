"use client"

import { useState } from "react"

interface ReactionUser {
  id: string
  name: string
  lastName: string | null
  profilePhoto: string | null
}

interface Reaction {
  emoji: string
  count: number
  users: ReactionUser[]
  userReacted: boolean
}

interface ReactionsDisplayProps {
  reactions: Reaction[]
  onReact: (emoji: string) => void
  disabled?: boolean
}

export function ReactionsDisplay({ reactions, onReact, disabled = false }: ReactionsDisplayProps) {
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null)

  if (!reactions || reactions.length === 0) {
    return null
  }

  const getUserNames = (users: ReactionUser[]) => {
    return users
      .map(user => `${user.name}${user.lastName ? ` ${user.lastName}` : ""}`.trim())
      .join(", ")
  }

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {reactions.map(reaction => (
        <div key={reaction.emoji} className="relative">
          <button
            type="button"
            onClick={() => !disabled && onReact(reaction.emoji)}
            onMouseEnter={() => setHoveredEmoji(reaction.emoji)}
            onMouseLeave={() => setHoveredEmoji(null)}
            disabled={disabled}
            className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm border transition-all
              ${
                reaction.userReacted
                  ? "bg-blue-100 border-blue-300 text-blue-700"
                  : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
              }
              ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
            `}
          >
            <span className="text-base leading-none">{reaction.emoji}</span>
            <span className="text-xs font-medium">{reaction.count}</span>
          </button>

          {/* Tooltip with user names */}
          {hoveredEmoji === reaction.emoji && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50">
              <div className="max-w-xs">{getUserNames(reaction.users)}</div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
