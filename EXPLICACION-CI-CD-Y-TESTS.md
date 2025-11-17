# 🎓 Guía Completa: CI/CD y Expansión de Tests

## 4️⃣ Integrar en CI/CD (Integración Continua)

### ¿Qué es CI/CD en Palabras Simples?

Imagina que tienes un **asistente robot** que:
1. Revisa tu código cada vez que lo subes
2. Ejecuta TODOS los tests automáticamente
3. Te avisa si algo está mal ANTES de que llegue a producción
4. Solo permite deploy si todo está bien

**Beneficio Principal:** Nunca más desplegar código roto por accidente! 🛡️

---

### Ejemplo Visual del Flujo

```
┌─────────────────────────────────────────────────────────────┐
│ TU LAPTOP                                                   │
│                                                             │
│  1. Escribes código                                        │
│  2. Haces commit                                           │
│  3. Git push                                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ GITHUB                                                      │
│                                                             │
│  4. Recibe tu código                                       │
│  5. Activa GitHub Actions (robot)                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ SERVIDOR DE TESTS (GitHub Actions)                         │
│                                                             │
│  6. Instala dependencias                                   │
│  7. Configura base de datos de prueba                      │
│  8. Ejecuta TODOS los tests                                │
│     ┌──────────────────────────────────────┐              │
│     │ ✅ Test 1: Crear gasto - PASS        │              │
│     │ ✅ Test 2: Distribución - PASS       │              │
│     │ ✅ Test 3: Actualizar OCs - PASS     │              │
│     │ ❌ Test 4: Eliminar gasto - FAIL     │              │
│     └──────────────────────────────────────┘              │
│                                                             │
│  9. Genera reporte                                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ DECISIÓN AUTOMÁTICA                                         │
│                                                             │
│  ❌ 1 test falló                                            │
│  🚫 BLOQUEAR MERGE/DEPLOY                                   │
│  📧 Enviar notificación al desarrollador                    │
│                                                             │
│  vs.                                                        │
│                                                             │
│  ✅ Todos los tests pasaron                                 │
│  🎉 PERMITIR MERGE/DEPLOY                                   │
│  🚀 Código listo para producción                            │
└─────────────────────────────────────────────────────────────┘
```

---

### Cómo Se Ve en GitHub

Cuando haces un push, verás esto en GitHub:

```
┌────────────────────────────────────────────────────────┐
│ Pull Request #123: "feat: Gastos con múltiples OCs"   │
│                                                        │
│ Checks ⏳ Running...                                   │
│                                                        │
│ ┌────────────────────────────────────────────────┐   │
│ │ 🤖 Tests Automáticos                           │   │
│ │    ⏳ In progress (30s)                         │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ ┌────────────────────────────────────────────────┐   │
│ │ 🏗️ Build del proyecto                          │   │
│ │    ⏳ In progress (45s)                         │   │
│ └────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘

# Después de 1-2 minutos:

┌────────────────────────────────────────────────────────┐
│ Pull Request #123: "feat: Gastos con múltiples OCs"   │
│                                                        │
│ Checks ✅ All checks passed                           │
│                                                        │
│ ┌────────────────────────────────────────────────┐   │
│ │ ✅ Tests Automáticos                           │   │
│ │    14/14 tests passed (1m 23s)                 │   │
│ │    Coverage: 87.5%                              │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ ┌────────────────────────────────────────────────┐   │
│ │ ✅ Build del proyecto                          │   │
│ │    Build successful (2m 10s)                   │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ 🟢 Merge button ENABLED                               │
└────────────────────────────────────────────────────────┘
```

**Si algo falla:**

```
┌────────────────────────────────────────────────────────┐
│ Checks ❌ Some checks failed                          │
│                                                        │
│ ┌────────────────────────────────────────────────┐   │
│ │ ❌ Tests Automáticos                           │   │
│ │    13/14 tests passed (1m 23s)                 │   │
│ │    ❌ Test failed: gastos-api.test.ts          │   │
│ │                                                 │   │
│ │    Error: Expected 3 OCs, got 2                │   │
│ │    at line 45 in gastos-api.test.ts            │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ 🔴 Merge button DISABLED                              │
│ ⚠️  Fix failing tests before merging                  │
└────────────────────────────────────────────────────────┘
```

