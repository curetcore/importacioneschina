"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MarkdownEditor } from "@/components/markdown/MarkdownEditor"

interface CommentReplyFormProps {
  parentId: string
  parentAuthor: string
  onSubmit: (content: string, parentId: string, attachments: File[]) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function CommentReplyForm({
  parentId,
  parentAuthor,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CommentReplyFormProps) {
  const [content, setContent] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim()) {
      onSubmit(content, parentId, attachments)
      setContent("")
      setAttachments([])
    }
  }

  return (
    <div className="ml-12 mt-3 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">
            Respondiendo a <span className="font-semibold">{parentAuthor}</span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Editor */}
        <div className="bg-white rounded-lg border border-gray-200">
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="Escribe tu respuesta..."
            minRows={3}
          />
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
              >
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <input
            type="file"
            multiple
            onChange={e => {
              if (e.target.files) {
                setAttachments(prev => [...prev, ...Array.from(e.target.files!)])
              }
            }}
            className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Enviando..." : "Responder"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
