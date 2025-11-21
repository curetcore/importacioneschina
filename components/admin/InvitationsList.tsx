"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { Mail, Clock, CheckCircle, XCircle, Trash2, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface Invitation {
  id: string
  email: string
  role: string
  expiresAt: string
  accepted: boolean
  invitedBy: string
  createdAt: string
  status: "pending" | "accepted" | "expired"
}

export function InvitationsList() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // Fetch invitations
  const { data, isLoading, error } = useQuery<{ success: boolean; data: Invitation[] }>({
    queryKey: ["admin-invitations"],
    queryFn: async () => {
      const response = await fetch("/api/admin/invitations")
      if (!response.ok) {
        throw new Error("Error al cargar invitaciones")
      }
      return response.json()
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos
  })

  const invitations = data?.data || []

  // Cancelar invitación
  const handleCancelInvitation = async (id: string, email: string) => {
    if (!confirm(`¿Estás seguro de cancelar la invitación a ${email}?`)) {
      return
    }

    setCancellingId(id)

    try {
      const response = await fetch(`/api/admin/invitations/${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al cancelar invitación")
      }

      addToast({
        type: "success",
        title: "Invitación cancelada",
        description: result.message || `Invitación a ${email} cancelada exitosamente`,
      })

      // Refrescar lista
      queryClient.invalidateQueries({ queryKey: ["admin-invitations"] })
    } catch (error: any) {
      console.error("Error cancelling invitation:", error)
      addToast({
        type: "error",
        title: "Error",
        description: error.message || "No se pudo cancelar la invitación",
      })
    } finally {
      setCancellingId(null)
    }
  }

  // Role labels
  const roleLabels: Record<string, string> = {
    limitado: "Usuario Limitado",
    admin: "Administrador",
    superadmin: "Super Administrador",
  }

  // Status components
  const StatusBadge = ({ status }: { status: Invitation["status"] }) => {
    const config = {
      pending: {
        icon: Clock,
        label: "Pendiente",
        className: "bg-yellow-100 text-yellow-800 border-yellow-300",
      },
      accepted: {
        icon: CheckCircle,
        label: "Aceptada",
        className: "bg-green-100 text-green-800 border-green-300",
      },
      expired: {
        icon: XCircle,
        label: "Expirada",
        className: "bg-red-100 text-red-800 border-red-300",
      },
    }

    const { icon: Icon, label, className } = config[status]

    return (
      <Badge variant="outline" className={`${className} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <p>Error al cargar invitaciones</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invitaciones Enviadas
          </CardTitle>
          <CardDescription>No hay invitaciones enviadas</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Invitaciones Enviadas
        </CardTitle>
        <CardDescription>
          Gestiona las invitaciones pendientes, aceptadas y expiradas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invitations.map(invitation => (
            <div
              key={invitation.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  {/* Email y Rol */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{invitation.email}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {roleLabels[invitation.role] || invitation.role}
                    </Badge>
                    <StatusBadge status={invitation.status} />
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    <span>
                      Invitado por: <span className="font-medium">{invitation.invitedBy}</span>
                    </span>
                    <span>•</span>
                    <span>
                      Enviada{" "}
                      {formatDistanceToNow(new Date(invitation.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                    {invitation.status === "pending" && (
                      <>
                        <span>•</span>
                        <span>
                          Expira{" "}
                          {formatDistanceToNow(new Date(invitation.expiresAt), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </>
                    )}
                    {invitation.status === "expired" && (
                      <>
                        <span>•</span>
                        <span className="text-red-600">
                          Expiró{" "}
                          {formatDistanceToNow(new Date(invitation.expiresAt), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                {invitation.status === "pending" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                    disabled={cancellingId === invitation.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {cancellingId === invitation.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Cancelar
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
