"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Image from "next/image"
import { User, MessageSquare, MoreVertical } from "lucide-react"
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer"
import { EmojiPicker } from "@/components/reactions/EmojiPicker"
import { ReactionsDisplay } from "@/components/reactions/ReactionsDisplay"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CommentUser {
  id: string
  name: string
  lastName: string | null
  email: string
  profilePhoto: string | null
}

interface Reaction {
  emoji: string
  count: number
  users: Array<{
    id: string
    name: string
    lastName: string | null
    profilePhoto: string | null
  }>
  userReacted: boolean
}

interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  editedAt: string | null
  userId: string
  user: CommentUser
  attachments?: Array<{
    url: string
    name: string
    type: string
    size: number
  }>
  replies?: Comment[]
  parentId: string | null
}

interface CommentThreadProps {
  comment: Comment
  currentUserId?: string
  onDelete?: (commentId: string) => void
  onEdit?: (commentId: string) => void
  onReaction: (commentId: string, emoji: string) => void
  onReply: (parentId: string) => void
  reactions: Reaction[]
  isDeleting?: boolean
  level?: number // For indentation depth
}

export function CommentThread({
  comment,
  currentUserId,
  onDelete,
  onEdit,
  onReaction,
  onReply,
  reactions,
  isDeleting = false,
  level = 0,
}: CommentThreadProps) {
  const isOwnComment = currentUserId === comment.userId
  const maxNestingLevel = 3 // Maximum nesting depth

  // Calculate indentation based on nesting level
  const indentClass = level > 0 ? `ml-${Math.min(level * 8, 24)}` : ""

  return (
    <div className={`${level > 0 ? "mt-3" : ""}`}>
      <div
        className={`group relative flex gap-3 p-3 rounded-lg transition-colors ${
          level > 0 ? "bg-gray-50 border-l-2 border-gray-200 pl-4" : ""
        }`}
      >
        {/* User Avatar */}
        <div className="flex-shrink-0">
          {comment.user.profilePhoto ? (
            <Image
              src={comment.user.profilePhoto}
              alt={`${comment.user.name} ${comment.user.lastName || ""}`}
              width={40}
              height={40}
              className="rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-900">
                {comment.user.name} {comment.user.lastName || ""}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
              {comment.editedAt && <span className="text-xs text-gray-400 italic">(editado)</span>}
            </div>

            {/* Actions Menu */}
            {isOwnComment && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(comment.id)}>Editar</DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => !isDeleting && onDelete?.(comment.id)}
                    className={`text-red-600 ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Content */}
          <div className="text-sm text-gray-700 mb-2">
            <MarkdownRenderer content={comment.content} />
          </div>

          {/* Attachments */}
          {comment.attachments && comment.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {comment.attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-700 transition-colors"
                >
                  <span className="truncate max-w-[200px]">{attachment.name}</span>
                  <span className="text-gray-500">({(attachment.size / 1024).toFixed(1)} KB)</span>
                </a>
              ))}
            </div>
          )}

          {/* Reactions Display */}
          {reactions && reactions.length > 0 && (
            <ReactionsDisplay
              reactions={reactions}
              onReact={emoji => onReaction(comment.id, emoji)}
              disabled={!currentUserId}
            />
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-2">
            {/* Reply Button */}
            {level < maxNestingLevel && currentUserId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onReply(comment.id)}
                className="h-7 px-2 text-xs text-gray-600 hover:text-blue-600"
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                Responder
              </Button>
            )}

            {/* Emoji Picker */}
            {currentUserId && (
              <EmojiPicker onSelect={emoji => onReaction(comment.id, emoji)} disabled={false} />
            )}
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className={`${level > 0 ? "ml-4" : "ml-12"} mt-2 space-y-2`}>
          {comment.replies.map(reply => (
            <CommentThread
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onDelete={onDelete}
              onEdit={onEdit}
              onReaction={onReaction}
              onReply={onReply}
              reactions={[]} // TODO: Fetch reactions for replies
              isDeleting={isDeleting}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
