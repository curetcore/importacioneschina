"use client"

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-[#E8E9EA]">
      <div className="max-w-7xl mx-auto px-8 py-3">
        <div className="flex flex-col items-center justify-center text-xs text-gray-600 text-center">
          <span>© 2026 CuretCore. Todos los derechos reservados.</span>
          <span className="mt-1">
            Hecho por{" "}
            <a
              href="https://www.instagram.com/_ronaldopaulino/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Ronaldo Paulino
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
