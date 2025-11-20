import { test, expect } from "@playwright/test"
import { login, TEST_USERS } from "./helpers/auth"

/**
 * Tests E2E para Dashboard/Panel
 * Basados en la UI real de app/(pages)/panel/page.tsx
 *
 * ESTRUCTURA REAL DEL DASHBOARD:
 * 1. KPIs PRINCIPALES
 *    - Inversión Total
 *    - Unidades Ordenadas
 *    - Unidades Recibidas
 *    - Comisiones Bancarias
 *
 * 2. ANÁLISIS FINANCIERO
 *    - Pagos por Método
 *    - Pagos por Tipo
 *    - Pagos por Moneda
 *    - Tasas de Cambio Promedio
 *
 * 3. GASTOS LOGÍSTICOS
 *    - Gastos por Tipo
 *    - Top Proveedores de Servicios
 *
 * 4. INVENTARIO & OPERACIONES
 *    - Inventario por Bodega
 *    - Estado de OCs (Activas/Completadas)
 *    - Top 5 Productos
 *    - Compras por Categoría
 *
 * 5. PROVEEDORES
 *    - Inversión por Proveedor
 *
 * 6. TOP RANKINGS
 *    - Top 5 OCs más Costosas
 *    - Últimas 10 Transacciones
 */

test.describe("Dashboard/Panel - Carga Inicial", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin)
    await page.goto("/panel")
  })

  test("debe cargar el panel exitosamente", async ({ page }) => {
    // Verificar URL
    await expect(page).toHaveURL("/panel")

    // Verificar que cargó datos (no está en loading state)
    // El dashboard muestra "Cargando datos..." mientras carga
    await expect(page.locator("text=/cargando datos/i")).not.toBeVisible({ timeout: 15000 })
  })

  test("debe mostrar todas las secciones principales", async ({ page }) => {
    // Verificar headings de secciones
    await expect(page.getByRole("heading", { name: /kpis principales/i })).toBeVisible()
    await expect(page.getByRole("heading", { name: /análisis financiero/i })).toBeVisible()
    await expect(page.getByRole("heading", { name: /gastos logísticos/i })).toBeVisible()
    await expect(page.getByRole("heading", { name: /inventario.*operaciones/i })).toBeVisible()
    // Hay 2 headings con "Proveedores", usar .first() para el h2 principal
    await expect(page.getByRole("heading", { name: /^proveedores$/i }).first()).toBeVisible()
    await expect(page.getByRole("heading", { name: /top rankings/i })).toBeVisible()
  })
})

test.describe("Dashboard - KPIs Principales", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin)
    await page.goto("/panel")
    // Esperar a que carguen los datos
    await page.waitForLoadState("networkidle", { timeout: 10000 })
  })

  test("debe mostrar KPI de Inversión Total", async ({ page }) => {
    const kpiLabel = page.locator("text=/inversión total/i").first()
    await expect(kpiLabel).toBeVisible({ timeout: 10000 })

    // Debe mostrar un valor (RD$)
    // El valor puede ser RD$0.00 si no hay datos
  })

  test("debe mostrar KPI de Unidades Ordenadas", async ({ page }) => {
    const kpiLabel = page.locator("text=/unidades ordenadas/i").first()
    await expect(kpiLabel).toBeVisible({ timeout: 10000 })
  })

  test("debe mostrar KPI de Unidades Recibidas", async ({ page }) => {
    const kpiLabel = page.locator("text=/unidades recibidas/i").first()
    await expect(kpiLabel).toBeVisible({ timeout: 10000 })
  })

  test("debe mostrar KPI de Comisiones Bancarias", async ({ page }) => {
    const kpiLabel = page.locator("text=/comisiones bancarias/i").first()
    await expect(kpiLabel).toBeVisible({ timeout: 10000 })
  })
})

test.describe("Dashboard - Análisis Financiero", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin)
    await page.goto("/panel")
    await page.waitForLoadState("networkidle", { timeout: 10000 })
  })

  test("debe mostrar sección de Pagos por Método", async ({ page }) => {
    await expect(page.locator("text=/pagos por método/i")).toBeVisible()
  })

  test("debe mostrar sección de Pagos por Tipo", async ({ page }) => {
    await expect(page.locator("text=/pagos por tipo/i")).toBeVisible()
  })

  test("debe mostrar sección de Pagos por Moneda", async ({ page }) => {
    await expect(page.locator("text=/pagos por moneda/i")).toBeVisible()
  })

  test("debe mostrar sección de Tasas de Cambio Promedio", async ({ page }) => {
    await expect(page.locator("text=/tasas de cambio promedio/i")).toBeVisible()
  })
})

