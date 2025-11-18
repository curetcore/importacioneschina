# 💰 Cuadres de Caja y Consolidación de Efectivo

## 🎯 El Problema

**Si Shopify POS maneja todas las ventas:**

- ¿Cómo cuadro la caja al final del día?
- ¿Cómo sé si hay faltante o sobrante de efectivo?
- ¿Cómo deposito el efectivo en el banco?
- ¿Cómo consolido todo en mis reportes financieros?

---

## 🔄 Flujo Completo: Venta → Cuadre → Depósito

```
┌────────────────────────────────────────────────────────────┐
│  FLUJO DIARIO DE EFECTIVO                                  │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  🏪 DURANTE EL DÍA (Sucursal Piantini)                     │
│  ────────────────────────────────────────────              │
│                                                             │
│  09:00 AM - Venta #1                                       │
│     Cliente compra bolso: RD$1,500                         │
│     Pago: Efectivo                                         │
│     Shopify POS registra automáticamente                   │
│                                                             │
│  10:30 AM - Venta #2                                       │
│     Cliente compra cartera: RD$800                         │
│     Pago: Tarjeta Carnet (POS)                            │
│     Shopify POS registra automáticamente                   │
│                                                             │
│  ... (más ventas durante el día) ...                       │
│                                                             │
│  ────────────────────────────────────────────              │
│                                                             │
│  🔢 FINAL DEL DÍA - 6:00 PM (CUADRE DE CAJA)              │
│  ────────────────────────────────────────────              │
│                                                             │
│  1. VENDEDOR CUENTA EFECTIVO FÍSICO                        │
│     ├─ Billetes de 2000: 10 × RD$2,000 = RD$20,000       │
│     ├─ Billetes de 1000: 5 × RD$1,000 = RD$5,000         │
│     ├─ Billetes de 500: 8 × RD$500 = RD$4,000            │
│     ├─ Monedas: RD$250                                    │
│     └─ TOTAL EFECTIVO FÍSICO: RD$29,250                   │
│                                                             │
│  2. VENDEDOR ABRE CURETCORE (Formulario de cuadre)        │
│     Ingresa:                                               │
│     ├─ Efectivo físico: RD$29,250                         │
│     ├─ Carnet (POS): RD$8,500  ← lee de cierre POS       │
│     ├─ AZUL: RD$3,200          ← lee de cierre POS       │
│     ├─ Popular: RD$2,100       ← lee de cierre POS       │
│     └─ BHD León: RD$1,800      ← lee de cierre POS       │
│                                                             │
│  3. CURETCORE CONSULTA SHOPIFY API                         │
│     GET /admin/api/2024-01/orders.json?                   │
│         created_at_min=2025-11-18T00:00:00Z&              │
│         created_at_max=2025-11-18T23:59:59Z&              │
│         location_id=12345&                                │
│         financial_status=paid                              │
│                                                             │
│     Shopify responde:                                      │
│     ├─ Total ventas del día: RD$45,000                    │
│     ├─ Efectivo: RD$29,500  ← ESPERADO                   │
│     ├─ Carnet: RD$8,500                                   │
│     ├─ AZUL: RD$3,200                                     │
│     ├─ Popular: RD$2,100                                  │
│     └─ BHD León: RD$1,700                                 │
│                                                             │
│  4. CURETCORE COMPARA                                      │
│     ┌────────────────┬──────────┬──────────┬───────────┐  │
│     │ Método         │ Esperado │ Real     │ Diferencia│  │
│     ├────────────────┼──────────┼──────────┼───────────┤  │
│     │ Efectivo       │  29,500  │  29,250  │  -250 ⚠️  │  │
│     │ Carnet         │   8,500  │   8,500  │    0 ✅   │  │
│     │ AZUL           │   3,200  │   3,200  │    0 ✅   │  │
│     │ Popular        │   2,100  │   2,100  │    0 ✅   │  │
│     │ BHD León       │   1,700  │   1,800  │  +100 ⚠️  │  │
│     └────────────────┴──────────┴──────────┴───────────┘  │
│                                                             │
│     RESULTADO:                                             │
│     ⚠️ Faltante de efectivo: RD$250                        │
│     ⚠️ Sobrante en BHD León: RD$100                       │
│     ⚠️ Diferencia neta: -RD$150                            │
│                                                             │
│  5. VENDEDOR CONFIRMA CUADRE                               │
│     ├─ Revisa diferencias                                 │
│     ├─ Agrega nota: "Posible vuelto mal dado"            │
│     └─ Guarda cuadre en CuretCore                         │
│                                                             │
│  ────────────────────────────────────────────              │
│                                                             │
│  💵 DEPÓSITO EN BANCO - AL DÍA SIGUIENTE                   │
│  ────────────────────────────────────────────              │
│                                                             │
│  1. RESPONSABLE LLEVA EFECTIVO AL BANCO                    │
│     ├─ Efectivo a depositar: RD$29,250                    │
│     ├─ Va a Banco Popular                                 │
│     └─ Deposita en cuenta empresarial                     │
│                                                             │
│  2. BANCO DA COMPROBANTE DE DEPÓSITO                       │
│     ├─ Toma foto del comprobante                          │
│     └─ Sube a CuretCore                                   │
│                                                             │
│  3. CURETCORE REGISTRA DEPÓSITO                            │
│     ├─ Fecha: 2025-11-19                                  │
│     ├─ Banco: Popular                                     │
│     ├─ Monto: RD$29,250                                   │
│     ├─ Referencia: Cuadre del 2025-11-18                  │
│     ├─ Comprobante: [imagen]                              │
│     └─ Actualiza balance de banco: +RD$29,250             │
│                                                             │
│  4. RECONCILIACIÓN BANCARIA                                │
│     CuretCore marca:                                       │
│     ├─ Cuadre del 18/11 → Depositado ✅                   │
│     ├─ Efectivo en tránsito → 0                           │
│     └─ Balance banco actualizado                          │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 📱 Interfaz del Cuadre en CuretCore

### Formulario de Cuadre Diario

```
┌────────────────────────────────────────────────────────────┐
│  CUADRE DE CAJA - Sucursal Piantini                        │
│  Fecha: Lunes, 18 de Noviembre 2025                        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  👤 Responsable: [Anderson Almonte ▼]                      │
│                                                             │
│  ────────────────────────────────────────────              │
│                                                             │
│  💵 EFECTIVO FÍSICO                                        │
│                                                             │
│  Billetes de RD$2,000:  [10] × 2000 = RD$20,000           │
│  Billetes de RD$1,000:  [ 5] × 1000 = RD$ 5,000           │
│  Billetes de RD$ 500:   [ 8] ×  500 = RD$ 4,000           │
│  Billetes de RD$ 200:   [ 0] ×  200 = RD$    0            │
│  Billetes de RD$ 100:   [ 0] ×  100 = RD$    0            │
│  Billetes de RD$  50:   [ 0] ×   50 = RD$    0            │
│  Monedas:               [250] manual  = RD$  250           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  TOTAL EFECTIVO FÍSICO: RD$29,250                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ────────────────────────────────────────────              │
│                                                             │
│  💳 PAGOS ELECTRÓNICOS (del cierre POS)                    │
│                                                             │
│  Carnet (Pocket):       RD$ [8,500]                        │
│  AZUL:                  RD$ [3,200]                        │
│  Popular (débito):      RD$ [2,100]                        │
│  BHD León:              RD$ [1,800]                        │
│  Otras tarjetas:        RD$ [   0]                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  TOTAL ELECTRÓNICO: RD$15,600                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ────────────────────────────────────────────              │
│                                                             │
│  📊 RESUMEN DEL CUADRE                                     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │  Total Cuadrado:      RD$44,850                    │    │
│  │  Total en Shopify:    RD$45,000  ← consultado API │    │
│  │                                                     │    │
│  │  ⚠️ DIFERENCIA:       -RD$150                      │    │
│  │                                                     │    │
│  │  Desglose:                                         │    │
│  │  • Efectivo:     -RD$250 (faltante)               │    │
│  │  • BHD León:     +RD$100 (sobrante)               │    │
│  │                                                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  📝 Observaciones/Notas:                                   │
│  [Posible vuelto mal dado en efectivo. Revisar cámaras.] │
│                                                             │
│  [GUARDAR CUADRE]  [VER VENTAS DEL DÍA EN SHOPIFY]        │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 🔗 Integración con Shopify API

