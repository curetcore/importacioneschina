"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Package, DollarSign, FileText, Box, Users, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface SearchResult {
  type: "orden" | "pago" | "gasto" | "inventario" | "proveedor"
  id: string
  title: string
  subtitle: string
  url: string
  metadata?: Record<string, any>
}

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  orden: "Órdenes de Compra",
  pago: "Pagos a China",
  gasto: "Gastos Logísticos",
  inventario: "Inventario",
  proveedor: "Proveedores",
}

const TYPE_ICONS: Record<SearchResult["type"], React.ReactNode> = {
  orden: <Package size={16} className="text-blue-500" />,
  pago: <DollarSign size={16} className="text-green-500" />,
  gasto: <FileText size={16} className="text-orange-500" />,
  inventario: <Box size={16} className="text-purple-500" />,
  proveedor: <Users size={16} className="text-indigo-500" />,
}

export default function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce timer
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Keyboard shortcut: Cmd+K or Ctrl+K to focus search
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }

      // ESC to close
      if (event.key === "Escape") {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Search function with debounce
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (!query.trim() || query.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    setIsOpen(true)

    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()

        if (data.success) {
          setResults(data.results || [])
        } else {
          setResults([])
        }
      } catch (error) {
        console.error("❌ Error buscando:", error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300) // 300ms debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [query])

  // Navigate to result
  const handleResultClick = (result: SearchResult) => {
    router.push(result.url)
    setIsOpen(false)
    setQuery("")
    setResults([])
    inputRef.current?.blur()
  }

  // Clear search
  const handleClear = () => {
    setQuery("")
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = []
    }
    acc[result.type].push(result)
    return acc
  }, {} as Record<SearchResult["type"], SearchResult[]>)

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Buscar... (Ctrl+K)"
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-[500px] overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="mt-2 text-sm">Buscando...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Search size={24} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm">
                {query.length < 2
                  ? "Escribe al menos 2 caracteres"
                  : "No se encontraron resultados"}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(groupedResults).map(([type, items]) => (
                <div key={type} className="mb-2 last:mb-0">
                  {/* Section Header */}
                  <div className="px-3 py-1 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    {TYPE_ICONS[type as SearchResult["type"]]}
                    <span className="text-xs font-semibold text-gray-600 uppercase">
                      {TYPE_LABELS[type as SearchResult["type"]]} ({items.length})
                    </span>
                  </div>

                  {/* Results */}
                  {items.map(result => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 border-b border-gray-50 last:border-0"
                    >
                      <div className="mt-0.5">
                        {TYPE_ICONS[result.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {result.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {result.subtitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {results.length > 0 && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
              {results.length} resultado{results.length !== 1 ? "s" : ""} encontrado
              {results.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
