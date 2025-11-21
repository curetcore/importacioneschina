"use client"

import { SessionProvider } from "next-auth/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Toaster } from "sonner"
import { useState } from "react"
import { CommandPalette } from "@/components/ui/command-palette"

export function Providers({ children }: { children: React.ReactNode }) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  // Create QueryClient instance in state to avoid creating new instances on each render
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds - datos frescos durante 30 seg para mejor UX
            gcTime: 5 * 60 * 1000, // 5 minutes - mantener en cache 5 min
            retry: 2, // Reintentar 2 veces si falla
            refetchOnWindowFocus: true, // Refetch al cambiar de pestaña para datos actualizados
            refetchOnReconnect: true, // Refetch al reconectar internet
          },
          mutations: {
            retry: 0, // No reintentar mutaciones automáticamente
            onError: error => {
              console.error("Mutation error:", error)
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        {children}
        <Toaster position="top-right" expand={false} richColors closeButton />
        <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      </SessionProvider>
      <ReactQueryDevtools initialIsOpen={false} position="bottom" />
    </QueryClientProvider>
  )
}
