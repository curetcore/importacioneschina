"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { showToast } from "@/lib/toast"
import { Camera, Trash2, User } from "lucide-react"
import Image from "next/image"
import { ProfilePhotoEditor } from "./ProfilePhotoEditor"
import { readFile } from "@/lib/image-crop-helper"
import { disconnectPusher } from "@/lib/pusher-client"

interface UserProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserProfileModal({ open, onOpenChange }: UserProfileModalProps) {
  const { data: session, update } = useSession()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    lastName: session?.user?.lastName || "",
  })

  const currentPhoto = session?.user?.profilePhoto || null

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast.error("Archivo inválido", {
        description: "Solo se permiten imágenes (JPG, PNG, WEBP)",
      })
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast.error("Archivo muy grande", {
        description: "El tamaño máximo es 5MB",
      })
      return
    }

    // Read file and open editor
    try {
      const imageDataUrl = await readFile(file)
      setImageSrc(imageDataUrl)
      setShowEditor(true)
    } catch (error) {
      showToast.error("Error al cargar imagen", {
        description: "No se pudo cargar la imagen seleccionada",
      })
    }
  }

  const handleCropComplete = async (croppedFile: File) => {
    setShowEditor(false)
    setUploadingPhoto(true)

    try {
      const formData = new FormData()
      formData.append("photo", croppedFile)

      const response = await fetch("/api/user/profile-photo", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al subir foto")
      }

      // Update session - NextAuth will fetch fresh data from database
      await update()

      showToast.success("Foto actualizada", {
        description: "Tu foto de perfil ha sido actualizada",
      })

      setImageSrc(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      queryClient.invalidateQueries({ queryKey: ["user-profile"] })

      // Force Pusher reconnection to update presence photo
      disconnectPusher()

      // Reload page to reconnect Pusher with fresh photo
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      console.error("Error uploading photo:", error)
      showToast.error("Error al subir foto", {
        description: error.message || "No se pudo subir la imagen",
      })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleCancelCrop = () => {
    setShowEditor(false)
    setImageSrc(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleRemovePhoto = async () => {
    if (!currentPhoto) return

    setUploadingPhoto(true)
    try {
      const response = await fetch("/api/user/profile-photo", {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al eliminar foto")
      }

      // Update session - NextAuth will fetch fresh data from database
      await update()

      showToast.success("Foto eliminada", {
        description: "Tu foto de perfil ha sido eliminada",
      })

      queryClient.invalidateQueries({ queryKey: ["user-profile"] })

      // Force Pusher reconnection to update presence photo
      disconnectPusher()

      // Reload page to reconnect Pusher with fresh photo
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      console.error("Error removing photo:", error)
      showToast.error("Error al eliminar foto", {
        description: error.message || "No se pudo eliminar la imagen",
      })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al actualizar perfil")
      }

      const data = await response.json()

      // Actualizar sesión de NextAuth - will fetch fresh data from database
      await update()

      showToast.success("Perfil actualizado", {
        description: "Tu información ha sido actualizada exitosamente",
      })
      queryClient.invalidateQueries({ queryKey: ["user-profile"] })

      // Force Pusher reconnection to update presence data with new name
      // This ensures "Usuarios Conectados" shows updated user info immediately
      disconnectPusher()

      // Reload page to reconnect Pusher with fresh user data
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      console.error("Error updating profile:", error)
      showToast.error("Error al actualizar perfil", {
        description: error.message || "No se pudo actualizar la información",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="space-y-3">
            <DialogTitle>Mi Perfil</DialogTitle>
            <DialogDescription>Actualiza tu información personal</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 px-6 pb-6">
            {/* Profile Photo Section */}
            <div className="space-y-3">
              <Label>Foto de Perfil</Label>
              <div className="flex items-center gap-4">
                {/* Avatar Preview */}
                <div className="relative flex-shrink-0">
                  {currentPhoto ? (
                    <Image
                      src={currentPhoto}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="rounded-full object-cover border-2 border-gray-200"
                      unoptimized
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-semibold border-2 border-gray-200">
                      <User size={32} />
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto || loading}
                      className="gap-2"
                    >
                      <Camera size={16} />
                      {currentPhoto ? "Reemplazar" : "Subir Foto"}
                    </Button>

                    {currentPhoto && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemovePhoto}
                        disabled={uploadingPhoto || loading}
                        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-gray-500">
                    Formatos: JPG, PNG, WEBP • Máximo 5MB
                    <br />
                    Podrás ajustar y recortar la imagen después de seleccionarla
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={session?.user?.email || ""}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">El email no puede ser modificado</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Rol</Label>
              <div className="px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-700">
                {session?.user?.role === "superadmin"
                  ? "Super Admin"
                  : session?.user?.role === "admin"
                    ? "Administrador"
                    : "Limitado"}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-6 border-t mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Photo Editor - Fullscreen overlay */}
      {showEditor && imageSrc && (
        <ProfilePhotoEditor
          imageSrc={imageSrc}
          onCancel={handleCancelCrop}
          onComplete={handleCropComplete}
        />
      )}
    </>
  )
}
