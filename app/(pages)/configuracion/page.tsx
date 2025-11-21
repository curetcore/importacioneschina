"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConfiguracionForm } from "@/components/forms/ConfiguracionForm"
import { ProveedorForm } from "@/components/forms/ProveedorForm"
import { ProveedoresList } from "@/components/registros/ProveedoresList"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/ui/toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Settings, Users, Calculator, UserCircle, History } from "lucide-react"
import { apiDelete, getErrorMessage, getErrorDetails } from "@/lib/api-client"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { DistribucionCostosSettings } from "@/components/configuracion/DistribucionCostosSettings"
import { UserProfileModal } from "@/components/user/UserProfileModal"
import { ChangePasswordModal } from "@/components/user/ChangePasswordModal"
import { EditUserModal } from "@/components/admin/EditUserModal"
import { SendInvitationModal } from "@/components/admin/SendInvitationModal"
import { InvitationsList } from "@/components/admin/InvitationsList"
import { formatTimeAgo } from "@/lib/utils"

interface Configuracion {
  id: string
  categoria: string
  valor: string
  orden: number
  activo: boolean
}

interface ConfigGroup {
  categoria: string
  titulo: string
  descripcion: string
  items: Configuracion[]
}

const categoriaLabels: Record<string, { titulo: string; descripcion: string }> = {
  categorias: {
    titulo: "Categorías Principales",
    descripcion: "Categorías disponibles para las órdenes de compra",
  },
  tiposPago: {
    titulo: "Tipos de Pago",
    descripcion: "Tipos de pago disponibles para registrar",
  },
  metodosPago: {
    titulo: "Métodos de Pago",
    descripcion: "Métodos de pago disponibles",
  },
  bodegas: {
    titulo: "Bodegas",
    descripcion: "Bodegas disponibles para inventario",
  },
  tiposGasto: {
    titulo: "Tipos de Gasto",
    descripcion: "Tipos de gastos logísticos",
  },
}

// SUPER_ADMIN_EMAIL ya no es necesario - ahora usamos roles
// const SUPER_ADMIN_EMAIL = "info@curetshop.com"

interface AuditLog {
  id: string
  entidad: string
  entidadId: string
  accion: string
  descripcion: string | null
  usuarioEmail: string | null
  usuarioNombre?: string
  ipAddress: string | null
  cambiosAntes: any
  cambiosDespues: any
  camposModificados: string[]
  createdAt: string
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  LOGIN: "bg-purple-100 text-purple-700",
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Creó",
  UPDATE: "Actualizó",
  DELETE: "Eliminó",
  LOGIN: "Inició sesión",
}

interface User {
  id: string
  email: string
  name: string
  lastName: string | null
  role: string
  createdAt: string
  updatedAt: string
}

