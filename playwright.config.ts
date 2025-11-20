import { defineConfig, devices } from "@playwright/test"

/**
 * Configuración de Playwright para Tests E2E
 * Documentación: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Directorio donde están los tests E2E
  testDir: "./e2e",

  // Timeout máximo por test (30 segundos)
  timeout: 30 * 1000,

  // Tests en paralelo (ejecutar 1 a la vez para evitar conflictos de BD)
  fullyParallel: false,
  workers: 1,

  // Reintentar tests fallidos 1 vez
  retries: process.env.CI ? 2 : 1,

  // Reporter: resultados en consola + HTML
  reporter: [["list"], ["html", { open: "never" }]],

  // Configuración compartida para todos los tests
  use: {
    // URL base de la aplicación
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",

    // Timeout para acciones (click, fill, etc.)
    actionTimeout: 10 * 1000,

    // Grabar traza solo cuando el test falla
    trace: "retain-on-failure",

    // Screenshots solo cuando falla
    screenshot: "only-on-failure",

    // Video solo cuando falla
    video: "retain-on-failure",
  },

  // Proyectos (navegadores a usar)
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Descomenta para agregar más navegadores:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Servidor de desarrollo (levanta Next.js antes de los tests)
  webServer: {
    command: "npm run test:server",
    url: "http://localhost:3000",
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      // Usar BD de tests (PostgreSQL local)
      DATABASE_URL: "postgresql://ronaldopaulino@localhost:5432/curet_test_e2e",
      DEMO_DATABASE_URL: "postgresql://ronaldopaulino@localhost:5432/curet_test_e2e",
      NODE_ENV: "test",
    },
  },
})
