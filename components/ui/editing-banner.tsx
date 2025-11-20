import { AlertTriangle, Users } from "lucide-react"

interface EditingBannerProps {
  editingUsers: Array<{
    userName: string
    userEmail: string
  }>
}

export function EditingBanner({ editingUsers }: EditingBannerProps) {
  if (editingUsers.length === 0) return null

  const userNames = editingUsers.map(u => u.userName || u.userEmail).join(", ")

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-700">
            <span className="font-medium">Advertencia de edición concurrente</span>
          </p>
          <p className="mt-1 text-sm text-yellow-600">
            {editingUsers.length === 1 ? (
              <>
                <strong>{userNames}</strong> está editando este registro ahora. Tus cambios podrían
                sobrescribir los suyos.
              </>
            ) : (
              <>
                <strong>{userNames}</strong> están editando este registro ahora. Coordina con ellos
                para evitar conflictos.
              </>
            )}
          </p>
        </div>
        <div className="flex-shrink-0 ml-3">
          <Users className="h-5 w-5 text-yellow-400" />
        </div>
      </div>
    </div>
  )
}
