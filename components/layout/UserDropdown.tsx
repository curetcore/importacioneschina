"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
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

  const fullName = [session.user.name, session.user.lastName].filter(Boolean).join(" ")

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  const handleProfile = () => {
    router.push("/configuracion?tab=cuenta")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
          <User size={16} className="text-gray-600" />
          <span className="text-sm text-gray-700 font-medium">{fullName || session.user.name}</span>
          <ChevronDown
            size={14}
            className="text-gray-400 transition-transform group-data-[state=open]:rotate-180"
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