---

### Configuración que Acabamos de Crear

El archivo `.github/workflows/test.yml` que creé hace lo siguiente:

**3 Jobs en Paralelo:**

1. **Tests** 🧪
   - Configura PostgreSQL
   - Instala dependencias
   - Ejecuta tests
   - Genera reporte de cobertura

2. **Build** 🏗️
   - Verifica que el código compile
   - Detecta errores de TypeScript

3. **Lint** 🔍
   - Verifica estilo de código
   - Detecta problemas de calidad

**Se ejecuta en:**
- Cada push a `main`, `develop`, o ramas `claude/**`
- Cada Pull Request a `main` o `develop`

---

### Beneficios de CI/CD

#### ✅ **Antes de CI/CD (Manual):**
```
Desarrollador → Git push → [nada] → Deploy manual → 💥 BOOM!
                                     Usuario reporta bug
                                     "El sistema no funciona!"
```

#### ✅ **Con CI/CD (Automático):**
```
Desarrollador → Git push → 🤖 Tests automáticos → ❌ BLOCKED
                                                   "Fix this first"
                           → Arregla el bug
                           → Git push
                           → 🤖 Tests automáticos → ✅ PASS
                                                    → Deploy seguro
                                                    → 🎉 Sin bugs!
```

---

## 5️⃣ Expandir Cobertura de Tests

### ¿Qué Significa "Expandir Cobertura"?

**Cobertura** = % de tu código que está protegido por tests

```
┌─────────────────────────────────────┐
│ TU CÓDIGO                           │
│                                     │
│ 🟢 87% Cubierto por tests          │
│ ████████████████████░░░             │
│                                     │
│ 🔴 13% SIN tests (PELIGRO!)        │
│ ░░░                                 │
└─────────────────────────────────────┘
```

**Objetivo:** Cubrir el 90%+ de código crítico

---

### Funcionalidades Críticas a Testear

#### **1. Pagos China**

```typescript
// __tests__/pagos-china.test.ts

describe('Pagos China', () => {
  it('debe calcular conversión USD a RD$ correctamente', async () => {
    // Crear pago con USD
    const pago = await prisma.pagosChina.create({
      data: {
        ocId: testOC.id,
        montoOriginal: 1000, // USD
        tasaCambio: 58.50,   // 1 USD = 58.50 RD$
        moneda: 'USD',
        comisionBancoRD: 500,
      },
    })

    // Verificar cálculo
    // montoRD = montoOriginal * tasaCambio = 58,500
    // montoRDNeto = montoRD - comision = 58,000
    expect(pago.montoRD).toBe(58500)
    expect(pago.montoRDNeto).toBe(58000)
  })

  it('debe rechazar tasa de cambio negativa', async () => {
    await expect(
      prisma.pagosChina.create({
        data: {
          ocId: testOC.id,
          montoOriginal: 1000,
          tasaCambio: -10, // ❌ Negativo!
          moneda: 'USD',
        },
      })
    ).rejects.toThrow()
  })

  it('debe sumar correctamente múltiples pagos', async () => {
    // Pago 1: Anticipo 50%
    await prisma.pagosChina.create({
      data: {
        ocId: testOC.id,
        tipoPago: 'Anticipo',
        montoOriginal: 5000,
        moneda: 'USD',
        tasaCambio: 58.50,
      },
    })

    // Pago 2: Pago final 50%
    await prisma.pagosChina.create({
      data: {
        ocId: testOC.id,
        tipoPago: 'Pago final',
        montoOriginal: 5000,
        moneda: 'USD',
        tasaCambio: 58.50,
      },
    })

    // Obtener OC con pagos
    const oc = await prisma.oCChina.findUnique({
      where: { id: testOC.id },
      include: { pagosChina: true },
    })

    // Total pagado = 10,000 USD = 585,000 RD$
    const totalPagado = oc.pagosChina.reduce(
      (sum, p) => sum + p.montoRD.toNumber(),
      0
    )
    expect(totalPagado).toBe(585000)
  })
})
```

