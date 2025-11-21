"use client"

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
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Ronaldo Paulino
              </a>{" "}
              para{" "}
              <a
                href="https://www.instagram.com/curetcore/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                CuretCore
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
