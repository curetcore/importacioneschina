"use client"

import { useState, useRef, useEffect } from "react"
import { Smile } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  disabled?: boolean
}

// Popular emojis for reactions
const REACTION_EMOJIS = [
  "👍", // Thumbs up
  "❤️", // Heart
  "😊", // Happy
  "🎉", // Party
  "🚀", // Rocket
  "👏", // Clap
  "🔥", // Fire
  "💯", // 100
  "😂", // Laugh
  "🤔", // Thinking
  "👀", // Eyes
  "✅", // Check
]

export function EmojiPicker({ onSelect, disabled = false }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="h-7 px-2 text-xs"
        title="Agregar reacción"
      >
        <Smile className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl p-3 z-[100] min-w-[220px]">
          <div className="grid grid-cols-6 gap-2">
            {REACTION_EMOJIS.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="w-9 h-9 flex items-center justify-center text-2xl hover:bg-gray-100 rounded-md transition-all hover:scale-110"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
