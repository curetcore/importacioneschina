import { Page, expect } from "@playwright/test"

/**
 * Helpers para autenticación en tests E2E
 */

export interface TestUser {
  email: string
  password: string
  name: string
  role: "superadmin" | "admin" | "limitado"
}

/**
 * Usuario de prueba para E2E tests
 * IMPORTANTE: Este usuario debe existir en la BD de desarrollo
 */
export const TEST_USERS: Record<string, TestUser> = {
  admin: {
    email: "test@curetcore.com",
    password: "Test123456",
    name: "Usuario Test",
    role: "admin",
  },
  superadmin: {
    email: "info@curetshop.com",
    password: "password", // Cambiar si es diferente
    name: "Super Admin",
    role: "superadmin",
  },
}

/**
 * Hace login en la aplicación
 */
export async function login(page: Page, user: TestUser) {
  // Ir a la página de login
  await page.goto("/login")

  // Verificar que estamos en la página correcta
  await expect(page).toHaveURL(/\/login/)

  // Llenar el formulario
  await page.fill('input[type="email"]', user.email)
  await page.fill('input[type="password"]', user.password)

  // Click en el botón de login
  await page.click('button[type="submit"]')

  // Esperar a que redirija al panel (página principal después de login)
  await page.waitForURL("/panel", { timeout: 10000 })

  // Verificar que el login fue exitoso
  await expect(page).toHaveURL("/panel")
}

/**
 * Hace logout de la aplicación
 */
export async function logout(page: Page) {
  // Buscar el menú de usuario (puede ser un dropdown)
  await page.click('[data-testid="user-menu"]', { timeout: 5000 }).catch(() => {
    // Si no existe data-testid, intentar con selector alternativo
    page.click('button:has-text("Cerrar sesión")').catch(() => {
      // Último recurso: ir directo a la URL de logout
      page.goto("/api/auth/signout")
    })
  })
}

/**
 * Verifica que el usuario está autenticado
 */
export async function expectAuthenticated(page: Page) {
  // La página no debe redirigir a /login
  await expect(page).not.toHaveURL(/\/login/)

  // Debe existir algún elemento que indique que el usuario está logueado
  // Por ejemplo, el nombre del usuario en el header o menú de navegación
  await expect(page.locator("text=/panel|inicio|órdenes|dashboard/i")).toBeVisible({
    timeout: 5000,
  })
}

/**
 * Verifica que el usuario NO está autenticado
 */
export async function expectNotAuthenticated(page: Page) {
  // Debe redirigir a /login
  await expect(page).toHaveURL(/\/login/)
}
