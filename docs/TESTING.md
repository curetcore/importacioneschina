# 🧪 Guía Completa de Testing

**Sistema de Importaciones - Curet**
**Última actualización:** Noviembre 2025

---

## 📋 Tabla de Contenidos

1. [Overview](#overview)
2. [Unit Testing con Jest](#unit-testing-con-jest)
3. [E2E Testing con Playwright](#e2e-testing-con-playwright)
4. [CI/CD Integration](#cicd-integration)
5. [Manual QA Checklist](#manual-qa-checklist)
6. [Comandos Útiles](#comandos-útiles)

---

## Overview

### Estado Actual del Testing

| Tipo de Test   | Framework         | Tests     | Coverage    | Estado          |
| -------------- | ----------------- | --------- | ----------- | --------------- |
| **Unit Tests** | Jest 30.2.0       | 79 tests  | 98% crítico | ✅ Implementado |
| **E2E Tests**  | Playwright 1.56.1 | 20+ tests | N/A         | ✅ Implementado |
| **Manual QA**  | Checklist         | 40+ casos | N/A         | 📋 Documentado  |

### Módulos Testeados

#### Cálculos Financieros (47 tests)

- ✅ `calcularMontoRD` - Conversión de monedas
- ✅ `calcularMontoRDNeto` - Cálculo con comisiones
- ✅ `calcularCostoUnitarioFinal` - División con validación
- ✅ `calcularTasaCambioPromedio` - Tasa ponderada
- ✅ `distribuirGastosLogisticos` - Distribución proporcional
- ✅ Coverage: **98.29%** de statements

#### Validaciones Zod (32 tests)

- ✅ `OCChinaSchema` - Órdenes de compra
- ✅ `PagosChinaSchema` - Pagos con tasas
- ✅ `GastosLogisticosSchema` - Gastos logísticos
- ✅ `InventarioRecibidoSchema` - Recepción de inventario
- ✅ Coverage: **72.41%** de statements

---

## Unit Testing con Jest

### Configuración

**Archivos:**

- `jest.config.js` - Configuración principal
- `jest.setup.js` - Mocks globales
- `lib/__tests__/calculations.test.ts` - Tests de cálculos (47 tests)
- `lib/__tests__/validations.test.ts` - Tests de schemas (32 tests)

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Watch mode (útil durante desarrollo)
npm run test:watch

# Con coverage report
npm run test:coverage
```

### Coverage Thresholds

```javascript
coverageThreshold: {
  global: {
    statements: 70,
    branches: 60,
    functions: 70,
    lines: 70,
  }
}
```

### Ejemplo de Test de Cálculos

```typescript
it("debe calcular correctamente todos los valores de una OC", () => {
  const resultado = calcularOC({
    costoFOBTotalUSD: 1000,
    cantidadOrdenada: 100,
    pagos: [{ montoRDNeto: new Prisma.Decimal(60000) }, { montoRDNeto: new Prisma.Decimal(5000) }],
    gastos: [{ montoRD: new Prisma.Decimal(2000) }, { montoRD: new Prisma.Decimal(3000) }],
    inventario: [{ cantidadRecibida: 50 }, { cantidadRecibida: 30 }],
  })

  expect(resultado.totalPagosRD).toBe(65000)
  expect(resultado.totalGastosRD).toBe(5000)
  expect(resultado.totalInversionRD).toBe(70000)
  expect(resultado.cantidadRecibida).toBe(80)
  expect(resultado.costoUnitarioFinalRD).toBe(875) // 70000 / 80
})
```

### Ejemplo de Test de Validación

```typescript
it("debe rechazar tasa de cambio en cero", () => {
  const invalidData = {
    ocId: "oc-123",
    fechaPago: new Date("2024-01-15"),
    tipoPago: "Anticipo",
    metodoPago: "Transferencia",
    moneda: "USD",
    montoOriginal: 1000,
    tasaCambio: 0, // ❌ Inválido
  }

  const result = pagosChinaSchema.safeParse(invalidData)
  expect(result.success).toBe(false)
})
```

### Beneficios de Unit Testing

- ✅ Previene bugs financieros críticos
- ✅ Documentación viva del código
- ✅ Confianza para refactorizar
- ✅ Feedback inmediato (tests corren en ~1 segundo)

---

## E2E Testing con Playwright

### Overview

Los tests End-to-End simulan el comportamiento de un usuario real:

- Abren un navegador real (Chromium/Chrome)
- Navegan por las páginas
- Hacen click en botones
- Llenan formularios
- Verifican que todo funcione correctamente

### Documentación Completa

Para guía detallada de E2E testing:

👉 **[Ver Guía de Tests E2E](./TESTS-E2E.md)**

### Tests Implementados

#### Autenticación (`e2e/auth.spec.ts`)

- ✅ Login exitoso con credenciales válidas
- ✅ Rechazar login con credenciales inválidas
- ✅ Proteger rutas privadas
- ✅ Mantener sesión después de recargar

#### Órdenes de Compra (`e2e/ordenes.spec.ts`)

- ✅ Listar órdenes existentes
- ✅ Crear nueva OC con datos válidos
- ✅ Ver detalles de una OC
- ✅ Buscar órdenes por número

#### Gastos Logísticos (`e2e/gastos-logisticos.spec.ts`)

- ✅ Crear gasto de tipo Flete Marítimo
- ✅ Crear gasto de tipo Aduana
- ✅ Validar campos requeridos
- ✅ Validar monto positivo

#### Notificaciones (`e2e/notificaciones.spec.ts`)

- ✅ Mostrar campanita en header
- ✅ Abrir dropdown al hacer click
- ✅ Marcar como leída
- ✅ Generar notificación al crear OC

### Ejecutar Tests E2E

```bash
# Todos los tests E2E (headless)
npm run test:e2e

# Interfaz visual interactiva (RECOMENDADO)
npm run test:e2e:ui

# Con navegador visible
npm run test:e2e:headed

# Modo debug
npm run test:e2e:debug

# Ver reporte HTML
npm run test:e2e:report
```

### Pre-requisitos para E2E

1. **Aplicación corriendo:**

   ```bash
   npm run dev
   ```

2. **Usuario de prueba en BD:**
   ```bash
   npm run create-user
   # Email: test@curetcore.com
   # Password: Test123456
   # Role: admin
   ```

---

## CI/CD Integration

### ¿Qué es CI/CD?

**CI/CD** (Continuous Integration / Continuous Deployment) es un robot que:

1. Revisa tu código cada vez que lo subes
2. Ejecuta TODOS los tests automáticamente
3. Te avisa si algo está mal ANTES de que llegue a producción
4. Solo permite deploy si todo está bien

### Flujo de CI/CD

```
Developer → Git Push → GitHub Actions → Tests Automáticos
                                       ├─ Unit Tests (Jest)
                                       ├─ Build del proyecto
                                       └─ Lint del código
                                              ↓
                                    ┌─────────┴─────────┐
                                    │                   │
                              ✅ Todo OK          ❌ Algo falló
                                    │                   │
                           Deploy permitido      Deploy bloqueado
                                    │                   │
                             Producción activa    Fix requerido
```

### Configuración de GitHub Actions

**Archivo:** `.github/workflows/test.yml`

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm install
      - run: npm test
      - run: npm run build
```

### Benefits de CI/CD

- ✅ Tests automáticos en cada push
- ✅ Bloqueo si algo falla
- ✅ Confianza para hacer cambios
- ✅ Menos bugs en producción

### Expandir Cobertura de Tests

Para expandir el testing a otros módulos:

#### Fase 1: Tests Críticos

- 🔄 Pagos y conversiones de moneda
- 🔄 Análisis de costos y distribución
- 🔄 Dashboard y KPIs

#### Fase 2: Tests de Validación

- 🔄 Inventario recibido
- 🔄 Búsqueda y filtros
- 🔄 Exportar a Excel/PDF

#### Fase 3: Tests de Integración

- 🔄 Flujo completo: OC → Pagos → Gastos → Inventario
- 🔄 Notificaciones
- 🔄 Audit logs

---

## Manual QA Checklist

Para testing manual de nuevas features, ver el checklist completo:

👉 **[Ver Checklist de QA Manual](../TESTING-CHECKLIST.md)**

### Casos Críticos de Testing Manual

#### Escenario: Crear Gasto con Múltiples OCs

**Pasos:**

1. Navegar a Gastos Logísticos → Nuevo Gasto
2. Seleccionar 3 órdenes de compra diferentes
3. Llenar formulario:
   - Tipo: "Flete Marítimo"
   - Monto: RD$30,000
   - Método Pago: "Transferencia"

**Resultados Esperados:**

- [ ] El multi-select permite seleccionar múltiples OCs
- [ ] Las OCs seleccionadas aparecen como tags
- [ ] El formulario se puede enviar exitosamente
- [ ] El gasto aparece en el listado
- [ ] Cada OC recibe RD$10,000 (distribución equitativa)

#### Escenario: Distribución de Costos

**Pasos:**

1. Crear OC con 2 productos de diferente peso
2. Agregar gasto logístico
3. Ver análisis de costos

**Resultados Esperados:**

- [ ] Producto A (10kg) recibe menos costo que Producto B (20kg)
- [ ] La distribución es proporcional al peso
- [ ] Los totales suman correctamente
- [ ] El costo unitario final se calcula correctamente

---

## Comandos Útiles

### Unit Tests

```bash
npm test                    # Ejecutar todos los tests
npm run test:watch          # Watch mode (auto-reload)
npm run test:coverage       # Con coverage report
npm test -- calculations    # Solo tests de calculations
npm test -- --verbose       # Output detallado
```

### E2E Tests

```bash
npm run test:e2e           # Todos los E2E (headless)
npm run test:e2e:ui        # Interfaz visual
npm run test:e2e:headed    # Con navegador visible
npm run test:e2e:debug     # Modo debug
npm run test:e2e:report    # Ver reporte HTML

# Ejecutar test específico
npx playwright test e2e/auth.spec.ts
npx playwright test -g "debe hacer login"
```

### CI/CD

```bash
# Verificar que todo pase antes de commit
npm run build && npm test

# Simular CI localmente
npm install && npm test && npm run build
```

---

## 🎯 Métricas de Éxito

### Coverage Objetivos

```
Objetivo de Cobertura:
┌─────────────────────────────────────┐
│ Código Crítico:        90%+ ⭐⭐⭐  │
│ APIs Públicas:         85%+ ⭐⭐    │
│ Lógica de Negocio:     80%+ ⭐      │
│ Utilidades:            70%+         │
└─────────────────────────────────────┘
```

### Velocidad de Tests

```
Velocidad Esperada:
┌─────────────────────────────────────┐
│ Tests Unitarios:       < 10s  ⚡    │
│ Tests de API:          < 30s  ⚡    │
│ Tests Integración:     < 2m   ⏱️   │
│ Suite Completa:        < 5m   ⏱️   │
└─────────────────────────────────────┘
```

---

## 📚 Referencias

- **Jest Documentation:** https://jestjs.io/docs/getting-started
- **Playwright Documentation:** https://playwright.dev/docs/intro
- **Testing Library:** https://testing-library.com/docs/react-testing-library/intro
- **GitHub Actions:** https://docs.github.com/en/actions

---

## ✅ Resumen

### Lo que tenemos:

- ✅ **79 unit tests** con 98% coverage en cálculos críticos
- ✅ **20+ E2E tests** cubriendo flujos principales
- ✅ **Checklist de QA manual** para testing exploratorio
- ✅ **CI/CD listo** para integrar en GitHub Actions

### Próximos pasos:

1. Expandir coverage a módulos de pagos y análisis
2. Agregar más E2E tests para flujos complejos
3. Implementar CI/CD en GitHub Actions
4. Monitorear coverage en cada PR

---

**El sistema está protegido contra regresiones y bugs críticos. Los tests dan confianza para seguir mejorando.** ✅

**Última actualización:** Noviembre 2025
