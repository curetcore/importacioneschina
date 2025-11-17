"use client"

import { SessionProvider } from "next-auth/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Toaster } from "sonner"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient instance in state to avoid creating new instances on each render
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - datos frescos durante 5 min (optimizado)
            gcTime: 10 * 60 * 1000, // 10 minutes - mantener en cache 10 min
            retry: 2, // Reintentar 2 veces si falla (mejorado de 1 a 2)
            refetchOnWindowFocus: false, // No refetch al cambiar de pestaña
            refetchOnReconnect: true, // Refetch al reconectar internet
          },
          mutations: {
            retry: 0, // No reintentar mutaciones automáticamente
            onError: (error) => {
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
      </SessionProvider>
      <ReactQueryDevtools initialIsOpen={false} position="bottom" />
    </QueryClientProvider>
  )
}