---

#### **2. Análisis de Costos**

```typescript
// __tests__/analisis-costos.test.ts

describe('Análisis de Costos', () => {
  it('debe calcular costo unitario final correctamente', async () => {
    // Setup: OC con 1 producto, 100 unidades, $10 c/u = $1000 total FOB
    const oc = await createTestOC({
      items: [{
        cantidadTotal: 100,
        precioUnitarioUSD: 10,
        pesoUnitarioKg: 2,
      }],
    })

    // Agregar pagos (conversión a RD$)
    await createTestPago({
      ocId: oc.id,
      montoOriginal: 1000, // USD
      tasaCambio: 58.50,   // = 58,500 RD$
    })

    // Agregar gastos logísticos
    await createTestGasto({
      ocIds: [oc.id],
      montoRD: 15000,      // Flete + aduana
    })

    // Calcular costo final
    const analisis = await fetch('/api/analisis-costos?ocId=' + oc.id)
    const data = await analisis.json()

    const producto = data.data[0]

    // Costo esperado:
    // FOB en RD$: 58,500 / 100 = 585 RD$ por unidad
    // Gastos: 15,000 / 100 = 150 RD$ por unidad
    // TOTAL: 735 RD$ por unidad
    expect(producto.costoUnitarioFinalRD).toBe(735)
  })

  it('debe distribuir gastos por peso correctamente', async () => {
    // Producto A: 50 unidades × 2kg = 100kg
    // Producto B: 50 unidades × 4kg = 200kg
    // Total: 300kg
    // Gasto: 30,000 RD$

    // Producto A debe recibir: 30,000 × (100/300) = 10,000 RD$
    // Producto B debe recibir: 30,000 × (200/300) = 20,000 RD$

    const analisis = await calcularAnalisisCostos(testOC.id)

    expect(analisis[0].gastosAsignados).toBe(10000) // Producto A
    expect(analisis[1].gastosAsignados).toBe(20000) // Producto B
  })
})
```

---

#### **3. Inventario Recibido**

```typescript
// __tests__/inventario-recibido.test.ts

describe('Inventario Recibido', () => {
  it('no debe recibir más de lo ordenado', async () => {
    // Orden: 100 unidades
    const item = await createTestItem({
      cantidadTotal: 100,
    })

    // Intentar recibir 150 unidades
    await expect(
      prisma.inventarioRecibido.create({
        data: {
          ocId: item.ocId,
          itemId: item.id,
          cantidadRecibida: 150, // ❌ Más de lo ordenado!
          bodegaInicial: 'Boveda',
        },
      })
    ).rejects.toThrow('Cantidad recibida excede la ordenada')
  })

  it('debe permitir recepciones parciales', async () => {
    // Orden: 100 unidades
    const item = await createTestItem({
      cantidadTotal: 100,
    })

    // Recepción 1: 50 unidades
    await createRecepcion({
      itemId: item.id,
      cantidadRecibida: 50,
    })

    // Recepción 2: 30 unidades más
    await createRecepcion({
      itemId: item.id,
      cantidadRecibida: 30,
    })

    // Total recibido: 80 unidades
    // Pendiente: 20 unidades
    const recepciones = await getRecepcionesPorItem(item.id)
    const totalRecibido = recepciones.reduce(
      (sum, r) => sum + r.cantidadRecibida,
      0
    )

    expect(totalRecibido).toBe(80)
    expect(item.cantidadTotal - totalRecibido).toBe(20) // Pendiente
  })
})
```

---

#### **4. Dashboard / KPIs**