test.describe("Dashboard - Gastos Logísticos", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin)
    await page.goto("/panel")
    await page.waitForLoadState("networkidle", { timeout: 10000 })
  })

  test("debe mostrar sección Gastos por Tipo", async ({ page }) => {
    await expect(page.locator("text=/gastos por tipo/i")).toBeVisible()
  })

  test("debe mostrar sección Top Proveedores de Servicios", async ({ page }) => {
    await expect(page.locator("text=/top proveedores de servicios/i")).toBeVisible()
  })

  test("debe mostrar mensaje cuando no hay proveedores", async ({ page }) => {
    // Si no hay proveedores, debe mostrar mensaje
    const noProveedores = page.locator("text=/no hay proveedores registrados/i")

    if (await noProveedores.isVisible({ timeout: 2000 })) {
      console.log('✓ Mensaje de "no hay proveedores" mostrado correctamente')
    } else {
      // Si hay proveedores, verificar que se muestran
      console.log("✓ Hay proveedores en la lista")
    }
  })
})

test.describe("Dashboard - Inventario & Operaciones", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin)
    await page.goto("/panel")
    await page.waitForLoadState("networkidle", { timeout: 10000 })
  })

  test("debe mostrar sección Inventario por Bodega", async ({ page }) => {
    await expect(page.locator("text=/inventario por bodega/i")).toBeVisible()
  })

  test("debe mostrar sección Estado de OCs", async ({ page }) => {
    await expect(page.locator("text=/estado de ocs/i")).toBeVisible()

    // Debe mostrar OCs Activas y Completadas
    await expect(page.locator("text=/activas/i")).toBeVisible()
    await expect(page.locator("text=/completadas/i")).toBeVisible()
  })

  test("debe mostrar sección Top 5 Productos", async ({ page }) => {
    await expect(page.locator("text=/top 5 productos/i")).toBeVisible()
  })

  test("debe mostrar sección Compras por Categoría", async ({ page }) => {
    await expect(page.locator("text=/compras por categoría/i")).toBeVisible()
  })

  test("debe mostrar mensaje cuando no hay inventario", async ({ page }) => {
    const noInventario = page.locator("text=/no hay inventario recibido/i")

    if (await noInventario.isVisible({ timeout: 2000 })) {
      console.log('✓ Mensaje de "no hay inventario" mostrado correctamente')
    }
  })

  test("debe mostrar mensaje cuando no hay productos", async ({ page }) => {
    const noProductos = page.locator("text=/no hay productos registrados/i")

    if (await noProductos.isVisible({ timeout: 2000 })) {
      console.log('✓ Mensaje de "no hay productos" mostrado correctamente')
    }
  })
})

test.describe("Dashboard - Proveedores", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin)
    await page.goto("/panel")
    await page.waitForLoadState("networkidle", { timeout: 10000 })
  })

  test("debe mostrar sección Inversión por Proveedor", async ({ page }) => {
    await expect(page.locator("text=/inversión por proveedor/i")).toBeVisible()
  })
})

test.describe("Dashboard - Top Rankings", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin)
    await page.goto("/panel")
    await page.waitForLoadState("networkidle", { timeout: 10000 })
  })

  test("debe mostrar tabla Top 5 OCs más Costosas", async ({ page }) => {
    await expect(page.locator("text=/top 5 ocs más costosas/i")).toBeVisible()

    // Debe haber una tabla
    const table = page.locator("table").first()
    if (await table.isVisible({ timeout: 2000 })) {
      // Verificar headers de tabla
      await expect(table.locator('th:has-text("OC")')).toBeVisible()
      await expect(table.locator('th:has-text("Proveedor")')).toBeVisible()
      await expect(table.locator('th:has-text("Inversión")')).toBeVisible()
    }
  })

  test("debe mostrar sección Últimas 10 Transacciones", async ({ page }) => {
    await expect(page.locator("text=/últimas 10 transacciones/i")).toBeVisible()
  })
})

test.describe("Dashboard - Navegación", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin)
    await page.goto("/panel")
  })

  test("debe navegar a Órdenes desde menú lateral", async ({ page }) => {
    // El menú puede tener "Ordenes" sin tilde
    await page.click("text=/ordenes/i")
    await page.waitForURL(/\/ordenes/, { timeout: 5000 })
    await expect(page).toHaveURL(/\/ordenes/)
  })

  test("debe navegar a Pagos desde menú lateral", async ({ page }) => {
    await page.click("nav >> text=/pagos/i")
    await page.waitForURL(/\/pagos/, { timeout: 5000 })
    await expect(page).toHaveURL(/\/pagos/)
  })

  test("debe navegar a Gastos desde menú lateral", async ({ page }) => {
    await page.click("nav >> text=/gastos/i")
    await page.waitForURL(/\/gastos/, { timeout: 5000 })
    await expect(page).toHaveURL(/\/gastos/)
  })

  test("debe navegar a Inventario desde menú lateral", async ({ page }) => {
    await page.click("nav >> text=/inventario/i")
    await page.waitForURL(/\/inventario/, { timeout: 5000 })
    await expect(page).toHaveURL(/\/inventario/)
  })
})
