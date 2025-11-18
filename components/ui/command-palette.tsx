"use client"

import { useEffect, useState, useCallback } from "react"
import { Command } from "cmdk"
import { useRouter } from "next/navigation"
import {
  Search,
  FileText,
  DollarSign,
  Truck,
  Package,
  Users,
  Settings,
  BarChart3,
  Plus,
  ArrowRight,
} from "lucide-react"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [pages, setPages] = useState<string[]>(["home"])

  // Limpiar búsqueda al cerrar
  useEffect(() => {
    if (!open) {
      setSearch("")
      setPages(["home"])
    }
  }, [open])

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  const navigate = useCallback(
    (path: string) => {
      router.push(path)
      onOpenChange(false)
    },
    [router, onOpenChange]
  )

  const currentPage = pages[pages.length - 1]

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command Menu"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onOpenChange(false)
        }
      }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Command Panel */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <Command.Input
          value={search}
          onValueChange={setSearch}
          placeholder={
            currentPage === "home"
              ? "Buscar órdenes, proveedores, o escribir comando..."
              : "Buscar..."
          }
          className="w-full border-0 border-b border-gray-200 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-gray-400 dark:border-gray-700 dark:text-gray-100"
        />

        <Command.List className="max-h-[400px] overflow-y-auto p-2">
          <Command.Empty className="flex items-center justify-center py-6 text-sm text-gray-500">
            No se encontraron resultados
          </Command.Empty>

          {currentPage === "home" && (
            <>
              {/* Acciones Rápidas */}
              <Command.Group
                heading="Acciones Rápidas"
                className="mb-2 px-2 pt-2 text-xs font-medium text-gray-500"
              >
                <CommandItem
                  icon={<Plus className="h-4 w-4" />}
                  onSelect={() => navigate("/ordenes/nueva")}
                >
                  Nueva Orden de Compra
                </CommandItem>
                <CommandItem
                  icon={<Plus className="h-4 w-4" />}
                  onSelect={() => navigate("/pagos-china/nuevo")}
                >
                  Nuevo Pago a China
                </CommandItem>
                <CommandItem
                  icon={<Plus className="h-4 w-4" />}
                  onSelect={() => navigate("/gastos-logisticos/nuevo")}
                >
                  Nuevo Gasto Logístico
                </CommandItem>
                <CommandItem
                  icon={<Plus className="h-4 w-4" />}
                  onSelect={() => navigate("/inventario-recibido/nuevo")}
                >
                  Registrar Inventario Recibido
                </CommandItem>
              </Command.Group>

              {/* Navegación */}
              <Command.Group
                heading="Navegación"
                className="mb-2 px-2 pt-2 text-xs font-medium text-gray-500"
              >
                <CommandItem
                  icon={<BarChart3 className="h-4 w-4" />}
                  onSelect={() => navigate("/dashboard")}
                  shortcut="D"
                >
                  Dashboard
                </CommandItem>
                <CommandItem
                  icon={<FileText className="h-4 w-4" />}
                  onSelect={() => navigate("/ordenes")}
                  shortcut="O"
                >
                  Órdenes de Compra
                </CommandItem>
                <CommandItem
                  icon={<DollarSign className="h-4 w-4" />}
                  onSelect={() => navigate("/pagos-china")}
                  shortcut="P"
                >
                  Pagos a China
                </CommandItem>
                <CommandItem
                  icon={<Truck className="h-4 w-4" />}
                  onSelect={() => navigate("/gastos-logisticos")}
                  shortcut="G"
                >
                  Gastos Logísticos
                </CommandItem>
                <CommandItem
                  icon={<Package className="h-4 w-4" />}
                  onSelect={() => navigate("/inventario-recibido")}
                  shortcut="I"
                >
                  Inventario Recibido
                </CommandItem>
                <CommandItem
                  icon={<BarChart3 className="h-4 w-4" />}
                  onSelect={() => navigate("/analisis-costos")}
                  shortcut="A"
                >
                  Análisis de Costos
                </CommandItem>
                <CommandItem
                  icon={<Users className="h-4 w-4" />}
                  onSelect={() => navigate("/configuracion?tab=proveedores")}
                >
                  Proveedores
                </CommandItem>
                <CommandItem
                  icon={<Settings className="h-4 w-4" />}
                  onSelect={() => navigate("/configuracion")}
                  shortcut="S"
                >
                  Configuración
                </CommandItem>
              </Command.Group>

              {/* Resultados de Búsqueda Global */}
              {search && <GlobalSearch search={search} navigate={navigate} />}
            </>
          )}
        </Command.List>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-gray-700">
                  ↑↓
                </kbd>
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-gray-700">
                  ↵
                </kbd>
                seleccionar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-gray-700">
                  esc
                </kbd>
                cerrar
              </span>
            </div>
            {pages.length > 1 && (
              <button
                onClick={() => setPages(pages.slice(0, -1))}
                className="text-blue-600 hover:text-blue-700"
              >
                ← Volver
              </button>
            )}
          </div>
        </div>
      </div>
    </Command.Dialog>
  )
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

