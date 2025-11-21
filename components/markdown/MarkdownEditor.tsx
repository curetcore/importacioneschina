"use client"

import { useState, useRef, useCallback } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { MarkdownRenderer } from "./MarkdownRenderer"
import { MentionAutocomplete } from "@/components/mentions/MentionAutocomplete"
import { Eye, EyeOff, HelpCircle } from "lucide-react"
import {
  getMentionQuery,
  insertMention,
  setCursorPosition,
  getCursorPosition,
} from "@/lib/mentions"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  minRows?: number
}

/**
 * Editor de Markdown con preview en tiempo real
 * Soporta modo split (edición + preview) y modo solo edición
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Escribe un comentario... (Markdown soportado)",
  disabled = false,
  minRows = 3,
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Handle textarea input to detect mentions
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      onChange(newValue)

      // Check if we're in a mention context
      const cursorPos = getCursorPosition(e.target)
      const query = getMentionQuery(newValue, cursorPos)

      if (query !== null) {
        // Calculate position for autocomplete dropdown
        const textarea = e.target
        const { offsetTop, offsetLeft, offsetHeight } = textarea
        setMentionPosition({
          top: offsetTop + offsetHeight + 5,
          left: offsetLeft + 10,
        })
        setMentionQuery(query)
      } else {
        setMentionQuery(null)
      }
    },
    [onChange]
  )

  // Handle mention selection from autocomplete
  const handleMentionSelect = useCallback(
    (user: { id: string; displayName: string }) => {
      if (!textareaRef.current) return

      const cursorPos = getCursorPosition(textareaRef.current)
      const { newText, newCursorPosition } = insertMention(
        value,
        cursorPos,
        user.id,
        user.displayName
      )

      onChange(newText)
      setMentionQuery(null)

      // Set cursor position after React re-renders
      setTimeout(() => {
        if (textareaRef.current) {
          setCursorPosition(textareaRef.current, newCursorPosition)
        }
      }, 0)
    },
    [value, onChange]
  )

  // Close mention autocomplete
  const handleMentionClose = useCallback(() => {
    setMentionQuery(null)
  }, [])

  return (
    <div className="space-y-2">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPreview ? "Ocultar Preview" : "Mostrar Preview"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
            className="gap-2"
          >
            <HelpCircle size={16} />
            Ayuda
          </Button>
        </div>
        <span className="text-xs text-gray-500">Markdown soportado</span>
      </div>

      {/* Ayuda de Markdown */}
      {showHelp && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm space-y-2">
          <p className="font-semibold text-blue-900">Guía rápida de Markdown:</p>
          <div className="grid grid-cols-2 gap-4 text-gray-700">
            <div>
              <p>
                <code className="bg-white px-1 rounded">**negrita**</code> →{" "}
                <strong>negrita</strong>
              </p>
              <p>
                <code className="bg-white px-1 rounded">*cursiva*</code> → <em>cursiva</em>
              </p>
              <p>
                <code className="bg-white px-1 rounded">~~tachado~~</code> → <del>tachado</del>
              </p>
              <p>
                <code className="bg-white px-1 rounded">`código`</code> → <code>código</code>
              </p>
            </div>
            <div>
              <p>
                <code className="bg-white px-1 rounded">[link](url)</code> → enlace
              </p>
              <p>
                <code className="bg-white px-1 rounded"># Título</code> → Encabezado
              </p>
              <p>
                <code className="bg-white px-1 rounded">- item</code> → Lista
              </p>
              <p>
                <code className="bg-white px-1 rounded">```código```</code> → Bloque de código
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Editor + Preview */}
      <div className={showPreview ? "grid grid-cols-2 gap-4" : ""}>
        {/* Textarea de edición */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[120px] resize-y font-mono text-sm"
            rows={minRows}
          />

          {/* Mention Autocomplete */}
          {mentionQuery !== null && (
            <MentionAutocomplete
              query={mentionQuery}
              onSelect={handleMentionSelect}
              onClose={handleMentionClose}
              position={mentionPosition}
            />
          )}
        </div>

        {/* Preview de Markdown */}
        {showPreview && (
          <div className="border rounded-lg p-4 bg-gray-50 min-h-[120px] overflow-auto">
            {value ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-gray-400 text-sm italic">El preview aparecerá aquí...</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
