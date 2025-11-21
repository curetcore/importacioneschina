"use client"

import { Instagram } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-[#E8E9EA]">
      <div className="max-w-7xl mx-auto px-8 py-3">
        <div className="flex items-center justify-end text-xs text-gray-600">
          {/* All content aligned to the right */}
          <div className="flex items-center gap-2">
            <span>© 2026 CuretCore. Todos los derechos reservados.</span>
            <span className="text-gray-400">•</span>
            <span>
              Hecho por{" "}
              <a
                href="https://www.instagram.com/_ronaldopaulino/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-700 hover:text-primary-600 transition-colors inline-flex items-center gap-1"
              >
                Ronaldo Paulino
                <Instagram className="w-3 h-3" />
              </a>{" "}
              para{" "}
              <a
                href="https://www.instagram.com/curetcore/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-700 hover:text-primary-600 transition-colors inline-flex items-center gap-1"
              >
                CuretCore
                <Instagram className="w-3 h-3" />
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