function AdminUsersSection() {
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [invitationModalOpen, setInvitationModalOpen] = useState(false)
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users")
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Error al cargar usuarios")
      }
      return res.json()
    },
  })

  const users: User[] = data?.data || []
  const userToDelete = users.find(u => u.id === deleteUserId)

  const handleDelete = async () => {
    if (!deleteUserId) return

    setDeleteLoading(true)
    try {
      const result = await apiDelete(`/api/admin/users/${deleteUserId}`)

      if (!result.success) {
        throw new Error(result.error || "Error al eliminar usuario")
      }

      addToast({
        type: "success",
        title: "Usuario eliminado",
        description: result.message || "El usuario ha sido eliminado exitosamente",
      })

      setDeleteUserId(null)
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      queryClient.invalidateQueries({ queryKey: ["user-activity"] })
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: getErrorMessage(error),
        details: getErrorDetails(error),
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestión de Usuarios</CardTitle>
            <p className="text-sm text-gray-500 mt-2">
              Vista y administración de todos los usuarios del sistema
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setInvitationModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Enviar Invitación
            </Button>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">
              Super Admin
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Cargando usuarios...
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
              <h3 className="text-sm font-medium text-red-900 mb-2">Error al cargar usuarios</h3>
              <p className="text-sm text-red-700">{(error as Error).message}</p>
              <Button
                onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })}
                className="mt-4"
                variant="outline"
              >
                Reintentar
              </Button>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <p className="text-sm">No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Nombre
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Rol
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Registrado
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const isSuperAdmin = user.role === "superadmin"
                  return (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          {user.email}
                          {isSuperAdmin && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                              Super Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {user.name} {user.lastName || ""}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            user.role === "superadmin"
                              ? "bg-purple-100 text-purple-700"
                              : user.role === "admin"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user.role === "superadmin"
                            ? "Super Admin"
                            : user.role === "admin"
                              ? "Administrador"
                              : "Limitado"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatTimeAgo(user.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => setEditingUser(user)}
                            className="h-8 px-2 py-1"
                            title="Editar usuario"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {!isSuperAdmin && (
                            <Button
                              variant="ghost"
                              onClick={() => setDeleteUserId(user.id)}
                              className="h-8 px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <EditUserModal
        open={!!editingUser}
        onOpenChange={open => !open && setEditingUser(null)}
        user={editingUser}
      />

      <SendInvitationModal open={invitationModalOpen} onOpenChange={setInvitationModalOpen} />

      <ConfirmDialog
        open={!!deleteUserId}
        onOpenChange={open => !open && setDeleteUserId(null)}
        onConfirm={handleDelete}
        title="Eliminar Usuario"
        description={`¿Estás seguro de eliminar al usuario "${userToDelete?.email}"? Esta acción no se puede deshacer y el usuario perderá acceso al sistema.`}
        confirmText="Eliminar Usuario"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteLoading}
      />
    </Card>
  )
}

function InvitationsSection() {
  return (
    <div className="mt-6">
      <InvitationsList />
    </div>
  )
}

function UserActivitySection() {
  const { data: session } = useSession()
  const [page, setPage] = useState(1)
  const limit = 10

  const isSuperAdmin = session?.user?.role === "superadmin"

  const { data, isLoading } = useQuery({
    queryKey: ["user-activity", session?.user?.email, page, isSuperAdmin],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
      })

      // Si es super admin, no filtrar por usuario
      if (!isSuperAdmin && session?.user?.email) {
        params.append("usuarioEmail", session.user.email)
      }

      const res = await fetch(`/api/audit-logs?${params}`)
      if (!res.ok) throw new Error("Error al cargar actividad")
      return res.json()
    },
    enabled: !!session?.user?.email,
  })

  const logs: AuditLog[] = data?.data || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-500" />
            <CardTitle>
              {isSuperAdmin ? "Actividad de Todos los Usuarios" : "Mi Actividad Reciente"}
            </CardTitle>
          </div>
          {isSuperAdmin && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">
              Super Admin
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {isSuperAdmin
            ? "Vista completa de todas las acciones del sistema"
            : "Registro de tus acciones en el sistema"}
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Cargando actividad...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <History className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <p className="text-sm">No hay actividad registrada</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    {isSuperAdmin && (
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                        Usuario
                      </th>
                    )}
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Acción
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Entidad
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Descripción
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      {isSuperAdmin && (
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {log.usuarioNombre || <span className="text-gray-400">Sistema</span>}
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            ACTION_COLORS[log.accion] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {ACTION_LABELS[log.accion] || log.accion}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{log.entidad}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {log.descripcion || (
                          <span className="text-gray-400 italic">Sin descripción</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatTimeAgo(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t">
                <div className="text-sm text-gray-500">
                  Página {page} de {totalPages} ({total} registros)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-9 px-3"
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="h-9 px-3"
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function ConfiguracionPageContent() {
  const { addToast } = useToast()
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("configuracion")
  const [formOpen, setFormOpen] = useState(false)
  const [configToEdit, setConfigToEdit] = useState<Configuracion | null>(null)
  const [configToDelete, setConfigToDelete] = useState<Configuracion | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedCategoria, setSelectedCategoria] = useState<string>("")

  // Proveedor CRM state (tab separado)
  const [proveedorFormOpen, setProveedorFormOpen] = useState(false)
  const [proveedorToEdit, setProveedorToEdit] = useState<any>(null)
  const [proveedorToDelete, setProveedorToDelete] = useState<any>(null)
  const [deleteProveedorLoading, setDeleteProveedorLoading] = useState(false)

  // User account modals state (tab Mi Cuenta)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)

  // Check if user is super admin
  const isSuperAdmin = session?.user?.role === "superadmin"

  // Handle URL tab parameter
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && ["configuracion", "distribucion", "proveedores", "cuenta"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Handle URL proveedorId parameter - abrir modal del proveedor específico
  useEffect(() => {
    const proveedorId = searchParams.get("proveedorId")
    if (proveedorId) {
      // Cambiar al tab de proveedores
      setActiveTab("proveedores")

      // Cargar datos del proveedor y abrir modal
      fetch(`/api/proveedores/${proveedorId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setProveedorToEdit(data.data)
            setProveedorFormOpen(true)
          }
        })
        .catch(error => {
          console.error("Error loading proveedor:", error)
        })
    }
  }, [searchParams])

  // Use React Query for data fetching
  const { data: rawData, isLoading } = useApiQuery<Record<string, Configuracion[]>>(
    ["configuracion"],
    "/api/configuracion"
  )

  // Transform the data into grouped format
  const configuraciones: ConfigGroup[] = rawData
    ? Object.entries(rawData)
        .filter(([key]) => key !== "proveedores") // Excluir proveedores (ahora es módulo CRM separado)
        .map(([key, items]) => ({
          categoria: key,
          titulo: categoriaLabels[key]?.titulo || key,
          descripcion: categoriaLabels[key]?.descripcion || "",
          items: items as Configuracion[],
        }))
    : []

  const handleAdd = (categoria: string) => {
    setSelectedCategoria(categoria)
    setConfigToEdit(null)
    setFormOpen(true)
  }

  const handleEdit = (config: Configuracion) => {
    setSelectedCategoria("")
    setConfigToEdit(config)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!configToDelete) return

    setDeleteLoading(true)
    try {
      const result = await apiDelete(`/api/configuracion/${configToDelete.id}`)

      if (!result.success) {
        throw new Error(result.error || "Error al eliminar la configuración")
      }

      addToast({
        type: "success",
        title: "Configuración eliminada",
        description: `${configToDelete.valor} eliminado exitosamente`,
      })

      setConfigToDelete(null)
      queryClient.invalidateQueries({ queryKey: ["configuracion"] })
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: getErrorMessage(error),
        details: getErrorDetails(error),
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setConfigToEdit(null)
    setSelectedCategoria("")
  }

  const handleDeleteProveedor = async () => {
    if (!proveedorToDelete) return

    setDeleteProveedorLoading(true)
    try {
      const result = await apiDelete(`/api/proveedores/${proveedorToDelete.id}`)

      if (!result.success) {
        throw new Error(result.error || "Error al eliminar el proveedor")
      }

      addToast({
        type: "success",
        title: "Proveedor eliminado",
        description: `${proveedorToDelete.nombre} eliminado exitosamente`,
      })

      setProveedorToDelete(null)
      queryClient.invalidateQueries({ queryKey: ["proveedores"] })
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: getErrorMessage(error),
        details: getErrorDetails(error),
      })
    } finally {
      setDeleteProveedorLoading(false)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-sm text-gray-500">Cargando configuraciones...</div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Tabs
            defaultValue="configuracion"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="configuracion" className="gap-2">
                <Settings className="w-4 h-4" />
                Configuración
              </TabsTrigger>
              <TabsTrigger value="distribucion" className="gap-2">
                <Calculator className="w-4 h-4" />
                Distribución de Costos
              </TabsTrigger>
              <TabsTrigger value="proveedores" className="gap-2">
                <Users className="w-4 h-4" />
                Proveedores CRM
              </TabsTrigger>
              <TabsTrigger value="cuenta" className="gap-2">
                <UserCircle className="w-4 h-4" />
                Mi Cuenta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="configuracion" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {configuraciones.map(config => (
                  <Card key={config.categoria}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{config.titulo}</CardTitle>
                          <p className="text-xs text-gray-500 mt-1">{config.descripcion}</p>
                        </div>
                        <Button
                          variant="ghost"
                          className="h-8 text-sm"
                          onClick={() => handleAdd(config.categoria)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Agregar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {config.items.length === 0 ? (
                          <div className="text-center py-4 text-sm text-gray-400">
                            No hay items configurados
                          </div>
                        ) : (
                          config.items.map(item => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <span>{item.valor}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                  title="Editar"
                                >
                                  <Edit className="w-3.5 h-3.5 text-gray-600" />
                                </button>
                                <button
                                  onClick={() => setConfigToDelete(item)}
                                  className="p-1 hover:bg-red-100 rounded transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-green-900">
                      ✓ Configuración Dinámica Activa
                    </h3>
                    <p className="text-xs text-green-700 mt-1">
                      Ahora puedes gestionar las configuraciones directamente desde esta interfaz.
                      Los cambios se aplicarán inmediatamente en todos los formularios del sistema.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="distribucion">
              <DistribucionCostosSettings />
            </TabsContent>

            <TabsContent value="proveedores">
              <ProveedoresList
                onAdd={() => {
                  setProveedorToEdit(null)
                  setProveedorFormOpen(true)
                }}
                onEdit={proveedor => {
                  setProveedorToEdit(proveedor)
                  setProveedorFormOpen(true)
                }}
                onDelete={proveedor => {
                  setProveedorToDelete(proveedor)
                }}
              />
            </TabsContent>

            <TabsContent value="cuenta" className="space-y-6 mt-6">
              {isSuperAdmin ? (
                <>
                  <AdminUsersSection />
                  <InvitationsSection />
                  <UserActivitySection />
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Información Personal</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-500 mb-4">
                          Administra tu información personal y preferencias de cuenta
                        </p>
                        <Button
                          onClick={() => setProfileModalOpen(true)}
                          className="w-full"
                          variant="outline"
                        >
                          <UserCircle className="w-4 h-4 mr-2" />
                          Editar Perfil
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Seguridad</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-500 mb-4">
                          Cambia tu contraseña para mantener tu cuenta segura
                        </p>
                        <Button
                          onClick={() => setPasswordModalOpen(true)}
                          className="w-full"
                          variant="outline"
                        >
                          Cambiar Contraseña
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <UserActivitySection />
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ConfiguracionForm
        open={formOpen}
        onOpenChange={handleFormClose}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["configuracion"] })
          handleFormClose()
        }}
        configToEdit={configToEdit}
        categoria={selectedCategoria}
      />

      <ConfirmDialog
        open={!!configToDelete}
        onOpenChange={open => !open && setConfigToDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Configuración"
        description={`¿Estás seguro de eliminar "${configToDelete?.valor}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteLoading}
      />

      <ProveedorForm
        open={proveedorFormOpen}
        onOpenChange={open => {
          setProveedorFormOpen(open)
          if (!open) setProveedorToEdit(null)
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["proveedores"] })
        }}
        proveedorToEdit={proveedorToEdit}
      />

      <ConfirmDialog
        open={!!proveedorToDelete}
        onOpenChange={open => !open && setProveedorToDelete(null)}
        onConfirm={handleDeleteProveedor}
        title="Eliminar Proveedor"
        description={`¿Estás seguro de eliminar "${proveedorToDelete?.nombre}"? El proveedor será marcado como inactivo.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteProveedorLoading}
      />

      <UserProfileModal open={profileModalOpen} onOpenChange={setProfileModalOpen} />
      <ChangePasswordModal open={passwordModalOpen} onOpenChange={setPasswordModalOpen} />
    </MainLayout>
  )
}

export default function ConfiguracionPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="text-center py-12 text-sm text-gray-500">Cargando configuración...</div>
        </MainLayout>
      }
    >
      <ConfiguracionPageContent />
    </Suspense>
  )
}
