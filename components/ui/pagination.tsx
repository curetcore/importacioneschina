import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./button"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ currentPage, totalPages, onPageChange, className = "" }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | string)[] = []

  // Siempre mostrar primera página
  pages.push(1)

  // Mostrar páginas alrededor de la actual
  if (currentPage > 3) {
    pages.push("...")
  }

  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    pages.push(i)
  }

  if (currentPage < totalPages - 2) {
    pages.push("...")
  }

  // Siempre mostrar última página si hay más de 1
  if (totalPages > 1) {
    pages.push(totalPages)
  }

  return (
    <div className={`flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 ${className}`}>
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center"
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center"
        >
          Siguiente
        </Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Página <span className="font-medium">{currentPage}</span> de{" "}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <Button
              variant="outline"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 h-9"
            >
              <span className="sr-only">Anterior</span>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>

            {pages.map((page, idx) => (
              page === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700"
                >
                  ...
                </span>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  onClick={() => onPageChange(page as number)}
                  className={`relative inline-flex items-center px-4 h-9 text-sm ${
                    currentPage === page
                      ? "z-10 bg-gray-900 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </Button>
              )
            ))}

            <Button
              variant="outline"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 h-9"
            >
              <span className="sr-only">Siguiente</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </nav>
        </div>
      </div>
    </div>
  )
}
