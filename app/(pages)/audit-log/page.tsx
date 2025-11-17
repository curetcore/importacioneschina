"use client"

import MainLayout from "@/components/layout/MainLayout"
import { AuditLogViewer } from "@/components/audit/AuditLogViewer"
import { History } from "lucide-react"

export default function AuditLogPage() {
  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History size={28} />
            Historial de Auditoría
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Registro completo de todas las operaciones realizadas en el sistema
          </p>
        </div>

        {/* Audit Log Viewer */}
        <AuditLogViewer limit={30} showFilters={true} />
      </div>
    </MainLayout>
  )
}
