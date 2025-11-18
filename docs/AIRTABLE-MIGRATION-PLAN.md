# 🔄 Plan de Migración - Airtable → CuretCore

## 📋 Objetivo

Migrar 11 módulos del sistema actual en Airtable a aplicaciones independientes en el monorepo CuretCore, preservando:

- ✅ **100% de los datos históricos**
- ✅ **Todas las relaciones entre tablas**
- ✅ **Imágenes y archivos adjuntos** (vouchers, fotos)
- ✅ **Configuraciones y preferencias**
- ✅ **Cálculos y fórmulas**

---

## 🎯 Estrategia General

### Principios de Migración

1. **Migración incremental** - Módulo por módulo, no todo a la vez
2. **Validación rigurosa** - Comparar datos antes y después
3. **Backup completo** - Mantener Airtable como backup durante 6 meses
4. **Migración paralela** - Usar ambos sistemas durante transición
5. **Training antes de switch** - Entrenar empleados antes de cambiar

### Fases de Migración por Módulo

```
┌─────────────────────────────────────────────────────────┐
│                    FASE DE MIGRACIÓN                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. PREPARACIÓN (1-2 días)                              │
│     ├── Export CSV de Airtable                          │
│     ├── Análisis de datos                               │
│     ├── Mapeo de campos                                 │
│     └── Identificar problemas potenciales               │
│                                                          │
│  2. DESARROLLO (1-2 semanas por módulo)                 │
│     ├── Crear schema Prisma                             │
│     ├── Desarrollar UI con Shopify style                │
│     ├── Implementar business logic                      │
│     └── Testing interno                                 │
│                                                          │
│  3. IMPORTACIÓN (1 día)                                 │
│     ├── Crear scripts de migración                      │
│     ├── Ejecutar importación                            │
│     ├── Validar datos importados                        │
│     └── Corregir errores                                │
│                                                          │
│  4. VALIDACIÓN (2-3 días)                               │
│     ├── Comparar totales                                │
│     ├── Verificar relaciones                            │
│     ├── Testing por usuarios finales                    │
│     └── Reportar discrepancias                          │
│                                                          │
│  5. CUTOVER (1 día)                                     │
│     ├── Training final                                  │
│     ├── Switch oficial                                  │
│     ├── Monitoreo intensivo                             │
│     └── Soporte on-site                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Priorización de Módulos

### Orden de Migración

| Orden | Módulo            | Razón                 | Dependencias             | Tiempo Est. |
| ----- | ----------------- | --------------------- | ------------------------ | ----------- |
| 0     | **Importaciones** | ✅ Ya existe          | Ninguna                  | -           |
| 1     | **Inventario**    | Base para facturación | Importaciones            | 2 semanas   |
| 2     | **Facturación**   | Módulo más crítico    | Inventario               | 2 semanas   |
| 3     | **Cuadres**       | Validación diaria     | Facturación              | 1.5 semanas |
| 4     | **Proveedores**   | Gestión de pagos      | Inventario               | 1.5 semanas |
| 5     | **Tesorería**     | Flujo de efectivo     | Proveedores, Facturación | 2 semanas   |
| 6     | **Gastos**        | Control de costos     | Tesorería                | 1 semana    |
| 7     | **Tarjetas**      | Gestión de crédito    | Tesorería, Gastos        | 1 semana    |
| 8     | **Nómina**        | RRHH                  | Tesorería                | 1.5 semanas |
| 9     | **Sucursales**    | Performance           | Facturación, Gastos      | 1 semana    |
| 10    | **Reportes**      | Analytics             | TODOS                    | 2 semanas   |

**Total estimado:** 16.5 semanas (~4 meses)

---

## 🗂️ Migración por Módulo

### Módulo 1: Inventario

#### 1.1 Análisis de Datos Airtable

**Archivos fuente:**

- `Recibir mercancia-➕ Recibir mercancia.csv`
- Sección "INVENTARIO" en `Actual ✅ - DETALLES.csv`

**Datos a migrar:**

```
Productos:
- Mercancía general: RD$7,480,591
- Calzadores: RD$20,000
- Fundas pequeñas: RD$3,600
- Fundas medianas: RD$88,800
- Fundas grandes: RD$0
- Insumos Karlpiel: RD$2,066,040
- Fundas de envío: RD$5,000
- Cajas almacén: RD$139,500
- Cajas Karlpiel: RD$382,500
- Diferencia piso 4: RD$242,000
- Recuperación: RD$83,500

