"use client"

import MainLayout from "@/components/layout/MainLayout"
import { AuditLogViewer } from "@/components/audit/AuditLogViewer"
import { Bell } from "lucide-react"

export default function NotificacionesPage() {
  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell size={28} />
            Notificaciones del Sistema
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Registro completo de todas las operaciones realizadas en el sistema
          </p>
        </div>

        {/* Audit Log Viewer (la tabla que te gusta) */}
        <AuditLogViewer limit={30} showFilters={true} />
      </div>
    </MainLayout>
  )
}