```typescript
// __tests__/dashboard.test.ts

describe('Dashboard KPIs', () => {
  it('debe calcular total invertido correctamente', async () => {
    // Crear 3 OCs con diferentes montos
    await createTestOC({ total: 1000 })
    await createTestOC({ total: 2000 })
    await createTestOC({ total: 1500 })

    const dashboard = await fetch('/api/dashboard')
    const data = await dashboard.json()

    expect(data.totalInvertido).toBe(4500)
  })

  it('debe contar órdenes pendientes vs completadas', async () => {
    // 2 OCs pendientes (sin inventario recibido)
    await createTestOC({ id: 'OC-001' })
    await createTestOC({ id: 'OC-002' })

    // 1 OC completada (con inventario recibido al 100%)
    const oc3 = await createTestOC({ id: 'OC-003' })
    await createRecepcion({
      ocId: oc3.id,
      cantidadRecibida: oc3.cantidadOrdenada,
    })

    const dashboard = await fetch('/api/dashboard')
    const data = await dashboard.json()

    expect(data.ordenesPendientes).toBe(2)
    expect(data.ordenesCompletadas).toBe(1)
  })
})
```

---

### Plan de Expansión de Tests

#### Fase 1: Tests Críticos (Esta Semana)
- ✅ Gastos con múltiples OCs (HECHO)
- 🔄 Pagos y conversiones de moneda
- 🔄 Análisis de costos y distribución

#### Fase 2: Tests de Validación (Próxima Semana)
- 🔄 Inventario recibido
- 🔄 Dashboard y KPIs
- 🔄 Búsqueda y filtros

#### Fase 3: Tests de Integración (Mes 1)
- 🔄 Flujo completo: OC → Pagos → Gastos → Inventario
- 🔄 Exportar a Excel/PDF
- 🔄 Notificaciones

#### Fase 4: Tests End-to-End (Mes 2)
- 🔄 Simulación de usuario real
- 🔄 Tests de UI con Playwright
- 🔄 Tests de performance

---

### Métricas de Éxito

```
Objetivo de Cobertura:
┌─────────────────────────────────────┐
│ Código Crítico:        90%+ ⭐⭐⭐  │
│ APIs Públicas:         85%+ ⭐⭐    │
│ Lógica de Negocio:     80%+ ⭐      │
│ Utilidades:            70%+         │
└─────────────────────────────────────┘

Velocidad de Tests:
┌─────────────────────────────────────┐
│ Tests Unitarios:       < 10s  ⚡    │
│ Tests de API:          < 30s  ⚡    │
│ Tests Integración:     < 2m   ⏱️   │
│ Suite Completa:        < 5m   ⏱️   │
└─────────────────────────────────────┘
```

---

### Cómo Empezar a Expandir

1. **Identifica funcionalidades críticas** (las que afectan dinero)
2. **Escribe tests para casos felices** (cuando todo funciona)
3. **Escribe tests para casos edge** (errores, límites)
4. **Ejecuta tests frecuentemente**
5. **Mejora cobertura gradualmente**

---

### Comando para Ver Cobertura Actual

```bash
npm test -- --coverage

# Output:
┌─────────────────┬───────┬────────┬─────────┬─────────┐
│ File            │ % Stmts│ % Branch│ % Funcs │ % Lines │
├─────────────────┼───────┼────────┼─────────┼─────────┤
│ api/gastos/     │ 92.5  │ 87.2   │ 95.1    │ 91.8    │ ✅
│ api/pagos/      │ 45.2  │ 38.9   │ 50.0    │ 44.7    │ ⚠️
│ lib/calculations│ 67.8  │ 60.5   │ 71.2    │ 66.9    │ ⚠️
└─────────────────┴───────┴────────┴─────────┴─────────┘

🎯 Siguiente objetivo: Subir pagos/ a 85%+
```

---

## 🎯 Resumen

### CI/CD te da:
- ✅ Tests automáticos en cada push
- ✅ Bloqueo si algo falla
- ✅ Confianza para hacer cambios
- ✅ Menos bugs en producción

### Expandir Tests te da:
- ✅ Más código protegido
- ✅ Detectar bugs temprano
- ✅ Documentación viva del código
- ✅ Refactoring seguro

### Próximos Pasos:
1. Hacer commit del archivo `.github/workflows/test.yml`
2. GitHub Actions se activará automáticamente
3. Escribir tests para pagos (Fase 1)
4. Alcanzar 85% de cobertura (Objetivo)