### Consulta de Ventas del Día

```typescript
// app/api/cuadres/calculate-expected.ts

export async function calculateExpectedCash(date: Date, branchId: string) {
  // 1. Mapear branch a Shopify location
  const locationId = SHOPIFY_LOCATION_MAP[branchId] // "12345"

  // 2. Consultar Shopify API
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const response = await fetch(
    `https://tu-tienda.myshopify.com/admin/api/2024-01/orders.json?` +
      `created_at_min=${startOfDay.toISOString()}&` +
      `created_at_max=${endOfDay.toISOString()}&` +
      `location_id=${locationId}&` +
      `financial_status=paid&` +
      `limit=250`,
    {
      headers: {
        "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN!,
      },
    }
  )

  const data = await response.json()
  const orders = data.orders

  // 3. Agrupar por método de pago
  const breakdown = {
    cash: 0,
    carnet: 0,
    azul: 0,
    popular: 0,
    bhdLeon: 0,
    otherCards: 0,
  }

  for (const order of orders) {
    const total = parseFloat(order.total_price)

    // Determinar método de pago según gateway
    const gateway = order.payment_gateway_names[0]?.toLowerCase() || ""

    if (gateway.includes("cash") || gateway.includes("efectivo")) {
      breakdown.cash += total
    } else if (gateway.includes("carnet")) {
      breakdown.carnet += total
    } else if (gateway.includes("azul")) {
      breakdown.azul += total
    } else if (gateway.includes("popular")) {
      breakdown.popular += total
    } else if (gateway.includes("bhd")) {
      breakdown.bhdLeon += total
    } else {
      breakdown.otherCards += total
    }
  }

  return {
    totalOrders: orders.length,
    totalAmount: orders.reduce((sum, o) => sum + parseFloat(o.total_price), 0),
    breakdown,
    orders, // Para detalle si se necesita
  }
}
```

---

## 💾 Schema de Base de Datos

```prisma
model CashReconciliation {
  id                  String   @id @default(cuid())
  date                DateTime
  branchId            String
  branch              Branch   @relation(fields: [branchId], references: [id])

  // Quien hizo el cuadre
  createdBy           String
  employee            Employee @relation(fields: [createdBy], references: [id])

  // Desglose REAL (lo que se contó físicamente)
  realCash            Decimal  // Efectivo físico contado
  realCarnet          Decimal  // Del cierre POS
  realAzul            Decimal
  realPopular         Decimal
  realBhdLeon         Decimal
  realOtherCards      Decimal

  // Desglose ESPERADO (según Shopify)
  expectedCash        Decimal
  expectedCarnet      Decimal
  expectedAzul        Decimal
  expectedPopular     Decimal
  expectedBhdLeon     Decimal
  expectedOtherCards  Decimal

  // Totales
  totalReal           Decimal  // Suma de todo lo real
  totalExpected       Decimal  // Suma de todo lo esperado
  difference          Decimal  // totalReal - totalExpected

  // Desglose de diferencias
  cashDifference      Decimal  // realCash - expectedCash
  carnetDifference    Decimal
  azulDifference      Decimal
  popularDifference   Decimal
  bhdLeonDifference   Decimal
  otherCardsDifference Decimal

  // Metadata de Shopify
  shopifyOrderCount   Int      // Cantidad de órdenes
  shopifyData         Json     // Respuesta completa de Shopify para auditoría

  // Estado
  status              ReconciliationStatus @default(PENDING)
  notes               String?
  reviewedBy          String?
  reviewedAt          DateTime?

  // Depósito relacionado
  depositId           String?  @unique
  deposit             BankDeposit? @relation(fields: [depositId], references: [id])

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([branchId, date]) // Un cuadre por día por sucursal
}

