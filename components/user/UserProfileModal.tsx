"use client"

import { useState } from "react"
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

interface UserProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserProfileModal({ open, onOpenChange }: UserProfileModalProps) {
  const { data: session, update } = useSession()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    lastName: session?.user?.lastName || "",
  })

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

      // Actualizar sesión de NextAuth
      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.user.name,
          lastName: data.user.lastName,
        },
      })

      showToast.success("Perfil actualizado", {
        description: "Tu información ha sido actualizada exitosamente",
      })
      queryClient.invalidateQueries({ queryKey: ["user-profile"] })
      onOpenChange(false)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <DialogTitle>Mi Perfil</DialogTitle>
          <DialogDescription>Actualiza tu información personal</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={session?.user?.email || ""} disabled className="bg-gray-50" />
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
            <div className="px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-700 capitalize">
              {session?.user?.role === "admin" ? "Administrador" : "Usuario"}
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
  )
}