interface CommandItemProps {
  icon?: React.ReactNode
  children: React.ReactNode
  onSelect: () => void
  shortcut?: string
}

function CommandItem({ icon, children, onSelect, shortcut }: CommandItemProps) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-gray-100 aria-selected:bg-gray-100 dark:hover:bg-gray-700 dark:aria-selected:bg-gray-700"
    >
      {icon && <span className="text-gray-500 dark:text-gray-400">{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut && (
        <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {shortcut}
        </kbd>
      )}
    </Command.Item>
  )
}

// ============================================
// BÚSQUEDA GLOBAL
// ============================================

interface GlobalSearchProps {
  search: string
  navigate: (path: string) => void
}

interface SearchResult {
  type: "orden" | "pago" | "gasto" | "inventario" | "proveedor"
  id: string
  title: string
  subtitle: string
  url: string
}

function GlobalSearch({ search, navigate }: GlobalSearchProps) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!search || search.length < 2) {
      setResults([])
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`)
        const data = await res.json()
        setResults(data.results || [])
      } catch (error) {
        console.error("Error searching:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchResults, 300)
    return () => clearTimeout(debounce)
  }, [search])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          Buscando...
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return null
  }

  // Agrupar resultados por tipo
  const grupos = {
    orden: results.filter(r => r.type === "orden"),
    pago: results.filter(r => r.type === "pago"),
    gasto: results.filter(r => r.type === "gasto"),
    inventario: results.filter(r => r.type === "inventario"),
    proveedor: results.filter(r => r.type === "proveedor"),
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "orden":
        return <FileText className="h-4 w-4" />
      case "pago":
        return <DollarSign className="h-4 w-4" />
      case "gasto":
        return <Truck className="h-4 w-4" />
      case "inventario":
        return <Package className="h-4 w-4" />
      case "proveedor":
        return <Users className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getGroupTitle = (type: string, count: number) => {
    const titles: Record<string, string> = {
      orden: "Órdenes de Compra",
      pago: "Pagos",
      gasto: "Gastos",
      inventario: "Inventario",
      proveedor: "Proveedores",
    }
    return `${titles[type] || type} (${count})`
  }

  return (
    <>
      {Object.entries(grupos).map(
        ([tipo, items]) =>
          items.length > 0 && (
            <Command.Group
              key={tipo}
              heading={getGroupTitle(tipo, items.length)}
              className="mb-2 px-2 pt-2 text-xs font-medium text-gray-500"
            >
              {items.map(item => (
                <CommandItem
                  key={`${item.type}-${item.id}`}
                  icon={getIcon(item.type)}
                  onSelect={() => navigate(item.url)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-xs text-gray-500">{item.subtitle}</span>
                  </div>
                </CommandItem>
              ))}
            </Command.Group>
          )
      )}
    </>
  )
}
