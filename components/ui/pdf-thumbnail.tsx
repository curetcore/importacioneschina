"use client"

import { useState, useEffect } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { FileText } from "lucide-react"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

// Configurar worker de PDF.js solo en el cliente
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
}

interface PDFThumbnailProps {
  url: string
  width?: number
  height?: number
  className?: string
}

export function PDFThumbnail({ url, width = 40, height = 40, className = "" }: PDFThumbnailProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-red-50 border-2 border-red-200 rounded ${className}`}
        style={{ width, height }}
      >
        <FileText size={16} className="text-red-500" />
      </div>
    )
  }

  return (
    <div
      className={`overflow-hidden bg-white border-2 border-gray-200 rounded ${className}`}
      style={{ width, height }}
    >
      <Document
        file={url}
        onLoadSuccess={() => setLoading(false)}
        onLoadError={() => {
          setError(true)
          setLoading(false)
        }}
        loading={
          <div className="flex items-center justify-center w-full h-full bg-gray-100">
            <FileText size={16} className="text-gray-400 animate-pulse" />
          </div>
        }
      >
        <Page
          pageNumber={1}
          width={width}
          height={height}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="pdf-thumbnail"
        />
      </Document>
    </div>
  )
}