enum ReconciliationStatus {
  PENDING       // Creado, esperando revisión
  APPROVED      // Aprobado por supervisor
  FLAGGED       // Marcado para investigación
  DEPOSITED     // Efectivo ya depositado en banco
}

model BankDeposit {
  id                  String   @id @default(cuid())

  // Referencia al cuadre
  reconciliationId    String   @unique
  reconciliation      CashReconciliation @relation

  // Banco receptor
  bankAccountId       String
  bankAccount         BankAccount @relation(fields: [bankAccountId], references: [id])

  // Monto depositado
  amount              Decimal
  depositDate         DateTime

  // Comprobante
  voucher             String?  // URL de Cloudinary
  referenceNumber     String?  // Número de boleta del banco

  // Quien lo depositó
  depositedBy         String
  employee            Employee @relation(fields: [depositedBy], references: [id])

  // Metadata
  notes               String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

---

## 📊 Dashboard de Cuadres

### Vista de Sucursal

```
┌────────────────────────────────────────────────────────────┐
│  CUADRES - Sucursal Piantini                               │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  📅 Semana del 18 al 24 de Noviembre                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  RESUMEN SEMANAL                                     │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Total ventas:        RD$315,000                     │  │
│  │  Total depositado:    RD$180,000                     │  │
│  │  Pendiente depósito:  RD$29,250 (hoy)               │  │
│  │  Diferencias acum:    -RD$450 ⚠️                     │  │
│  │  Precisión:           99.86% ✅                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐
│  │  HISTORIAL DE CUADRES                                 │ │
│  ├─────┬──────────┬───────────┬──────────┬─────────┬─────┤ │
│  │Fecha│ Esperado │   Real    │ Diferenc │ Estado  │ Ver │ │
│  ├─────┼──────────┼───────────┼──────────┼─────────┼─────┤ │
│  │18/11│ 45,000   │  44,850   │  -150 ⚠️ │ Pending │ 👁️ │ │
│  │17/11│ 52,000   │  52,000   │    0  ✅ │Deposited│ 👁️ │ │
│  │16/11│ 48,500   │  48,350   │  -150 ⚠️ │Deposited│ 👁️ │ │
│  │15/11│ 51,200   │  51,200   │    0  ✅ │Deposited│ 👁️ │ │
│  │14/11│ 46,800   │  46,950   │  +150 ⚠️ │Deposited│ 👁️ │ │
│  └─────┴──────────┴───────────┴──────────┴─────────┴─────┘ │
│                                                             │
│  [CREAR CUADRE DE HOY]                                     │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Depósito Bancario

### Proceso Completo

```typescript
// app/api/deposits/route.ts

export async function POST(request: Request) {
  const data = await request.json()

  // Validar
  const schema = z.object({
    reconciliationId: z.string(),
    bankAccountId: z.string(),
    amount: z.number().positive(),
    depositDate: z.string().datetime(),
    voucherUrl: z.string().url().optional(),
    referenceNumber: z.string().optional(),
    depositedBy: z.string(),
    notes: z.string().optional(),
  })

  const validated = schema.parse(data)

  // Crear depósito en transaction
  const deposit = await prisma.$transaction(async tx => {
    // 1. Verificar que cuadre existe y no está depositado
    const reconciliation = await tx.cashReconciliation.findUnique({
      where: { id: validated.reconciliationId },
    })

    if (!reconciliation) {
      throw new Error("Cuadre no encontrado")
    }

    if (reconciliation.status === "DEPOSITED") {
      throw new Error("Este cuadre ya fue depositado")
    }

    // 2. Crear registro de depósito
    const deposit = await tx.bankDeposit.create({
      data: {
        reconciliationId: validated.reconciliationId,
        bankAccountId: validated.bankAccountId,
        amount: validated.amount,
        depositDate: new Date(validated.depositDate),
        voucher: validated.voucherUrl,
        referenceNumber: validated.referenceNumber,
        depositedBy: validated.depositedBy,
        notes: validated.notes,
      },
    })

    // 3. Actualizar balance del banco
    await tx.bankAccount.update({
      where: { id: validated.bankAccountId },
      data: {
        balance: {
          increment: validated.amount,
        },
      },
    })

    // 4. Crear transacción bancaria
    await tx.bankTransaction.create({
      data: {
        bankAccountId: validated.bankAccountId,
        type: "DEPOSIT",
        amount: validated.amount,
        description: `Depósito de efectivo - Cuadre ${reconciliation.date.toLocaleDateString()}`,
        reference: deposit.id,
        date: new Date(validated.depositDate),
        createdBy: validated.depositedBy,
      },
    })

    // 5. Actualizar estado del cuadre
    await tx.cashReconciliation.update({
      where: { id: validated.reconciliationId },
      data: {
        status: "DEPOSITED",
        depositId: deposit.id,
      },
    })

    return deposit
  })

  return Response.json(deposit, { status: 201 })
}
```

---

## 📈 Reportes de Tesorería

### Consolidación Diaria

```
┌────────────────────────────────────────────────────────────┐
│  REPORTE DE TESORERÍA - 18 de Noviembre 2025              │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  💰 VENTAS DEL DÍA (todas las sucursales)                 │
│                                                             │
│  ┌─────────────┬────────────┬────────────┬──────────────┐  │
│  │ Sucursal    │ Ventas     │ Efectivo   │ Electrónico  │  │
│  ├─────────────┼────────────┼────────────┼──────────────┤  │
│  │ Piantini    │  45,000    │  29,500    │   15,500     │  │
│  │ San Isidro  │  38,500    │  22,000    │   16,500     │  │
│  │ Villa Mella │  32,000    │  18,500    │   13,500     │  │
│  │ Oficina     │  28,000    │  15,000    │   13,000     │  │
│  │ Online      │  12,000    │      0     │   12,000     │  │
│  ├─────────────┼────────────┼────────────┼──────────────┤  │
│  │ TOTAL       │ 155,500    │  85,000    │   70,500     │  │
│  └─────────────┴────────────┴────────────┴──────────────┘  │
│                                                             │
│  💵 EFECTIVO A DEPOSITAR                                   │
│                                                             │
│  ├─ Piantini:      RD$29,250  (falta RD$250)  ⚠️          │
│  ├─ San Isidro:    RD$22,000  ✅                           │
│  ├─ Villa Mella:   RD$18,500  ✅                           │
│  └─ Oficina:       RD$15,000  ✅                           │
│                                                             │
│  TOTAL EFECTIVO:   RD$84,750                               │
│  DIFERENCIA:       -RD$250    ⚠️                           │
│                                                             │
│  🏦 DEPÓSITOS REALIZADOS HOY                               │
│                                                             │
│  Ninguno (pendiente para mañana)                           │
│                                                             │
│  💳 PAGOS ELECTRÓNICOS                                     │
│                                                             │
│  ├─ Carnet (Pocket):   RD$35,000  (comisión 6% = RD$2,100)│
│  ├─ AZUL:              RD$18,500  (comisión 7% = RD$1,295)│
│  ├─ Popular:           RD$10,000                           │
│  └─ BHD León:          RD$ 7,000                           │
│                                                             │
│  TOTAL ELECTRÓNICO:    RD$70,500                           │
│  COMISIONES:           -RD$3,395                           │
│  NETO A RECIBIR:       RD$67,105                           │
│                                                             │
│  📊 RESUMEN DEL DÍA                                        │
│                                                             │
│  Total ventas:         RD$155,500                          │
│  Efectivo cuadrado:    RD$ 84,750                          │
│  Electrónico neto:     RD$ 67,105                          │
│  Comisiones POS:       -RD$ 3,395                          │
│  Diferencias:          -RD$   250                          │
│                                                             │
│  INGRESO NETO:         RD$151,855  ✅                      │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 🔐 Controles y Alertas

### Sistema de Alertas Automáticas

```typescript
// Al crear cuadre, verificar diferencias y crear alertas

async function createReconciliation(data: CuadreInput) {
  const reconciliation = await prisma.$transaction(async tx => {
    // ... crear cuadre

    // Verificar diferencias y crear alertas
    if (Math.abs(reconciliation.cashDifference) > 500) {
      await tx.alert.create({
        data: {
          type: "CASH_SHORTAGE",
          severity: "HIGH",
          title: `Faltante de efectivo en ${branch.name}`,
          description: `Diferencia de RD$${reconciliation.cashDifference} en cuadre del ${date}`,
          reference: reconciliation.id,
          assignedTo: supervisorId,
        },
      })

      // Enviar notificación por Slack
      await sendSlackAlert({
        channel: "#finanzas",
        text: `⚠️ ALERTA: Faltante de RD$${Math.abs(reconciliation.cashDifference)} en ${branch.name}`,
      })
    }

    // Alerta si hay diferencias recurrentes
    const last7Days = await tx.cashReconciliation.findMany({
      where: {
        branchId: data.branchId,
        date: {
          gte: subDays(new Date(), 7),
        },
      },
    })

    const daysWithDifferences = last7Days.filter(c => Math.abs(c.difference) > 100).length

    if (daysWithDifferences >= 3) {
      await tx.alert.create({
        data: {
          type: "RECURRING_DISCREPANCY",
          severity: "CRITICAL",
          title: `Diferencias recurrentes en ${branch.name}`,
          description: `${daysWithDifferences} días con diferencias en los últimos 7 días`,
          reference: branch.id,
          assignedTo: financeManagerId,
        },
      })
    }

    return reconciliation
  })
}
```

---

## ✅ Ventajas de este Sistema

### 1. **Shopify maneja ventas, CuretCore maneja finanzas**

- ✅ Shopify POS: Sistema de ventas
- ✅ CuretCore: Cuadres, depósitos, tesorería, reportes

### 2. **Detección automática de diferencias**

- ✅ Compara Shopify vs efectivo físico
- ✅ Alertas automáticas si hay faltantes
- ✅ Tracking de diferencias recurrentes

### 3. **Trazabilidad completa**

- ✅ Cada cuadre vinculado a su depósito
- ✅ Comprobantes de depósito con foto
- ✅ Auditoría completa

### 4. **Control de efectivo**

- ✅ Sabe cuánto efectivo hay en cada sucursal
- ✅ Sabe cuánto está pendiente de depositar
- ✅ Sabe cuánto está en el banco

### 5. **Reportes consolidados**

- ✅ Ventas (de Shopify) + Gastos + Nómina = P&L completo
- ✅ Flujo de efectivo real
- ✅ Balance actualizado

---

## 🎯 Resumen

**Flujo:**

1. Shopify POS registra TODAS las ventas
2. CuretCore consulta Shopify API al hacer cuadre
3. Compara esperado vs real → detecta diferencias
4. Efectivo se deposita al banco → CuretCore registra
5. Reportes consolidados muestran situación financiera real

**CuretCore NO:**

- ❌ Crea facturas de venta (lo hace Shopify)
- ❌ Maneja inventario de ventas (lo hace Shopify)

**CuretCore SÍ:**

- ✅ Cuadres de caja diarios
- ✅ Depósitos bancarios
- ✅ Tesorería/flujo de efectivo
- ✅ Importaciones
- ✅ Proveedores
- ✅ Gastos
- ✅ Nómina
- ✅ Reportes financieros consolidados

---

**Última actualización:** 2025-11-18
**Estado:** ✅ Arquitectura completa de cuadres y tesorería
