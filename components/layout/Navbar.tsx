"use client"

import { Bell, User, LogOut } from "lucide-react"
import { useSession, signOut } from "next-auth/react"

export default function Navbar() {
  const { data: session } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Sistema de Importación</h1>
            <p className="text-xs text-gray-500">Control financiero automático</p>
          </div>
          <div className="flex items-center gap-4">
            {session?.user && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                <User size={16} className="text-gray-600" />
                <span className="text-sm text-gray-700">{session.user.name}</span>
              </div>
            )}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={20} className="text-gray-600" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
              title="Cerrar sesión"
            >
              <LogOut size={20} className="text-gray-600 group-hover:text-red-600" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
