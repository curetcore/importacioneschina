"use client"

import Link from "next/link"

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl">📦</div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Sistema de importacion
              </h1>
              <p className="text-xs text-gray-500">
                Control financiero automático
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30"
            >
              Ver Dashboard
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
