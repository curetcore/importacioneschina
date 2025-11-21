"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
import { MessageSquare, Send, Edit2, Trash2, X, Check } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface Comment {
  id: string
  userId: string
  entityType: string
  entityId: string
  content: string
  editedAt: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    lastName: string | null
    email: string
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
    mutationFn: async (content: string) => {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, content }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", entityType, entityId] })
      setNewComment("")
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    createMutation.mutate(newComment)
  }

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent("")
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
          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              placeholder="Escribe un comentario..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none"
              disabled={createMutation.isPending}
            />
            <div className="flex justify-end">
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                    {getUserInitials(comment.user)}
                  </div>
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
                      <Textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        className="min-h-[60px] text-sm"
                        disabled={updateMutation.isPending}
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
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
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
