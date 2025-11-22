export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    // Proteger todas las páginas principales
    "/panel/:path*",
    "/ordenes/:path*",
    "/oc-china/:path*",
    "/pagos-china/:path*",
    "/gastos-logisticos/:path*",
    "/inventario-recibido/:path*",
    "/configuracion/:path*",
    "/dashboard/:path*",
    "/analisis-costos/:path*",
    "/documentos/:path*",
    "/notificaciones/:path*",
    "/productos/:path*",
    "/audit-log/:path*",
    "/ayuda/:path*",

    // Proteger TODAS las APIs EXCEPTO auth, health y uploads
    "/api/((?!auth|health|uploads).*)",
  ],
}
