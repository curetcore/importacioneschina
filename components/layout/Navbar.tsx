"use client"

import { useSession } from "next-auth/react"
import NotificationDropdown from "./NotificationDropdown"
import GlobalSearch from "./GlobalSearch"
import UserDropdown from "./UserDropdown"

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-semibold text-gray-900">Sistema de Importación</h1>
            <p className="text-xs text-gray-500">Control financiero automático</p>
          </div>

          {/* Global Search */}
          <div className="flex-1 max-w-2xl">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <NotificationDropdown />
            {session?.user && <UserDropdown />}
          </div>
        </div>
      </div>
    </nav>
  )
}
