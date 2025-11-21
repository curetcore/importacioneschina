"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import {
  MessageSquare,
  Send,
  Edit2,
  Trash2,
  X,
  Check,
  Paperclip,
  File,
  Download,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Image from "next/image"
import { MarkdownEditor } from "@/components/markdown/MarkdownEditor"
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer"
import { subscribeToChannel, unsubscribeFromChannel } from "@/lib/pusher-client"

interface Attachment {
  url: string
  name: string
  type: string
  size: number
}

interface Comment {
  id: string
  userId: string
  entityType: string
  entityId: string
  content: string
  attachments?: Attachment[]
  editedAt: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    lastName: string | null
    email: string
    profilePhoto: string | null
  }
}

interface CommentsSectionProps {
  entityType: string
  entityId: string
  title?: string
}

export function CommentsSection({
  entityType,
  entityId,
  title = "Comentarios",
}: CommentsSectionProps) {
  const { data: session } = useSession()
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  const [newComment, setNewComment] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [newAttachments, setNewAttachments] = useState<Attachment[]>([])
  const [editAttachments, setEditAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["comments", entityType, entityId],
    queryFn: async () => {
      const response = await fetch(`/api/comments?entityType=${entityType}&entityId=${entityId}`)
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  // Create comment mutation
  const createMutation = useMutation({
    mutationFn: async ({
      content,
      attachments,
    }: {
      content: string
      attachments: Attachment[]
    }) => {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, content, attachments }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", entityType, entityId] })
      setNewComment("")
      setNewAttachments([])
      addToast({
        type: "success",
        title: "Comentario agregado",
        description: "Tu comentario ha sido publicado exitosamente",
      })
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Error",
        description: error.message || "No se pudo crear el comentario",
      })
    },
  })

  // Update comment mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const response = await fetch(`/api/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", entityType, entityId] })
      setEditingId(null)
      setEditContent("")
      addToast({
        type: "success",
        title: "Comentario actualizado",
        description: "El comentario ha sido editado exitosamente",
      })
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Error",
        description: error.message || "No se pudo actualizar el comentario",
      })
    },
  })

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/comments/${id}`, {
        method: "DELETE",
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", entityType, entityId] })
      addToast({
        type: "success",
        title: "Comentario eliminado",
        description: "El comentario ha sido eliminado exitosamente",
      })
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Error",
        description: error.message || "No se pudo eliminar el comentario",
      })
    },
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(file => formData.append("files", file))

      const response = await fetch("/api/comments/attachments", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error)

      // Add uploaded attachments to state
      setNewAttachments(prev => [...prev, ...result.data])

      if (result.warnings && result.warnings.length > 0) {
        addToast({
          type: "warning",
          title: "Algunos archivos no se pudieron subir",
          description: result.warnings.join(", "),
        })
      } else {
        addToast({
          type: "success",
          title: "Archivos subidos",
          description: `${result.data.length} archivo(s) subido(s) exitosamente`,
        })
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Error al subir archivos",
        description: error instanceof Error ? error.message : "Error desconocido",
      })
    } finally {
      setUploading(false)
      e.target.value = "" // Reset input
    }
  }

  const handleRemoveAttachment = (url: string) => {
    setNewAttachments(prev => prev.filter(att => att.url !== url))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    createMutation.mutate({ content: newComment, attachments: newAttachments })
  }

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
    setEditAttachments(comment.attachments || [])
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent("")
    setEditAttachments([])
  }

  const handleSaveEdit = (id: string) => {
    if (!editContent.trim()) return
    updateMutation.mutate({ id, content: editContent })
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este comentario?")) {
      deleteMutation.mutate(id)
    }
  }

  const getUserDisplayName = (user: Comment["user"]) => {
    // Mostrar "Nombre Apellido" completo
    const firstName = user.name || ""
    const lastName = user.lastName || ""
    const fullName = `${firstName} ${lastName}`.trim()
    return fullName || user.email.split("@")[0]
  }

  const getUserInitials = (user: Comment["user"]) => {
    // Usar nombre + apellido para iniciales
    const firstName = user.name || ""
    const lastName = user.lastName || ""

    if (firstName && lastName) {
      // Primera letra del nombre + primera letra del apellido
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    }

    // Fallback: primeras 2 letras del nombre o email
    const fallback = firstName || user.email
    return fallback
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const isImageFile = (type: string) => {
    return type.startsWith("image/")
  }

  // Subscribe to Pusher channel for real-time updates
  useEffect(() => {
    const channelName = `comments-${entityType}-${entityId}`
    const channel = subscribeToChannel(channelName)

    // Listen for new comments
    channel.bind("new-comment", (data: Comment) => {
      queryClient.setQueryData<Comment[]>(["comments", entityType, entityId], old => {
        if (!old) return [data]
        // Avoid duplicates
        if (old.some(c => c.id === data.id)) return old
        return [...old, data]
      })
    })

    // Listen for updated comments
    channel.bind("comment-updated", (data: Comment) => {
      queryClient.setQueryData<Comment[]>(["comments", entityType, entityId], old => {
        if (!old) return [data]
        return old.map(comment => (comment.id === data.id ? data : comment))
      })
    })

    // Listen for deleted comments
    channel.bind("comment-deleted", (data: { id: string }) => {
      queryClient.setQueryData<Comment[]>(["comments", entityType, entityId], old => {
        if (!old) return []
        return old.filter(comment => comment.id !== data.id)
      })
    })

    // Cleanup on unmount
    return () => {
      channel.unbind("new-comment")
      channel.unbind("comment-updated")
      channel.unbind("comment-deleted")
      unsubscribeFromChannel(channelName)
    }
  }, [entityType, entityId, queryClient])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <MessageSquare className="h-4 w-4" />
          {title} ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Comment Form */}
        {session?.user && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <MarkdownEditor
              value={newComment}
              onChange={setNewComment}
              placeholder="Escribe un comentario... (Markdown soportado)"
              disabled={createMutation.isPending}
              minRows={3}
            />

            {/* Attachments Preview */}
            {newAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newAttachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm group"
                  >
                    {isImageFile(attachment.type) ? (
                      <Image
                        src={attachment.url}
                        alt={attachment.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <File className="h-5 w-5 text-gray-500" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-700 truncate max-w-[150px]">
                        {attachment.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(attachment.size)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(attachment.url)}
                      className="ml-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center">
              {/* File Upload Button */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                  onChange={handleFileUpload}
                  disabled={uploading || createMutation.isPending}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading || createMutation.isPending}
                  className="gap-1.5"
                  onClick={e => {
                    e.preventDefault()
                    e.currentTarget.previousElementSibling?.dispatchEvent(new MouseEvent("click"))
                  }}
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  {uploading ? "Subiendo..." : "Adjuntar"}
                </Button>
              </label>

              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim() || createMutation.isPending}
                className="gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                {createMutation.isPending ? "Enviando..." : "Comentar"}
              </Button>
            </div>
          </form>
        )}

        {/* Comments List */}
        {isLoading ? (
          <div className="text-center py-8 text-sm text-gray-500">Cargando comentarios...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No hay comentarios aún</p>
            <p className="text-xs text-gray-400 mt-1">Sé el primero en comentar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map(comment => (
              <div
                key={comment.id}
                className="flex gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {comment.user.profilePhoto ? (
                    <Image
                      src={comment.user.profilePhoto}
                      alt={getUserDisplayName(comment.user)}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                      {getUserInitials(comment.user)}
                    </div>
                  )}
                </div>

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {getUserDisplayName(comment.user)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                    {comment.editedAt && (
                      <span className="text-xs text-gray-400 italic">(editado)</span>
                    )}
                  </div>

                  {/* Content */}
                  {editingId === comment.id ? (
                    <div className="space-y-2">
                      <MarkdownEditor
                        value={editContent}
                        onChange={setEditContent}
                        disabled={updateMutation.isPending}
                        minRows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(comment.id)}
                          disabled={!editContent.trim() || updateMutation.isPending}
                          className="h-7 px-2 text-xs"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={updateMutation.isPending}
                          className="h-7 px-2 text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-gray-700">
                        <MarkdownRenderer content={comment.content} />
                      </div>

                      {/* Attachments Display */}
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {comment.attachments.map((attachment, index) => (
                            <a
                              key={index}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 hover:border-blue-300 transition-all group"
                            >
                              {isImageFile(attachment.type) ? (
                                <Image
                                  src={attachment.url}
                                  alt={attachment.name}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 rounded object-cover"
                                />
                              ) : (
                                <File className="h-5 w-5 text-gray-500 group-hover:text-blue-600" />
                              )}
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600 truncate max-w-[150px]">
                                  {attachment.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatFileSize(attachment.size)}
                                </span>
                              </div>
                              <Download className="h-4 w-4 text-gray-400 group-hover:text-blue-600 ml-1" />
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Actions (only for comment author) */}
                  {session?.user?.id === comment.userId && editingId !== comment.id && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleEdit(comment)}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Edit2 className="h-3 w-3" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
