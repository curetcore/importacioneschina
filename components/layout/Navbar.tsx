"use client"

import Image from "next/image"
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
            <Image
              src="/logo-importacion.png"
              alt="Sistema de Importación"
              width={160}
              height={48}
              className="object-contain"
              priority
            />
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
