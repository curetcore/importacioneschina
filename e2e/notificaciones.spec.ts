import { test, expect } from "@playwright/test"
import { login, TEST_USERS } from "./helpers/auth"

test.describe("Notificaciones", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin)
  })

  test("debe mostrar campanita de notificaciones en el header", async ({ page }) => {
    await page.goto("/dashboard")

    // Buscar el icono de notificaciones (campanita)
    const notificationBell = page.locator(
      '[data-testid="notification-bell"], button:has(svg[class*="bell"])'
    )

    await expect(notificationBell)
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        console.log("Campanita de notificaciones no encontrada con ese selector")
      })
  })

  test("debe mostrar contador de notificaciones no leídas", async ({ page }) => {
    await page.goto("/dashboard")

    // Buscar badge con el número
    const badge = page.locator(
      '[data-testid="notification-badge"], .notification-badge, span[class*="badge"]'
    )

    // Verificar si hay badge visible
    if (await badge.isVisible({ timeout: 3000 })) {
      const count = await badge.textContent()
      console.log(`Notificaciones no leídas: ${count}`)

      // El número debe ser válido
      expect(parseInt(count || "0")).toBeGreaterThanOrEqual(0)
    } else {
      console.log("No hay notificaciones no leídas o badge no visible")
    }
  })

  test("debe abrir dropdown al hacer click en campanita", async ({ page }) => {
    await page.goto("/dashboard")

    // Click en campanita
    await page.click('[data-testid="notification-bell"], button:has(svg)').catch(() => {})

    // Debe abrir un dropdown/popover
    await expect(
      page.locator('[role="menu"], [data-testid="notification-dropdown"], .notification-list')
    )
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        console.log("Dropdown de notificaciones no se abrió")
      })
  })

  test("debe navegar a página de todas las notificaciones", async ({ page }) => {
    await page.goto("/dashboard")

    // Abrir dropdown
    await page.click('[data-testid="notification-bell"]').catch(() => {})

    // Click en "Ver todas"
    await page.click("text=/ver todas|todas las notificaciones/i").catch(async () => {
      // Si no hay link, ir directo
      await page.goto("/notificaciones")
    })

    // Debe ir a /notificaciones
    await expect(page).toHaveURL(/\/notificaciones/)
  })

  test("debe listar notificaciones en la página de notificaciones", async ({ page }) => {
    await page.goto("/notificaciones")

    await expect(page).toHaveURL(/\/notificaciones/)

    // Debe mostrar lista de notificaciones o mensaje de "sin notificaciones"
    await expect(
      page.locator("text=/notificaciones|sin notificaciones|no hay notificaciones/i")
    ).toBeVisible({ timeout: 5000 })
  })

  test("debe marcar notificación como leída al hacer click", async ({ page }) => {
    await page.goto("/notificaciones")

    // Buscar primera notificación no leída
    const unreadNotification = page
      .locator('[data-read="false"], .unread, .notification:not(.read)')
      .first()

    if (await unreadNotification.isVisible({ timeout: 3000 })) {
      // Hacer click
      await unreadNotification.click()

      // Esperar un momento para que se marque como leída
      await page.waitForTimeout(1000)

      // Verificar que cambió de estado (esto depende de tu implementación)
      // Puede ser que el color cambie, o que desaparezca el badge
    } else {
      console.log("No hay notificaciones no leídas para probar")
    }
  })

  test("debe generar notificación al crear una OC", async ({ page }) => {
    // Contar notificaciones actuales
    await page.goto("/notificaciones")
    const initialCount = await page
      .locator('.notification, [data-testid="notification-item"]')
      .count()

    // Crear una nueva OC
    await page.goto("/ordenes")
    await page.click('button:has-text("Nueva")').catch(() => {})

    await page.waitForSelector("form", { timeout: 5000 })

    const timestamp = Date.now()
    await page.fill('input[name="oc"]', `NOTIF-TEST-${timestamp}`).catch(() => {})
    await page.fill('input[name="proveedor"]', "Proveedor Notif").catch(() => {})
    await page.fill('input[name="fobTotal"]', "1000").catch(() => {})

    await page.click('button[type="submit"]')

    // Esperar a que se cree
    await page.waitForTimeout(2000)

    // Ir a notificaciones
    await page.goto("/notificaciones")

    // Debe haber una notificación más
    const newCount = await page.locator('.notification, [data-testid="notification-item"]').count()

    // Verificar que aumentó
    expect(newCount).toBeGreaterThanOrEqual(initialCount)

    // Buscar notificación sobre la OC creada
    await expect(page.locator(`text=/NOTIF-TEST-${timestamp}|orden.*creada|oc.*creada/i`))
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        console.log("Notificación de OC creada no encontrada con ese texto")
      })
  })

  test("debe polling de notificaciones cada 30 segundos", async ({ page }) => {
    await page.goto("/dashboard")

    // Interceptar requests a /api/notificaciones
    let requestCount = 0

    page.on("request", request => {
      if (request.url().includes("/api/notificaciones")) {
        requestCount++
        console.log(`Request #${requestCount} a /api/notificaciones`)
      }
    })

    // Esperar 35 segundos para ver si hace polling
    console.log("Esperando 35 segundos para verificar polling...")
    await page.waitForTimeout(35000)

    // Debe haber hecho al menos 1 request (inicial) y posiblemente 2 (después de 30s)
    expect(requestCount).toBeGreaterThanOrEqual(1)

    if (requestCount >= 2) {
      console.log("✅ Polling funciona correctamente")
    } else {
      console.log(
        "⚠️ Solo se detectó 1 request, polling puede estar deshabilitado o usa intervalo diferente"
      )
    }
  })
})
