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
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center justify-center w-60 flex-shrink-0 py-3">
          <Image
            src="/images/logo.png"
            alt="Sistema de Importación"
            width={200}
            height={50}
            className="object-contain"
            priority
          />
        </div>
        <div className="flex items-center justify-between gap-6 flex-1 px-6">
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
