"use client"

import { Instagram } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-8 py-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          {/* Left side - Copyright */}
          <div className="flex items-center gap-2">
            <span>© 2026 CuretCore. Todos los derechos reservados.</span>
          </div>

          {/* Right side - Credits & Links */}
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">
              Hecho por{" "}
              <a
                href="https://www.instagram.com/_ronaldopaulino/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-700 hover:text-primary-600 transition-colors inline-flex items-center gap-1"
              >
                Ronaldo Paulino
                <Instagram className="w-3 h-3" />
              </a>
            </span>

            <span className="text-gray-300">•</span>

            <a
              href="https://www.instagram.com/curetcore/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gray-700 hover:text-primary-600 transition-colors inline-flex items-center gap-1"
            >
              @curetcore
              <Instagram className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