Recepciones:
- Fecha, Proveedor, Productos, Costo, Cantidad, Monto
```

#### 1.2 Schema Prisma

```prisma
model Product {
  id              String   @id @default(cuid())
  sku             String   @unique
  name            String
  description     String?
  category        ProductCategory
  cost            Decimal
  price           Decimal
  stock           Int      @default(0)
  minStock        Int      @default(0)
  unit            String   // unidad, caja, paquete
  supplier        Supplier? @relation(fields: [supplierId], references: [id])
  supplierId      String?
  image           String?

  // Audit
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  invoiceItems    InvoiceItem[]
  receipts        MerchandiseReceipt[]
  movements       InventoryMovement[]
}

model MerchandiseReceipt {
  id              String   @id @default(cuid())
  receiptNumber   String   @unique
  date            DateTime
  supplier        Supplier @relation(fields: [supplierId], references: [id])
  supplierId      String
  items           ReceiptItem[]
  totalCost       Decimal
  notes           String?

  // Audit
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model ReceiptItem {
  id              String   @id @default(cuid())
  receipt         MerchandiseReceipt @relation(fields: [receiptId], references: [id])
  receiptId       String
  product         Product  @relation(fields: [productId], references: [id])
  productId       String
  quantity        Int
  costPerUnit     Decimal
  totalCost       Decimal
}

model InventoryMovement {
  id              String   @id @default(cuid())
  product         Product  @relation(fields: [productId], references: [id])
  productId       String
  type            MovementType // IN, OUT, ADJUSTMENT, TRANSFER
  quantity        Int
  from            Branch?  @relation("MovementFrom", fields: [fromBranchId], references: [id])
  fromBranchId    String?
  to              Branch?  @relation("MovementTo", fields: [toBranchId], references: [id])
  toBranchId      String?
  reason          String?
  reference       String?  // ID de factura, recepción, etc.
  date            DateTime
  createdBy       String
  createdAt       DateTime @default(now())
}

enum ProductCategory {
  MERCHANDISE
  BAGS_SMALL
  BAGS_MEDIUM
  BAGS_LARGE
  SUPPLIES
  SHIPPING_BAGS
  BOXES
  SHOE_HORNS
  OTHER
}

enum MovementType {
  IN          // Entrada (recepción)
  OUT         // Salida (venta)
  ADJUSTMENT  // Ajuste
  TRANSFER    // Transferencia entre sucursales
}
```

#### 1.3 Script de Migración

```typescript
// scripts/migrate-inventory.ts

import { PrismaClient } from "@prisma/client"
import { parse } from "csv-parse/sync"
import { readFileSync } from "fs"

const prisma = new PrismaClient()

async function migrateInventory() {
  console.log("🚀 Iniciando migración de Inventario...")

  // 1. Leer CSV de recepciones
  const receiptsCSV = readFileSync(
    "~/Desktop/Componentes del sstema/Recibir mercancia-➕ Recibir mercancia.csv",
    "utf-8"
  )

  const receipts = parse(receiptsCSV, {
    columns: true,
    skip_empty_lines: true,
  })

  // 2. Crear productos únicos
  const uniqueProducts = new Set()

  for (const receipt of receipts) {
    // Parsear campo "Productos" que puede tener múltiples productos
    const products = receipt.Productos.split(",")
    products.forEach(p => uniqueProducts.add(p.trim()))
  }

  console.log(`📦 Creando ${uniqueProducts.size} productos...`)

  for (const productName of uniqueProducts) {
    await prisma.product.upsert({
      where: { sku: productName },
      update: {},
      create: {
        sku: productName,
        name: productName,
        category: categorizeProduct(productName),
        cost: 0, // Se actualizará con recepciones
        price: 0, // Se configurará manualmente
        stock: 0,
        unit: "unidad",
      },
    })
  }

  // 3. Crear recepciones de mercancía
  console.log(`📥 Creando ${receipts.length} recepciones...`)

  for (const [index, receipt] of receipts.entries()) {
    // Buscar o crear proveedor
    const supplier = await prisma.supplier.upsert({
      where: { name: receipt.Proveedor },
      update: {},
      create: {
        name: receipt.Proveedor,
        initialDebt: 0,
        totalPaid: 0,
        valueReceived: 0,
        pendingBalance: 0,
      },
    })

    // Crear recepción
    const merchandiseReceipt = await prisma.merchandiseReceipt.create({
      data: {
        receiptNumber: `REC-${String(index + 1).padStart(6, "0")}`,
        date: parseDate(receipt.Fecha),
        supplierId: supplier.id,
        totalCost: parseDecimal(receipt.Monto),
        createdBy: "MIGRATION",
      },
    })

    // Crear items de recepción
    const products = receipt.Productos.split(",")
    const quantities = receipt["Cantidad recibida"].split(",")

    for (let i = 0; i < products.length; i++) {
      const product = await prisma.product.findUnique({
        where: { sku: products[i].trim() },
      })

      if (product) {
        await prisma.receiptItem.create({
          data: {
            receiptId: merchandiseReceipt.id,
            productId: product.id,
            quantity: parseInt(quantities[i]),
            costPerUnit: parseDecimal(receipt.Costo) / parseInt(quantities[i]),
            totalCost: parseDecimal(receipt.Costo),
          },
        })

        // Actualizar stock
        await prisma.product.update({
          where: { id: product.id },
          data: {
            stock: {
              increment: parseInt(quantities[i]),
            },
          },
        })

        // Crear movimiento de inventario
        await prisma.inventoryMovement.create({
          data: {
            productId: product.id,
            type: "IN",
            quantity: parseInt(quantities[i]),
            reason: "Recepción de mercancía",
            reference: merchandiseReceipt.id,
            date: parseDate(receipt.Fecha),
            createdBy: "MIGRATION",
          },
        })
      }
    }
  }

  // 4. Validación
  console.log("✅ Validando migración...")

  const totalProducts = await prisma.product.count()
  const totalReceipts = await prisma.merchandiseReceipt.count()
  const totalMovements = await prisma.inventoryMovement.count()

  console.log(`
    ✅ Migración completada:
    - Productos: ${totalProducts}
    - Recepciones: ${totalReceipts}
    - Movimientos: ${totalMovements}
  `)
}

function categorizeProduct(name: string): string {
  const lower = name.toLowerCase()

  if (lower.includes("funda pequeña")) return "BAGS_SMALL"
  if (lower.includes("funda mediana")) return "BAGS_MEDIUM"
  if (lower.includes("funda grande")) return "BAGS_LARGE"
  if (lower.includes("calzador")) return "SHOE_HORNS"
  if (lower.includes("caja")) return "BOXES"
  if (lower.includes("insumo")) return "SUPPLIES"

  return "MERCHANDISE"
}

function parseDate(dateStr: string): Date {
  // Convertir formato "1/9/2025" a Date
  const [day, month, year] = dateStr.split("/")
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

function parseDecimal(value: string): number {
  // Convertir "RD$1,234.56" a 1234.56
  return parseFloat(value.replace(/RD\$|,/g, ""))
}

migrateInventory()
  .then(() => {
    console.log("✅ Migración exitosa")
    process.exit(0)
  })
  .catch(error => {
    console.error("❌ Error en migración:", error)
    process.exit(1)
  })
```

#### 1.4 Validación Post-Migración

**Checklist de validación:**

```bash
# 1. Verificar totales
psql> SELECT
  SUM(stock * cost) as total_inventory_value
FROM products;

# Debe dar: RD$10,511,531 (valor en Airtable)

# 2. Verificar cantidad de productos
psql> SELECT category, COUNT(*) FROM products GROUP BY category;

# 3. Verificar recepciones
psql> SELECT
  COUNT(*) as total_receipts,
  SUM(total_cost) as total_received
FROM merchandise_receipts;

# 4. Verificar movimientos
psql> SELECT type, COUNT(*) FROM inventory_movements GROUP BY type;
```

---

### Módulo 2: Facturación

#### 2.1 Análisis de Datos

**Archivo fuente:** `Facturas-➕ Crear factura.csv` (283KB)

**Volumen estimado:** ~1,000+ facturas

**Campos a migrar:**

- Cliente
- Fecha
- Productos (lista separada por comas)
- Total
- Sucursal
- Vendedor
- Efectivo/Transferencia
- Tarjeta
- Costo
- Ganancia

#### 2.2 Schema Prisma

```prisma
model Invoice {
  id              String   @id @default(cuid())
  invoiceNumber   String   @unique

  // Customer info
  customerName    String
  customerEmail   String?
  customerPhone   String?

  // Branch and employee
  branch          Branch   @relation(fields: [branchId], references: [id])
  branchId        String
  salesperson     Employee @relation(fields: [salespersonId], references: [id])
  salespersonId   String

  // Items
  items           InvoiceItem[]

  // Totals
  subtotal        Decimal
  tax             Decimal  @default(0)
  totalAmount     Decimal

  // Payment breakdown
  cashAmount      Decimal  @default(0)
  cardAmount      Decimal  @default(0)

  // Costs and profit
  totalCost       Decimal
  grossProfit     Decimal
  profitMargin    Decimal

  // Status
  status          InvoiceStatus @default(PAID)

  // Dates
  invoiceDate     DateTime
  dueDate         DateTime?
  paidDate        DateTime?

  // Audit
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model InvoiceItem {
  id              String   @id @default(cuid())
  invoice         Invoice  @relation(fields: [invoiceId], references: [id])
  invoiceId       String
  product         Product  @relation(fields: [productId], references: [id])
  productId       String
  productName     String   // Snapshot del nombre
  quantity        Int
  unitPrice       Decimal
  unitCost        Decimal
  subtotal        Decimal
  profit          Decimal
}

enum InvoiceStatus {
  DRAFT
  PAID
  PARTIAL
  OVERDUE
  CANCELLED
}
```

#### 2.3 Script de Migración

```typescript
// scripts/migrate-invoices.ts

import { PrismaClient } from "@prisma/client"
import { parse } from "csv-parse/sync"
import { readFileSync } from "fs"

const prisma = new PrismaClient()

async function migrateInvoices() {
  console.log("🚀 Iniciando migración de Facturas...")

  const invoicesCSV = readFileSync(
    "~/Desktop/Componentes del sstema/Facturas-➕ Crear factura.csv",
    "utf-8"
  )

  const invoices = parse(invoicesCSV, {
    columns: true,
    skip_empty_lines: true,
  })

  console.log(`📄 Migrando ${invoices.length} facturas...`)

  let successCount = 0
  let errorCount = 0

  for (const [index, inv] of invoices.entries()) {
    try {
      // Buscar o crear sucursal
      const branch = await prisma.branch.upsert({
        where: { name: inv.Sucursal },
        update: {},
        create: {
          name: inv.Sucursal,
          type: inv.Sucursal === "Bobeda" ? "WAREHOUSE" : "STORE",
        },
      })

      // Buscar o crear vendedor
      const salesperson = await prisma.employee.upsert({
        where: { name: inv.Vendedor },
        update: {},
        create: {
          name: inv.Vendedor,
          position: "Vendedor",
          initialDebt: 0,
          totalOwed: 0,
          amountPaid: 0,
          pendingBalance: 0,
        },
      })

      // Crear factura
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-${String(index + 1).padStart(6, "0")}`,
          customerName: inv.Cliente,
          branchId: branch.id,
          salespersonId: salesperson.id,
          subtotal: parseDecimal(inv.Total),
          totalAmount: parseDecimal(inv.Total),
          cashAmount: parseDecimal(inv["Efectivo/Transferencia"] || "0"),
          cardAmount: parseDecimal(inv.Tarjeta || "0"),
          totalCost: parseDecimal(inv.Costo),
          grossProfit: parseDecimal(inv.Ganancia),
          profitMargin: (parseDecimal(inv.Ganancia) / parseDecimal(inv.Total)) * 100,
          invoiceDate: parseDate(inv.Fecha),
          paidDate: parseDate(inv.Fecha),
          status: "PAID",
          createdBy: "MIGRATION",
        },
      })

      // Crear items (simplificado - en Airtable los productos están concatenados)
      // Nota: Esto requiere parsear el campo "Productos" que puede tener formato complejo
      const products = parseProducts(inv.Productos)

      for (const productData of products) {
        const product = await prisma.product.findFirst({
          where: { name: { contains: productData.name } },
        })

        if (product) {
          await prisma.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              productId: product.id,
              productName: product.name,
              quantity: productData.quantity,
              unitPrice: productData.price,
              unitCost: product.cost,
              subtotal: productData.quantity * productData.price,
              profit: (productData.price - product.cost) * productData.quantity,
            },
          })

          // Reducir stock
          await prisma.product.update({
            where: { id: product.id },
            data: {
              stock: {
                decrement: productData.quantity,
              },
            },
          })

          // Crear movimiento de inventario
          await prisma.inventoryMovement.create({
            data: {
              productId: product.id,
              type: "OUT",
              quantity: productData.quantity,
              toBranchId: branch.id,
              reason: "Venta",
              reference: invoice.id,
              date: parseDate(inv.Fecha),
              createdBy: "MIGRATION",
            },
          })
        }
      }

      successCount++

      if (successCount % 100 === 0) {
        console.log(`✅ Migradas ${successCount} facturas...`)
      }
    } catch (error) {
      console.error(`❌ Error en factura ${index}:`, error)
      errorCount++
    }
  }

  console.log(`
    ✅ Migración completada:
    - Exitosas: ${successCount}
    - Errores: ${errorCount}
    - Total: ${invoices.length}
  `)
}

function parseProducts(
  productsStr: string
): Array<{ name: string; quantity: number; price: number }> {
  // Esta función necesita adaptarse al formato real de Airtable
  // Ejemplo: "Producto A (x2) RD$500, Producto B (x1) RD$300"

  const products = []
  // TODO: Implementar parser según formato real
  return products
}

migrateInvoices()
```

---

## 🔧 Herramientas de Migración

### Script Master de Migración

```bash
# migrate-all.sh

#!/bin/bash

echo "🚀 CuretCore - Migración completa Airtable → PostgreSQL"
echo ""

# 1. Backup de Airtable
echo "📦 Descargando backup completo de Airtable..."
node scripts/export-airtable.ts

# 2. Crear base de datos
echo "🗄️ Creando base de datos..."
npx prisma db push

# 3. Migrar módulos en orden
echo "🔄 Migrando módulos..."

echo "  1/10 Inventario..."
ts-node scripts/migrate-inventory.ts

echo "  2/10 Facturación..."
ts-node scripts/migrate-invoices.ts

echo "  3/10 Cuadres..."
ts-node scripts/migrate-cuadres.ts

echo "  4/10 Proveedores..."
ts-node scripts/migrate-suppliers.ts

echo "  5/10 Tesorería..."
ts-node scripts/migrate-treasury.ts

echo "  6/10 Gastos..."
ts-node scripts/migrate-expenses.ts

echo "  7/10 Tarjetas..."
ts-node scripts/migrate-cards.ts

echo "  8/10 Nómina..."
ts-node scripts/migrate-payroll.ts

echo "  9/10 Sucursales..."
ts-node scripts/migrate-branches.ts

echo " 10/10 Reportes..."
ts-node scripts/migrate-reports.ts

# 4. Validación
echo "✅ Validando datos..."
ts-node scripts/validate-migration.ts

echo ""
echo "🎉 Migración completada!"
```

### Script de Validación

```typescript
// scripts/validate-migration.ts

async function validateMigration() {
  const validations = [
    {
      name: "Inventario",
      airtableValue: 10511531, // RD$
      query: "SELECT SUM(stock * cost) FROM products",
    },
    {
      name: "Bancos",
      airtableValue: 1298755,
      query: "SELECT SUM(balance) FROM bank_accounts",
    },
    {
      name: "Deudas Proveedores",
      airtableValue: 2761065,
      query: "SELECT SUM(pending_balance) FROM suppliers",
    },
    {
      name: "Facturas (total)",
      airtableValue: null, // Calcular de CSV
      query: "SELECT SUM(total_amount) FROM invoices",
    },
  ]

  for (const v of validations) {
    const result = await prisma.$queryRaw(v.query)
    const diff = Math.abs(result - v.airtableValue)
    const diffPercent = (diff / v.airtableValue) * 100

    console.log(`
      ${v.name}:
      - Airtable: RD$${v.airtableValue.toLocaleString()}
      - CuretCore: RD$${result.toLocaleString()}
      - Diferencia: ${diffPercent < 1 ? "✅" : "❌"} ${diffPercent.toFixed(2)}%
    `)
  }
}
```

---

## 📸 Migración de Archivos

### Imágenes y Attachments

**Archivos a migrar:**

- Fotos de proveedores (Proveedor)
- Comprobantes de pago (Pago proveedor, Pagos tarjeta)
- Recibos de gastos (Gastos)

**Estrategia:**

```typescript
// scripts/migrate-attachments.ts

import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function migrateAttachments() {
  // 1. Obtener URLs de attachments de Airtable API
  const attachments = await getAirtableAttachments()

  // 2. Descargar y subir a Cloudinary
  for (const attachment of attachments) {
    try {
      const result = await cloudinary.uploader.upload(attachment.url, {
        folder: `curetcore/${attachment.type}`,
        public_id: attachment.id,
        resource_type: "auto",
      })

      // 3. Actualizar URL en base de datos
      await updateAttachmentUrl(attachment.recordId, result.secure_url)

      console.log(`✅ Migrado: ${attachment.filename}`)
    } catch (error) {
      console.error(`❌ Error: ${attachment.filename}`, error)
    }
  }
}
```

---

## 📅 Timeline de Migración

### Cronograma Detallado (16 semanas)

```
SEMANA 1-2: Setup Monorepo + Inventario
├── Día 1-2: Setup de Turborepo
├── Día 3-4: Crear @curetcore/ui con Shopify style
├── Día 5-7: Desarrollar módulo Inventario
├── Día 8-9: Migrar datos de inventario
└── Día 10: Validación y training

SEMANA 3-4: Facturación
├── Día 1-3: Desarrollar UI de facturación
├── Día 4-6: Business logic y cálculos
├── Día 7-8: Migración de facturas históricas
├── Día 9: Integración con Inventario
└── Día 10: Testing y cutover

SEMANA 5-6: Cuadres + Proveedores
├── Semana 5: Módulo de Cuadres
└── Semana 6: Módulo de Proveedores

SEMANA 7-8: Tesorería
├── Gestión de bancos
├── Transferencias interbancarias
├── Procesadores de pago (Pocket)
└── Migración de transacciones

SEMANA 9-10: Gastos + Tarjetas
├── Semana 9: Módulo de Gastos
└── Semana 10: Módulo de Tarjetas

SEMANA 11-12: Nómina/RRHH
├── Gestión de empleados
├── Adelantos y abonos
├── Nómina
└── Migración de datos

SEMANA 13-14: Sucursales + Reportes
├── Semana 13: Dashboard de Sucursales
└── Semana 14: Módulo de Reportes

SEMANA 15-16: Integración Final
├── Testing end-to-end
├── Performance optimization
├── Training completo
├── Documentación
└── Go-live
```

---

## ✅ Checklist Pre-Migración

### Antes de Empezar

- [ ] **Backup completo de Airtable**
  - [ ] Export de todas las bases
  - [ ] Descarga de todos los attachments
  - [ ] Documentar todas las fórmulas y automations

- [ ] **Infraestructura lista**
  - [ ] PostgreSQL database provisioned
  - [ ] Cloudinary account para imágenes
  - [ ] Vercel projects creados
  - [ ] CI/CD configurado

- [ ] **Equipo preparado**
  - [ ] Identificar usuarios clave para testing
  - [ ] Plan de training
  - [ ] Soporte técnico disponible
  - [ ] Rollback plan documentado

- [ ] **Validaciones automatizadas**
  - [ ] Scripts de validación creados
  - [ ] Comparación de totales
  - [ ] Tests end-to-end

---

## 🚨 Plan de Contingencia

### Si algo sale mal

**Escenario 1: Datos no cuadran después de migración**

- Rollback a Airtable
- Identificar discrepancia
- Corregir script de migración
- Re-ejecutar migración

**Escenario 2: Performance issues**

- Agregar índices en base de datos
- Optimizar queries
- Implementar caching
- Considerar read replicas

**Escenario 3: Usuarios no adoptan sistema nuevo**

- Training adicional
- Videos tutoriales
- Soporte one-on-one
- Incentivos para adopción

**Escenario 4: Bugs críticos en producción**

- Hotfix inmediato
- Rollback temporal a Airtable
- Fix bug
- Re-deploy

---

## 📊 Métricas de Éxito

### KPIs de Migración

| Métrica                  | Target            | Medición                          |
| ------------------------ | ----------------- | --------------------------------- |
| **Precisión de datos**   | 99.9%             | Comparación Airtable vs CuretCore |
| **Tiempo de migración**  | < 16 semanas      | Tracking de Gantt chart           |
| **Downtime**             | 0 horas           | Migración paralela                |
| **Adopción de usuarios** | 100% en 2 semanas | Usage analytics                   |
| **Bugs críticos**        | 0                 | Error tracking                    |
| **Performance**          | < 2s page load    | Vercel analytics                  |

---

**Última actualización:** 2025-11-18
**Estado:** ✅ Listo para ejecutar
