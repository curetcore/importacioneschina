"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { User, ChevronDown, UserCircle, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function UserDropdown() {
  const { data: session } = useSession()
  const router = useRouter()

  if (!session?.user) return null

  // Solo mostrar el nombre (sin apellido)
  const displayName = session.user.name
  const profilePhoto = session.user.profilePhoto

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  const handleProfile = () => {
    router.push("/configuracion?tab=cuenta")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-shopify-navbar-search border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors group">
          {/* Avatar - Foto de perfil o ícono */}
          {profilePhoto ? (
            <Image
              src={profilePhoto}
              alt={displayName || "Usuario"}
              width={24}
              height={24}
              className="rounded-full object-cover border border-gray-500"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
          )}
          <span className="text-sm text-white font-medium">{displayName}</span>
          <ChevronDown
            size={14}
            className="text-gray-300 transition-transform group-data-[state=open]:rotate-180"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleProfile}>
          <UserCircle className="mr-2 h-4 w-4" />
          <span>Mi Perfil</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
