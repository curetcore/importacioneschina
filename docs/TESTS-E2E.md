# 🧪 Tests E2E (End-to-End) con Playwright

## 📋 Índice

- [¿Qué son los Tests E2E?](#qué-son-los-tests-e2e)
- [Configuración](#configuración)
- [Ejecutar Tests](#ejecutar-tests)
- [Tests Implementados](#tests-implementados)
- [Escribir Nuevos Tests](#escribir-nuevos-tests)
- [Troubleshooting](#troubleshooting)

---

## ¿Qué son los Tests E2E?

Los **tests End-to-End** simulan el comportamiento de un usuario real en tu aplicación:

- Abren un navegador real (Chromium/Chrome)
- Navegan por las páginas
- Hacen click en botones
- Llenan formularios
- Verifican que todo funcione correctamente

**Diferencia con tests unitarios:**

- **Tests unitarios** (`npm test`): Prueban funciones individuales en aislamiento
- **Tests E2E** (`npm run test:e2e`): Prueban flujos completos de usuario

---

## Configuración

### Prerequisitos

1. **Base de datos de desarrollo** funcionando
2. **Usuario de prueba** creado en la BD:

   ```bash
   npm run create-user
   # Email: test@curetcore.com
   # Password: Test123456
   # Role: admin
   ```

3. **Aplicación corriendo en desarrollo:**
   ```bash
   npm run dev
   ```

### Instalación

Ya está instalado! Si necesitas reinstalar Playwright:

```bash
npm install -D @playwright/test
npx playwright install chromium
```

---

## Ejecutar Tests

### Comandos Disponibles

```bash
# Ejecutar todos los tests E2E (headless - sin ver navegador)
npm run test:e2e

# Abrir interfaz visual interactiva (RECOMENDADO para desarrollo)
npm run test:e2e:ui

# Ejecutar con navegador visible (ver qué está pasando)
npm run test:e2e:headed

# Modo debug (pausar en cada paso)
npm run test:e2e:debug

# Ver reporte HTML de resultados
npm run test:e2e:report
```

### Ejemplo de Uso

1. **Asegúrate que la app esté corriendo:**

   ```bash
   npm run dev
   ```

2. **En otra terminal, ejecuta los tests:**

   ```bash
   npm run test:e2e:ui
   ```

3. **Interfaz de Playwright se abrirá** - puedes:
   - Ver tests disponibles
   - Ejecutar uno o todos
   - Ver grabación de cada paso
   - Inspeccionar selectores

---

## Tests Implementados

### 1. Autenticación (`e2e/auth.spec.ts`)

✅ **Tests incluidos:**

- Mostrar página de login
- Login exitoso con credenciales válidas
- Rechazar login con credenciales inválidas
- Proteger rutas privadas sin autenticación
- Mantener sesión después de recargar
- Navegar entre páginas manteniendo sesión
- Verificar rol de usuario en la interfaz

**Ejemplo de ejecución:**

```bash
npx playwright test e2e/auth.spec.ts
```

### 2. Órdenes de Compra (`e2e/ordenes.spec.ts`)

✅ **Tests incluidos:**

- Listar órdenes existentes
- Abrir formulario de nueva OC
- Validar campos requeridos
- Crear nueva OC con datos válidos
- Ver detalles de una OC
- Buscar órdenes por número

### 3. Pagos y Gastos (`e2e/pagos.spec.ts`)

✅ **Tests incluidos:**

- Listar pagos a China
- Crear nuevo pago con validación
- Calcular tasa de cambio automáticamente
- Listar gastos logísticos
- Crear nuevo gasto logístico
- Ver tab de productos en inventario

### 4. Notificaciones (`e2e/notificaciones.spec.ts`)

✅ **Tests incluidos:**

- Mostrar campanita en header
- Mostrar contador de no leídas
- Abrir dropdown al hacer click
- Navegar a página de todas las notificaciones
- Listar notificaciones
- Marcar como leída
- Generar notificación al crear OC
- Verificar polling cada 30 segundos

### 5. Gastos Logísticos (`e2e/gastos-logisticos.spec.ts`)

✅ **Suite "Crear Gasto" - 100% PASANDO (6/6 tests):**

- Abrir modal/formulario para crear nuevo gasto
- Validar campos requeridos
- Crear gasto de tipo Flete Marítimo exitosamente
- Crear gasto de tipo Aduana
- Crear gasto de tipo Almacenaje
- Validar que el monto sea positivo

⏳ **Pendiente:**

- Suite "Editar Gasto" (2 tests)
- Suite "Eliminar Gasto" (2 tests)
- Tests de filtros y búsqueda

**Patrones implementados:**

- Interacción con componentes Radix UI (MultiSelect, Select, DatePicker)
- Manejo de dropdowns con `{ force: true }` cuando hay overlays
- Selectores específicos de formulario (`form button[type="submit"]`)
- Verificación mediante cierre de modal en lugar de strict mode violators

**Ejemplo de ejecución:**

```bash
# Suite completa de Crear Gasto
npx playwright test e2e/gastos-logisticos.spec.ts -g "Crear Gasto"

# Test específico
npx playwright test e2e/gastos-logisticos.spec.ts -g "debe crear gasto de tipo Flete Marítimo"
```

---

## Escribir Nuevos Tests

### Estructura de un Test

```typescript
import { test, expect } from "@playwright/test"
import { login, TEST_USERS } from "./helpers/auth"

test.describe("Mi Módulo", () => {
  // Login antes de cada test
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin)
  })

  test("debe hacer algo específico", async ({ page }) => {
    // 1. Navegar a la página
    await page.goto("/mi-modulo")

    // 2. Interactuar con elementos
    await page.click('button:has-text("Crear")')
    await page.fill('input[name="campo"]', "valor")

    // 3. Verificar resultados
    await expect(page.locator("text=/éxito/i")).toBeVisible()
  })
})
```

### Helpers Disponibles

**`e2e/helpers/auth.ts`:**

```typescript
// Login
await login(page, TEST_USERS.admin)

// Logout
await logout(page)

// Verificar autenticado
await expectAuthenticated(page)

// Verificar NO autenticado
await expectNotAuthenticated(page)
```

### Selectores Comunes

```typescript
// Por texto
page.click('button:has-text("Crear")')
page.locator("text=/orden.*creada/i") // Regex case-insensitive

// Por atributos
page.fill('input[name="email"]', "test@test.com")
page.fill('input[type="password"]', "password")

// Por test IDs (RECOMENDADO - agregar a tu código)
page.click('[data-testid="create-button"]')

// Esperar elemento
await page.waitForSelector("form", { timeout: 5000 })

// Verificar URL
await expect(page).toHaveURL(/\/dashboard/)
```

### Tips para Tests Estables

1. **Usa `data-testid` en tu código HTML:**

   ```tsx
   <button data-testid="create-order-button">Crear</button>
   ```

2. **Espera explícita para elementos dinámicos:**

   ```typescript
   await page.waitForSelector('[data-loaded="true"]')
   ```

3. **Usa timeouts apropiados:**

   ```typescript
   await expect(element).toBeVisible({ timeout: 10000 })
   ```

4. **Evita `waitForTimeout` - usa eventos:**

   ```typescript
   // ❌ MAL
   await page.waitForTimeout(3000)

   // ✅ BIEN
   await page.waitForSelector("text=Cargado")
   ```

---

## Troubleshooting

### Error: "Target closed"

**Causa:** El navegador se cerró antes de completar el test.

**Solución:**

```bash
# Ejecutar con navegador visible para ver qué pasa
npm run test:e2e:headed
```

### Error: "Timeout exceeded"

**Causa:** Elemento no aparece en el tiempo esperado.

**Soluciones:**

1. Verificar que la app esté corriendo (`npm run dev`)
2. Aumentar timeout en `playwright.config.ts`
3. Usar selectores más específicos

### Error: "No tests found"

**Causa:** Playwright no encuentra los archivos de test.

**Solución:**

```bash
# Verificar que exista la carpeta
ls -la e2e/

# Verificar configuración
cat playwright.config.ts
```

### Tests fallan en CI pero pasan local

**Causa:** Diferencias de ambiente (BD vacía, timeouts, etc.)

**Solución:**

1. Configurar seed de BD antes de tests en CI
2. Aumentar timeouts en modo CI
3. Usar variables de entorno para detectar CI

---

## Configuración Avanzada

### Ejecutar solo un test

```bash
# Por nombre de archivo
npx playwright test auth

# Por nombre de test
npx playwright test -g "debe hacer login"
```

### Ejecutar en múltiples navegadores

Edita `playwright.config.ts`:

```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
],
```

Luego:

```bash
npx playwright test --project=firefox
```

### Screenshots y Videos

Ya está configurado para capturar solo en fallos:

```typescript
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'retain-on-failure',
}
```

Ver resultados:

```bash
npm run test:e2e:report
```

---

## Siguiente Paso: CI/CD

Cuando estés listo para automatizar estos tests en cada deploy, consulta la documentación de CI/CD.

**Para ejecutar tests en GitHub Actions:**

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npm run test:e2e
```

---

## Recursos

- [Playwright Docs](https://playwright.dev/docs/intro)
- [Selector Cheatsheet](https://playwright.dev/docs/selectors)
- [Best Practices](https://playwright.dev/docs/best-practices)

---

**Última actualización:** 19 de Enero, 2025
**Versión de Playwright:** 1.56.1
