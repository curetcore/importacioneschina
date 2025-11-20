"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Loader2, Mail, UserCircle } from "lucide-react"
import Link from "next/link"

interface InvitationData {
  email: string
  role: string
  expiresAt: string
}

const roleLabels: Record<string, string> = {
  limitado: "Usuario Limitado",
  admin: "Administrador",
  superadmin: "Super Administrador",
}

export default function InvitationPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  // Estados de carga y validación
  const [isValidating, setIsValidating] = useState(true)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null)

  // Estados del formulario
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Validar token al cargar
  useEffect(() => {
    async function validateToken() {
      try {
        const res = await fetch(`/api/auth/invitation/${token}`)
        const data = await res.json()

        if (!data.success) {
          setValidationError(data.error || "Invitación inválida")
          setIsValidating(false)
          return
        }

        setInvitationData(data.data)
        setIsValidating(false)
      } catch (error) {
        setValidationError("Error al validar invitación. Por favor intenta nuevamente.")
        setIsValidating(false)
      }
    }

    if (token) {
      validateToken()
    }
  }, [token])

  // Validación client-side
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (formData.name.trim().length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres"
    }

    if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "El apellido debe tener al menos 2 caracteres"
    }

    if (formData.password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Manejar submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/auth/invitation/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          lastName: formData.lastName,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        setSubmitError(data.error || "Error al completar registro")
        setIsSubmitting(false)
        return
      }

      setSuccess(true)

      // Redirigir a login después de 3 segundos
      setTimeout(() => {
        router.push("/login?registered=true")
      }, 3000)
    } catch (error) {
      setSubmitError("Error al completar registro. Por favor intenta nuevamente.")
      setIsSubmitting(false)
    }
  }

  // Estado de validación
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-sm text-gray-600">Validando invitación...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error de validación
  if (validationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <CardTitle>Invitación Inválida</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{validationError}</p>
            <Link href="/login">
              <Button className="w-full" variant="outline">
                Ir a Inicio de Sesión
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Éxito
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <CardTitle>Registro Completado</CardTitle>
            </div>
            <CardDescription>Tu cuenta ha sido creada exitosamente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800">
                Redirigiendo a la página de inicio de sesión...
              </p>
            </div>
            <Link href="/login">
              <Button className="w-full">Ir a Inicio de Sesión</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Formulario de registro
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Completar Registro</CardTitle>
          <CardDescription>Has sido invitado a unirte al Sistema de Importaciones</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Información de la invitación */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">{invitationData?.email}</p>
                <p className="text-xs text-blue-700 mt-1">
                  Rol: {roleLabels[invitationData?.role || "limitado"]}
                </p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Juan"
                disabled={isSubmitting}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Apellido */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Pérez"
                disabled={isSubmitting}
                className={errors.lastName ? "border-red-500" : ""}
              />
              {errors.lastName && <p className="text-xs text-red-600">{errors.lastName}</p>}
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 8 caracteres"
                disabled={isSubmitting}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
            </div>

            {/* Confirmar Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Repetir contraseña"
                disabled={isSubmitting}
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Error de submit */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-800">{submitError}</p>
              </div>
            )}

            {/* Botón submit */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  <UserCircle className="w-4 h-4 mr-2" />
                  Crear Cuenta
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-xs text-gray-500">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Iniciar Sesión
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
