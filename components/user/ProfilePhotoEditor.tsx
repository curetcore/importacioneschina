"use client"

import { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCw, X, Check } from "lucide-react"
import { getCroppedImg, blobToFile, type Area } from "@/lib/image-crop-helper"
import { showToast } from "@/lib/toast"

interface ProfilePhotoEditorProps {
  imageSrc: string
  onCancel: () => void
  onComplete: (croppedFile: File) => void
}

export function ProfilePhotoEditor({ imageSrc, onCancel, onComplete }: ProfilePhotoEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleComplete = async () => {
    if (!croppedAreaPixels) return

    setProcessing(true)
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation)

      if (!croppedBlob) {
        throw new Error("Error al procesar la imagen")
      }

      // Convert blob to file
      const croppedFile = blobToFile(croppedBlob, "profile-photo.jpg")
      onComplete(croppedFile)
    } catch (error) {
      console.error("Error cropping image:", error)
      showToast.error("Error al procesar imagen", {
        description: "No se pudo recortar la imagen. Inténtalo de nuevo.",
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-black bg-opacity-50">
        <h2 className="text-xl font-semibold text-white">Editar Foto</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={processing}
            className="border-white text-white hover:bg-white hover:text-black"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleComplete}
            disabled={processing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            {processing ? "Procesando..." : "Confirmar"}
          </Button>
        </div>
      </div>

      {/* Cropper Area */}
      <div className="flex-1 relative">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
        />
      </div>

      {/* Controls */}
      <div className="px-6 py-6 bg-black bg-opacity-50 space-y-6">
        {/* Zoom Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-white text-sm">
            <span className="flex items-center gap-2">
              <ZoomOut className="w-4 h-4" />
              Zoom
            </span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <div className="flex items-center gap-4">
            <Slider
              value={[zoom]}
              onValueChange={values => setZoom(values[0])}
              min={1}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Rotation Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-white text-sm">
            <span className="flex items-center gap-2">
              <RotateCw className="w-4 h-4" />
              Rotación
            </span>
            <span>{rotation}°</span>
          </div>
          <Slider
            value={[rotation]}
            onValueChange={values => setRotation(values[0])}
            min={0}
            max={360}
            step={1}
            className="flex-1"
          />
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-400">
          <p>Arrastra para mover • Pellizca o usa el slider para hacer zoom</p>
          <p className="mt-1">Usa la rotación para ajustar la orientación</p>
        </div>
      </div>
    </div>
  )
}
