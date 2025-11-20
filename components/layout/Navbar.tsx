"use client"

import Image from "next/image"
import { useSession } from "next-auth/react"
import NotificationDropdown from "./NotificationDropdown"
import GlobalSearch from "./GlobalSearch"
import UserDropdown from "./UserDropdown"

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-shopify-navbar border-b border-shopify-navbar">
      <div className="flex items-center h-16 px-4">
        {/* Logo - Izquierda */}
        <div className="flex items-center justify-center w-60 flex-shrink-0">
          <Image
            src="/images/logotipo-importacion-grisclaro.png"
            alt="Sistema de Importación"
            width={200}
            height={50}
            className="object-contain"
            priority
          />
        </div>

        {/* Buscador - Centrado */}
        <div className="flex-1 flex justify-center px-8">
          <div className="w-full max-w-2xl">
            <GlobalSearch />
          </div>
        </div>

        {/* Notificaciones y Usuario - Derecha */}
        <div className="flex items-center gap-4 flex-shrink-0 pr-4">
          <NotificationDropdown />
          {session?.user && <UserDropdown />}
        </div>
      </div>
    </nav>
  )
}
