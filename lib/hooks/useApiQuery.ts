import { useQuery, UseQueryOptions } from "@tanstack/react-query"

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export function useApiQuery<T>(
  queryKey: unknown[],
  endpoint: string,
  options?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">
) {
  return useQuery<T, Error>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(endpoint)
      const result: ApiResponse<T> = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al cargar datos")
      }

      if (!result.data) {
        throw new Error("No hay datos disponibles")
      }

      return result.data
    },
    ...options,
  })
}
