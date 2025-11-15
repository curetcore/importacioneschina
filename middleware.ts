export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/panel/:path*",
    "/ordenes/:path*",
    "/oc-china/:path*",
    "/pagos-china/:path*",
    "/gastos-logisticos/:path*",
    "/inventario-recibido/:path*",
    "/configuracion/:path*",
    "/dashboard/:path*",
  ],
}
