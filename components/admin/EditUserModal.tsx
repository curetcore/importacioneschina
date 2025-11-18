"use client"

import { useState, useEffect } from "react"
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
import { Select } from "@/components/ui/select"

interface User {
  id: string
  email: string
  name: string
  lastName: string | null
  role: string
  createdAt: string
  updatedAt: string
}

interface EditUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function EditUserModal({ open, onOpenChange, user }: EditUserModalProps) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    role: "user",
    newPassword: "",
  })

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        lastName: user.lastName || "",
        role: user.role || "user",
        newPassword: "",
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al actualizar usuario")
      }

      const data = await response.json()

      showToast.success("Usuario actualizado", {
        description: data.message || "El usuario ha sido actualizado exitosamente",
      })

      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      queryClient.invalidateQueries({ queryKey: ["user-activity"] })
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error updating user:", error)
      showToast.error("Error al actualizar usuario", {
        description: error.message || "No se pudo actualizar la información del usuario",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>Actualiza la información del usuario {user.email}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled className="bg-gray-50" />
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
              placeholder="Nombre del usuario"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Apellido</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              disabled={loading}
              placeholder="Apellido del usuario"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol *</Label>
            <Select
              options={[
                { value: "user", label: "Usuario" },
                { value: "admin", label: "Administrador" },
              ]}
              value={formData.role}
              onChange={value => setFormData({ ...formData, role: value })}
              disabled={loading}
              placeholder="Selecciona un rol"
            />
            <p className="text-xs text-gray-500">
              Los administradores tienen acceso completo al sistema
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña (Opcional)</Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
              disabled={loading}
              placeholder="Dejar vacío para no cambiar"
              minLength={8}
            />
            <p className="text-xs text-gray-500">
              Mínimo 8 caracteres. Solo completa si deseas cambiar la contraseña del usuario.
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
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
