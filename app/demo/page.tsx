"use client"

import { useEffect, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function DemoPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function autoDemoLogin() {
      try {
        const result = await signIn("credentials", {
          email: "demo@sistema.com",
          password: "Demo123!",
          redirect: false,
        })

        if (result?.error) {
          setError("Error al iniciar sesión demo. Por favor intenta nuevamente.")
          console.error("Demo login error:", result.error)
        } else {
          // Login exitoso - redirigir al panel
          router.push("/panel")
          router.refresh()
        }
      } catch (err) {
        setError("Error inesperado. Por favor intenta nuevamente.")
        console.error("Demo login exception:", err)
      }
    }

    autoDemoLogin()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar demo</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cargando Demo</h1>
          <p className="text-gray-600">Preparando tu experiencia demo...</p>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="font-semibold text-blue-900">Datos de Prueba</div>
                <div className="text-blue-600 text-xs mt-1">Base de datos aislada</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="font-semibold text-green-900">100% Seguro</div>
                <div className="text-green-600 text-xs mt-1">Sin riesgos</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
