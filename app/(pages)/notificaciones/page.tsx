"use client"

import MainLayout from "@/components/layout/MainLayout"
import { AuditLogViewer } from "@/components/audit/AuditLogViewer"

export default function NotificacionesPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <AuditLogViewer limit={30} showFilters={true} />
      </div>
    </MainLayout>
  )
}
