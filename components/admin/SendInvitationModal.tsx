"use client"

import { useState } from "react"
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
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { Mail, Send, AlertCircle } from "lucide-react"

interface SendInvitationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SendInvitationModal({ open, onOpenChange }: SendInvitationModalProps) {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    role: "limitado",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validación client-side
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    // Validar rol
    if (!["limitado", "admin", "superadmin"].includes(formData.role)) {
      newErrors.role = "Rol inválido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          role: formData.role,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Error al enviar invitación")
      }

      addToast({
        type: "success",
        title: "Invitación enviada",
        description: data.message || `Invitación enviada exitosamente a ${formData.email}`,
      })

      // Resetear formulario
      setFormData({ email: "", role: "limitado" })

      // Refrescar lista de usuarios (la invitación aparecerá cuando se registre)
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })

      onOpenChange(false)
    } catch (error: any) {
      console.error("Error sending invitation:", error)
      addToast({
        type: "error",
        title: "Error al enviar invitación",
        description:
          error.message || "No se pudo enviar la invitación. Por favor intenta nuevamente.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Resetear formulario al cerrar
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFormData({ email: "", role: "limitado" })
      setErrors({})
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <DialogTitle>Enviar Invitación</DialogTitle>
          </div>
          <DialogDescription>
            Invita a un nuevo usuario a unirse al sistema. Se enviará un correo con un enlace para
            completar el registro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
              placeholder="usuario@ejemplo.com"
              className={errors.email ? "border-red-500" : ""}
              autoFocus
            />
            {errors.email && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="w-3 h-3" />
                {errors.email}
              </div>
            )}
            <p className="text-xs text-gray-500">
              El usuario recibirá un correo con instrucciones para completar su registro
            </p>
          </div>

          {/* Rol */}
          <div className="space-y-2">
            <Label htmlFor="role">Rol *</Label>
            <Select
              options={[
                {
                  value: "limitado",
                  label: "Usuario Limitado",
                },
                {
                  value: "admin",
                  label: "Administrador",
                },
                {
                  value: "superadmin",
                  label: "Super Administrador",
                },
              ]}
              value={formData.role}
              onChange={value => setFormData({ ...formData, role: value })}
              disabled={loading}
              placeholder="Selecciona un rol"
            />
            {errors.role && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="w-3 h-3" />
                {errors.role}
              </div>
            )}
            <p className="text-xs text-gray-500">
              {formData.role === "limitado" && "Acceso solo a visualización y operaciones básicas"}
              {formData.role === "admin" &&
                "Acceso completo al sistema excepto gestión de usuarios"}
              {formData.role === "superadmin" && "Acceso total incluyendo gestión de usuarios"}
            </p>
          </div>

          {/* Información sobre expiración */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-blue-900 font-medium">Importante</p>
                <p className="text-xs text-blue-700 mt-1">
                  La invitación expirará en 7 días. El usuario deberá completar su registro antes de
                  esa fecha.
                </p>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-6 border-t mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Invitación
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
