"use client"

import { useState, useEffect } from "react"
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

interface RenameAttachmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  module: "oc-china" | "gastos-logisticos" | "pagos-china"
  recordId: string | null
  fileUrl: string
  currentName: string
  onSuccess: () => void
}

export function RenameAttachmentModal({
  open,
  onOpenChange,
  module,
  recordId,
  fileUrl,
  currentName,
  onSuccess,
}: RenameAttachmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState("")

  // Reset form when file changes
  useEffect(() => {
    if (currentName) {
      setNewName(currentName)
    }
  }, [currentName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recordId || !newName.trim() || !fileUrl) return

    setLoading(true)

    try {
      // Primero obtener el registro completo
      const getResponse = await fetch(`/api/${module}/${recordId}`)
      if (!getResponse.ok) {
        throw new Error("Error al obtener información del registro")
      }

      const { data } = await getResponse.json()
      const currentAttachments = data.adjuntos || []

      // Actualizar el nombre del adjunto específico
      const updatedAttachments = currentAttachments.map((att: any) =>
        att.url === fileUrl ? { ...att, nombre: newName.trim() } : att
      )

      // Verificar si el archivo existe
      const fileExists = currentAttachments.some((att: any) => att.url === fileUrl)
      if (!fileExists) {
        throw new Error("El archivo no existe en los adjuntos")
      }

      // Actualizar usando el endpoint de attachments con PUT
      // Primero eliminar todos los adjuntos excepto el que estamos renombrando
      const otherAttachments = currentAttachments.filter((att: any) => att.url !== fileUrl)
      const renamedAttachment = currentAttachments.find((att: any) => att.url === fileUrl)

      if (!renamedAttachment) {
        throw new Error("No se encontró el archivo a renombrar")
      }

      // Actualizar el nombre
      renamedAttachment.nombre = newName.trim()

      // Reconstruir el array completo
      const finalAttachments = [...otherAttachments, renamedAttachment]

      // Actualizar en la base de datos usando PUT en el endpoint de attachments
      // Como PUT agrega adjuntos, primero eliminamos el antiguo y luego lo agregamos con nuevo nombre
      await fetch(`/api/${module}/${recordId}/attachments?fileUrl=${encodeURIComponent(fileUrl)}`, {
        method: "DELETE",
      })

      // Agregar el archivo renombrado
      const response = await fetch(`/api/${module}/${recordId}/attachments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adjuntos: [renamedAttachment] }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al renombrar archivo")
      }

      showToast.success("Archivo renombrado", {
        description: "El nombre del archivo ha sido actualizado exitosamente",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error renaming attachment:", error)
      showToast.error("Error al renombrar archivo", {
        description: error.message || "No se pudo renombrar el archivo",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Renombrar Archivo</DialogTitle>
          <DialogDescription>Cambia el nombre del archivo adjunto</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newName">Nuevo nombre</Label>
            <Input
              id="newName"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
              disabled={loading}
              placeholder="Nombre del archivo"
              autoFocus
            />
            <p className="text-xs text-gray-500">
              Ingresa el nuevo nombre para el archivo (sin cambiar la extensión)
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
            <Button type="submit" disabled={loading || !newName.trim()}>
              {loading ? "Renombrando..." : "Renombrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
