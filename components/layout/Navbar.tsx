"use client"

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Sistema de importacion
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Usuario</span>
        </div>
      </div>
    </nav>
  )
}
