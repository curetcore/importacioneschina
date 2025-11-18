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

interface RenameDocumentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string | null
  currentName: string
  onSuccess: () => void
}

export function RenameDocumentModal({
  open,
  onOpenChange,
  documentId,
  currentName,
  onSuccess,
}: RenameDocumentModalProps) {
  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState("")

  // Reset form when document changes
  useEffect(() => {
    if (currentName) {
      setNewName(currentName)
    }
  }, [currentName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!documentId || !newName.trim()) return

    setLoading(true)

    try {
      const response = await fetch(`/api/documentos/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: newName.trim() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al renombrar documento")
      }

      showToast.success("Documento renombrado", {
        description: "El nombre del documento ha sido actualizado exitosamente",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error renaming document:", error)
      showToast.error("Error al renombrar documento", {
        description: error.message || "No se pudo renombrar el documento",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Renombrar Documento</DialogTitle>
          <DialogDescription>Cambia el nombre del archivo</DialogDescription>
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
              Ingresa el nuevo nombre para el documento (sin cambiar la extensión)
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
