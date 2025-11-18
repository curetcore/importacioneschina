# 🔗 Arquitectura de Integración de Datos - CuretCore

## 🎯 Objetivo: 0 Errores, 100% Integridad

**Pregunta clave:** ¿Cómo vincular 11 módulos con la misma precisión de Airtable?

**Respuesta:** **PostgreSQL + Prisma ORM** con Foreign Keys, Constraints y Transactions.

---

## 📊 Todos los Módulos y sus Vínculos

### Mapa Completo de Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                        CURETCORE ECOSYSTEM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. IMPORTACIONES (ya existe)                                   │
│     └─→ Inventario (mercancía importada)                        │
│     └─→ Proveedores (proveedores internacionales)               │
│     └─→ Gastos (costos de importación)                          │
│                                                                  │
│  2. INVENTARIO (productos y stock)                              │
│     ├─→ Facturación (venta de productos)                        │
│     ├─→ Importaciones (recepción de importados)                 │
│     └─→ Proveedores (recepción de compras locales)              │
│                                                                  │
│  3. FACTURACIÓN (ventas diarias)                                │
│     ├─→ Inventario (reduce stock)                               │
│     ├─→ Cuadres (total del día)                                 │
│     ├─→ Sucursales (ventas por sucursal)                        │
│     ├─→ Bancos (deposita cobros)                                │
│     └─→ Empleados (vendedor asignado)                           │
│                                                                  │
│  4. CUADRES (reconciliación diaria)                             │
│     ├─→ Facturación (total facturado)                           │
│     ├─→ Bancos (depósitos)                                      │
│     ├─→ Sucursales (cuadre por sucursal)                        │
│     └─→ Pocket (cobros POS)                                     │
│                                                                  │
│  5. PROVEEDORES (suppliers)                                     │
│     ├─→ Inventario (mercancía recibida)                         │
│     ├─→ Importaciones (proveedores internacionales)             │
│     ├─→ Bancos (pagos a proveedores)                            │
│     └─→ Gastos (compras como gasto)                             │
│                                                                  │
│  6. TESORERÍA/BANCOS (cuentas bancarias)                        │
│     ├─→ Facturación (cobros)                                    │
│     ├─→ Proveedores (pagos)                                     │
│     ├─→ Gastos (pagos de gastos)                                │
│     ├─→ Tarjetas (pagos de tarjetas)                            │
│     ├─→ Nómina (pagos de sueldos)                               │
│     ├─→ Cuadres (depósitos diarios)                             │
│     └─→ Pocket (transferencias de procesadores)                 │
│                                                                  │
│  7. POCKET (procesadores de pago POS)                           │
│     └─→ Bancos (transferencias)                                 │
│                                                                  │
│  8. TARJETAS (tarjetas de crédito empresariales)                │
│     ├─→ Gastos (gastos con tarjeta)                             │
│     └─→ Bancos (pagos de tarjetas)                              │
│                                                                  │
│  9. GASTOS (expenses)                                           │
│     ├─→ Bancos (pago de gastos)                                 │
│     ├─→ Tarjetas (gastos con tarjeta)                           │
│     ├─→ Sucursales (gastos por sucursal)                        │
│     ├─→ Nómina (sueldos como gasto)                             │
│     └─→ Departamentos (categorización)                          │
│                                                                  │
│  10. NÓMINA/RRHH (empleados y sueldos)                          │
│      ├─→ Empleados (adelantos/deudas)                           │
│      ├─→ Bancos (pagos)                                         │
│      ├─→ Gastos (nómina como gasto)                             │
│      └─→ Facturación (empleados como vendedores)                │
│                                                                  │
│  11. SUCURSALES (branches)                                      │
│      ├─→ Facturación (ventas por sucursal)                      │
│      ├─→ Gastos (gastos por sucursal)                           │
│      ├─→ Cuadres (cuadres por sucursal)                         │
│      └─→ Inventario (stock por sucursal)                        │
│                                                                  │
│  12. REPORTES/CONTABILIDAD (consolidación)                      │
│      └─→ TODOS (lee de todos los módulos)                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tecnología: PostgreSQL + Prisma ORM

### ¿Por qué esta combinación?

**PostgreSQL:**

- ✅ Foreign Keys automáticas (integridad referencial)
- ✅ Constraints (validaciones a nivel DB)
- ✅ Transactions (operaciones atómicas)
- ✅ Triggers (acciones automáticas)
- ✅ ACID compliance (Atomicity, Consistency, Isolation, Durability)

**Prisma ORM:**

- ✅ Type-safe (errores de tipos en compile-time)
- ✅ Migrations automáticas
- ✅ Relations declarativas
- ✅ Cascading deletes/updates configurables
- ✅ Validations en schema

**Resultado:** **Imposible tener datos inconsistentes** = 0 errores como Airtable

---

## 🔐 Garantías de Integridad

### 1. Foreign Keys (Relaciones Forzadas)

**Problema que resuelve:** No puedes crear una factura con un producto que no existe.

```prisma
model Invoice {
  id          String   @id @default(cuid())
  customerId  String

  // FOREIGN KEY: Esta factura DEBE tener un customer válido
  customer    Customer @relation(fields: [customerId], references: [id])

  branchId    String
  // FOREIGN KEY: Esta factura DEBE tener una sucursal válida
  branch      Branch   @relation(fields: [branchId], references: [id])
}

model InvoiceItem {
  id          String   @id @default(cuid())
  invoiceId   String
  productId   String

  // FOREIGN KEY: Este item DEBE tener una factura válida
  invoice     Invoice  @relation(fields: [invoiceId], references: [id])

  // FOREIGN KEY: Este item DEBE tener un producto válido
  product     Product  @relation(fields: [productId], references: [id])
}
```

**Garantía:** Si intentas crear un InvoiceItem con `productId = "xyz123"` y ese producto no existe → PostgreSQL **rechaza la operación** automáticamente.

---

### 2. Cascading (Acciones en Cadena)

**Problema que resuelve:** Si borras un proveedor, ¿qué pasa con sus pagos?

```prisma
model Supplier {
  id       String   @id @default(cuid())
  name     String   @unique
  payments SupplierPayment[]
}

model SupplierPayment {
  id         String   @id @default(cuid())
  supplierId String

  // Si borro el proveedor, ¿qué hacer con sus pagos?
  supplier   Supplier @relation(
    fields: [supplierId],
    references: [id],
    onDelete: Restrict  // ← NO puedes borrar proveedor si tiene pagos
  )
}
```

**Opciones de Cascade:**

1. **`Restrict`** - No permite borrar si hay registros relacionados
   - Ejemplo: No puedes borrar un proveedor que tiene pagos

2. **`Cascade`** - Borra todo en cadena
   - Ejemplo: Si borras una factura, borra todos sus items automáticamente

3. **`SetNull`** - Pone NULL en registros relacionados
   - Ejemplo: Si borras un vendedor, las facturas quedan sin vendedor asignado

4. **`NoAction`** - Deja que la app maneje
   - Raramente usado

**En CuretCore usaremos:**

```prisma
// Factura → Items: Si borro factura, borrar items
model Invoice {
  items InvoiceItem[]
}

model InvoiceItem {
  invoice Invoice @relation(
    fields: [invoiceId],
    references: [id],
    onDelete: Cascade  // ← Borra items si borro factura
  )
}

// Proveedor → Pagos: NO permitir borrar si tiene pagos
model SupplierPayment {
  supplier Supplier @relation(
    fields: [supplierId],
    references: [id],
    onDelete: Restrict  // ← Protección
  )
}

// Producto → Factura Items: NO permitir borrar productos vendidos
model InvoiceItem {
  product Product @relation(
    fields: [productId],
    references: [id],
    onDelete: Restrict  // ← No borrar productos vendidos
  )
}
```

---

### 3. Transactions (Operaciones Atómicas)

**Problema que resuelve:** Al crear una factura necesitas: crear factura + crear items + reducir stock. Si falla UNA operación, se deshace TODO.

```typescript
// ❌ MAL - Sin transaction
async function createInvoice(data) {
  // 1. Crear factura
  const invoice = await prisma.invoice.create({ data: invoiceData })

  // 2. Crear items
  for (const item of items) {
    await prisma.invoiceItem.create({ data: item })
  }

  // 3. Reducir stock
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    })
  }

  // ⚠️ Si falla paso 3, tenemos factura + items pero stock NO reducido = INCONSISTENCIA
}

// ✅ BIEN - Con transaction
async function createInvoice(data) {
  return await prisma.$transaction(async tx => {
    // 1. Crear factura
    const invoice = await tx.invoice.create({ data: invoiceData })

    // 2. Crear items
    for (const item of items) {
      await tx.invoiceItem.create({
        data: { ...item, invoiceId: invoice.id },
      })
    }

    // 3. Reducir stock
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    }

    return invoice
  })

  // ✅ Si CUALQUIER operación falla, TODO se deshace automáticamente
  // ✅ O TODO funciona, o NADA funciona = 0 inconsistencias
}
```

**Garantía:** TODAS las operaciones se completan o NINGUNA. No hay estados intermedios.

---

### 4. Unique Constraints (Datos únicos)

**Problema que resuelve:** No puedes tener 2 proveedores con el mismo RNC.

```prisma
model Supplier {
  id   String @id @default(cuid())
  name String @unique  // ← No duplicados
  rnc  String @unique  // ← No duplicados
}

model Product {
  id  String @id @default(cuid())
  sku String @unique  // ← No 2 productos con mismo SKU
}

model Invoice {
  id            String @id @default(cuid())
  invoiceNumber String @unique  // ← No 2 facturas con mismo número
}
```

**Garantía:** PostgreSQL **rechaza** automáticamente cualquier intento de duplicar estos valores.

---

### 5. Check Constraints (Validaciones lógicas)

**Problema que resuelve:** No puedes tener stock negativo, o precios negativos.

```prisma
model Product {
  id    String  @id @default(cuid())
  stock Int     @default(0)  // No puede ser negativo
  price Decimal              // No puede ser negativo
  cost  Decimal              // No puede ser negativo

  @@check(stock >= 0, name: "stock_non_negative")
  @@check(price >= 0, name: "price_non_negative")
  @@check(cost >= 0, name: "cost_non_negative")
  @@check(price >= cost, name: "price_above_cost")  // Precio debe ser mayor que costo
}

model BankAccount {
  id      String  @id @default(cuid())
  balance Decimal

  @@check(balance >= 0, name: "balance_non_negative")  // No sobregiros
}
```

**Garantía:** PostgreSQL valida estas reglas ANTES de guardar. Si violan constraint → rechaza.

---

## 🔗 Ejemplos Concretos de Vínculos

### Ejemplo 1: Crear Factura (7 tablas vinculadas)

```typescript
async function createInvoice(data: CreateInvoiceInput) {
  return await prisma.$transaction(async tx => {
    // 1. Verificar que sucursal existe
    const branch = await tx.branch.findUnique({
      where: { id: data.branchId },
    })
    if (!branch) throw new Error("Sucursal no existe")

    // 2. Verificar que vendedor existe
    const salesperson = await tx.employee.findUnique({
      where: { id: data.salespersonId },
    })
    if (!salesperson) throw new Error("Vendedor no existe")

    // 3. Verificar que productos existen y hay stock
    for (const item of data.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        throw new Error(`Producto ${item.productId} no existe`)
      }

      if (product.stock < item.quantity) {
        throw new Error(
          `Stock insuficiente de ${product.name}. Disponible: ${product.stock}, solicitado: ${item.quantity}`
        )
      }
    }

    // 4. Crear factura
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber: await generateInvoiceNumber(tx),
        customerName: data.customerName,
        branchId: data.branchId,
        salespersonId: data.salespersonId,
        invoiceDate: new Date(),
        status: "PAID",
        createdBy: data.userId,
      },
    })

    let totalAmount = 0
    let totalCost = 0

    // 5. Crear items y reducir stock
    for (const item of data.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      })!

      const subtotal = item.quantity * product.price
      const itemCost = item.quantity * product.cost

      // Crear item
      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          unitCost: product.cost,
          subtotal,
          profit: subtotal - itemCost,
        },
      })

      // Reducir stock
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      })

      // Crear movimiento de inventario
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          type: "OUT",
          quantity: item.quantity,
          toBranchId: data.branchId,
          reason: "Venta",
          reference: invoice.id,
          date: new Date(),
          createdBy: data.userId,
        },
      })

      totalAmount += subtotal
      totalCost += itemCost
    }

    // 6. Actualizar totales de factura
    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        subtotal: totalAmount,
        totalAmount,
        cashAmount: data.cashAmount,
        cardAmount: data.cardAmount,
        totalCost,
        grossProfit: totalAmount - totalCost,
        profitMargin: ((totalAmount - totalCost) / totalAmount) * 100,
      },
    })

    // 7. Registrar en banco (si es efectivo/transferencia)
    if (data.cashAmount > 0) {
      await tx.bankTransaction.create({
        data: {
          bankAccountId: data.cashBankId,
          type: "DEPOSIT",
          amount: data.cashAmount,
          description: `Venta factura ${invoice.invoiceNumber}`,
          reference: invoice.id,
          date: new Date(),
          createdBy: data.userId,
        },
      })

      // Actualizar balance de banco
      await tx.bankAccount.update({
        where: { id: data.cashBankId },
        data: {
          balance: {
            increment: data.cashAmount,
          },
        },
      })
    }

    return updatedInvoice
  })
}
```

**Resultado:**

- ✅ Si TODO funciona → Factura creada + Stock reducido + Movimientos registrados + Banco actualizado
- ❌ Si ALGO falla → TODO se deshace, base de datos queda como estaba

**Tablas afectadas:**

1. `Invoice` (factura)
2. `InvoiceItem` (items de factura)
3. `Product` (stock reducido)
4. `InventoryMovement` (movimiento de salida)
5. `BankAccount` (balance incrementado)
6. `BankTransaction` (transacción registrada)
7. `Branch` (verificada)
8. `Employee` (verificado)

**Garantías:**

- No puedes crear factura con sucursal inexistente (FK)
- No puedes crear factura con vendedor inexistente (FK)
- No puedes vender producto inexistente (FK)
- No puedes vender más de lo que hay en stock (validation)
- Stock nunca queda negativo (check constraint)
- Si falla actualización de banco, factura NO se crea (transaction)

---

### Ejemplo 2: Pagar a Proveedor (4 tablas vinculadas)

```typescript
async function paySupplier(data: PaySupplierInput) {
  return await prisma.$transaction(async tx => {
    // 1. Verificar proveedor existe
    const supplier = await tx.supplier.findUnique({
      where: { id: data.supplierId },
    })
    if (!supplier) throw new Error("Proveedor no existe")

    // 2. Verificar banco tiene fondos
    const bank = await tx.bankAccount.findUnique({
      where: { id: data.bankAccountId },
    })
    if (!bank) throw new Error("Banco no existe")
    if (bank.balance < data.amount) {
      throw new Error(
        `Fondos insuficientes. Disponible: ${bank.balance}, requerido: ${data.amount}`
      )
    }

    // 3. Crear registro de pago
    const payment = await tx.supplierPayment.create({
      data: {
        supplierId: data.supplierId,
        bankAccountId: data.bankAccountId,
        amount: data.amount,
        voucher: data.voucherUrl, // URL de Cloudinary
        invoice: data.invoiceReference,
        date: new Date(),
        createdBy: data.userId,
      },
    })

    // 4. Actualizar balance de proveedor
    await tx.supplier.update({
      where: { id: data.supplierId },
      data: {
        totalPaid: {
          increment: data.amount,
        },
        pendingBalance: {
          decrement: data.amount,
        },
      },
    })

    // 5. Crear transacción bancaria
    await tx.bankTransaction.create({
      data: {
        bankAccountId: data.bankAccountId,
        type: "WITHDRAWAL",
        amount: data.amount,
        description: `Pago a proveedor ${supplier.name}`,
        reference: payment.id,
        date: new Date(),
        createdBy: data.userId,
      },
    })

    // 6. Actualizar balance de banco
    await tx.bankAccount.update({
      where: { id: data.bankAccountId },
      data: {
        balance: {
          decrement: data.amount,
        },
      },
    })

    return payment
  })
}
```

**Tablas afectadas:**

1. `Supplier` (balance actualizado)
2. `SupplierPayment` (pago registrado)
3. `BankAccount` (balance reducido)
4. `BankTransaction` (transacción registrada)

**Garantías:**

- No puedes pagar a proveedor inexistente (FK)
- No puedes pagar con banco inexistente (FK)
- No puedes pagar más de lo que hay en banco (validation)
- Balance de banco nunca negativo (check constraint)
- Si falla actualización de proveedor, banco NO se afecta (transaction)

---

### Ejemplo 3: Cuadre Diario (5 tablas vinculadas)

```typescript
async function createCashReconciliation(data: CuadreInput) {
  return await prisma.$transaction(async tx => {
    // 1. Verificar sucursal
    const branch = await tx.branch.findUnique({
      where: { id: data.branchId },
    })
    if (!branch) throw new Error("Sucursal no existe")

    // 2. Calcular total facturado del día en esa sucursal
    const invoices = await tx.invoice.findMany({
      where: {
        branchId: data.branchId,
        invoiceDate: {
          gte: startOfDay(data.date),
          lte: endOfDay(data.date),
        },
      },
    })

    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const merchandiseCount = invoices.length

    // 3. Calcular total cuadrado
    const totalReconciled =
      data.cash +
      data.pocket +
      data.azul +
      data.popular +
      data.banreservas +
      data.bhdLeon +
      data.otherCards

    // 4. Calcular diferencia
    const difference = totalReconciled - totalInvoiced

    // 5. Crear cuadre
    const cuadre = await tx.cashReconciliation.create({
      data: {
        date: data.date,
        branchId: data.branchId,
        cash: data.cash,
        pocket: data.pocket,
        azul: data.azul,
        popular: data.popular,
        banreservas: data.banreservas,
        bhdLeon: data.bhdLeon,
        otherCards: data.otherCards,
        totalReconciled,
        totalInvoiced,
        merchandiseCount,
        difference,
        createdBy: data.userId,
      },
    })

    // 6. Si hay diferencia > umbral, crear alerta
    if (Math.abs(difference) > 500) {
      // RD$500 de tolerancia
      await tx.alert.create({
        data: {
          type: "CASH_DISCREPANCY",
          severity: "HIGH",
          title: `Diferencia en cuadre de ${branch.name}`,
          description: `Diferencia de RD$${difference} en cuadre del ${data.date}`,
          reference: cuadre.id,
          createdAt: new Date(),
        },
      })
    }

    // 7. Actualizar performance de sucursal
    await tx.branch.update({
      where: { id: data.branchId },
      data: {
        lastReconciliation: data.date,
        lastSalesTotal: totalInvoiced,
      },
    })

    return cuadre
  })
}
```

**Tablas afectadas:**

1. `CashReconciliation` (cuadre creado)
2. `Invoice` (suma de ventas del día)
3. `Branch` (última reconciliación)
4. `Alert` (si hay diferencia)

**Garantías:**

- Cálculo automático de diferencias (no manual)
- Alerta automática si hay discrepancias
- Vinculado a facturas reales del día
- No puedes crear cuadre para sucursal inexistente (FK)

---

## 📐 Schema Prisma Completo con Todas las Relaciones

```prisma
// ============================================
// MÓDULO: SUCURSALES (Branch Management)
// ============================================

model Branch {
  id                  String   @id @default(cuid())
  name                String   @unique
  type                BranchType
  address             String?
  phone               String?

  // Performance tracking
  lastReconciliation  DateTime?
  lastSalesTotal      Decimal?

  // Relations
  invoices            Invoice[]
  expenses            Expense[]
  cashReconciliations CashReconciliation[]
  inventoryFrom       InventoryMovement[] @relation("MovementFrom")
  inventoryTo         InventoryMovement[] @relation("MovementTo")

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

enum BranchType {
  STORE
  WAREHOUSE
  OFFICE
}

// ============================================
// MÓDULO: EMPLEADOS/RRHH (Employees/HR)
// ============================================

model Employee {
  id              String   @id @default(cuid())
  name            String   @unique
  email           String?  @unique
  phone           String?
  position        String

  // Debt tracking
  initialDebt     Decimal  @default(0)
  totalOwed       Decimal  @default(0)
  amountPaid      Decimal  @default(0)
  pendingBalance  Decimal  @default(0)

  // Relations
  advances        EmployeeAdvance[]
  payments        EmployeePayment[]
  invoices        Invoice[]  // Como vendedor

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@check(pendingBalance >= 0)
}

model EmployeeAdvance {
  id          String   @id @default(cuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id], onDelete: Restrict)
  amount      Decimal
  reason      String?
  date        DateTime
  createdBy   String
  createdAt   DateTime @default(now())

  @@check(amount > 0)
}

model EmployeePayment {
  id          String   @id @default(cuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id], onDelete: Restrict)
  amount      Decimal
  date        DateTime
  createdBy   String
  createdAt   DateTime @default(now())

  @@check(amount > 0)
}

// ============================================
// MÓDULO: PRODUCTOS/INVENTARIO (Inventory)
// ============================================

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
  unit            String
  supplierId      String?
  supplier        Supplier? @relation(fields: [supplierId], references: [id], onDelete: SetNull)
  image           String?

  // Relations
  invoiceItems    InvoiceItem[]
  receipts        MerchandiseReceiptItem[]
  movements       InventoryMovement[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@check(stock >= 0, name: "stock_non_negative")
  @@check(price >= 0, name: "price_non_negative")
  @@check(cost >= 0, name: "cost_non_negative")
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

model MerchandiseReceipt {
  id              String   @id @default(cuid())
  receiptNumber   String   @unique
  date            DateTime
  supplierId      String
  supplier        Supplier @relation(fields: [supplierId], references: [id], onDelete: Restrict)
  items           MerchandiseReceiptItem[]
  totalCost       Decimal
  notes           String?
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model MerchandiseReceiptItem {
  id              String   @id @default(cuid())
  receiptId       String
  receipt         MerchandiseReceipt @relation(fields: [receiptId], references: [id], onDelete: Cascade)
  productId       String
  product         Product  @relation(fields: [productId], references: [id], onDelete: Restrict)
  quantity        Int
  costPerUnit     Decimal
  totalCost       Decimal

  @@check(quantity > 0)
  @@check(costPerUnit >= 0)
}

model InventoryMovement {
  id              String   @id @default(cuid())
  productId       String
  product         Product  @relation(fields: [productId], references: [id], onDelete: Restrict)
  type            MovementType
  quantity        Int
  fromBranchId    String?
  fromBranch      Branch?  @relation("MovementFrom", fields: [fromBranchId], references: [id], onDelete: SetNull)
  toBranchId      String?
  toBranch        Branch?  @relation("MovementTo", fields: [toBranchId], references: [id], onDelete: SetNull)
  reason          String?
  reference       String?
  date            DateTime
  createdBy       String
  createdAt       DateTime @default(now())

  @@check(quantity > 0)
}

enum MovementType {
  IN
  OUT
  ADJUSTMENT
  TRANSFER
}

// ============================================
// MÓDULO: FACTURACIÓN (Invoicing)
// ============================================

model Invoice {
  id              String   @id @default(cuid())
  invoiceNumber   String   @unique
  customerName    String
  customerEmail   String?
  customerPhone   String?

  branchId        String
  branch          Branch   @relation(fields: [branchId], references: [id], onDelete: Restrict)

  salespersonId   String
  salesperson     Employee @relation(fields: [salespersonId], references: [id], onDelete: Restrict)

  items           InvoiceItem[]

  subtotal        Decimal  @default(0)
  tax             Decimal  @default(0)
  totalAmount     Decimal  @default(0)
  cashAmount      Decimal  @default(0)
  cardAmount      Decimal  @default(0)
  totalCost       Decimal  @default(0)
  grossProfit     Decimal  @default(0)
  profitMargin    Decimal  @default(0)

  status          InvoiceStatus @default(PAID)
  invoiceDate     DateTime
  dueDate         DateTime?
  paidDate        DateTime?

  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@check(totalAmount >= 0)
  @@check(cashAmount >= 0)
  @@check(cardAmount >= 0)
  @@check(totalCost >= 0)
}

enum InvoiceStatus {
  DRAFT
  PAID
  PARTIAL
  OVERDUE
  CANCELLED
}

model InvoiceItem {
  id              String   @id @default(cuid())
  invoiceId       String
  invoice         Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  productId       String
  product         Product  @relation(fields: [productId], references: [id], onDelete: Restrict)
  productName     String
  quantity        Int
  unitPrice       Decimal
  unitCost        Decimal
  subtotal        Decimal
  profit          Decimal

  @@check(quantity > 0)
  @@check(unitPrice >= 0)
  @@check(unitCost >= 0)
}

// ============================================
// MÓDULO: PROVEEDORES (Suppliers)
// ============================================

model Supplier {
  id              String   @id @default(cuid())
  name            String   @unique
  rnc             String?  @unique
  email           String?
  phone           String?
  address         String?
  photo           String?

  initialDebt     Decimal  @default(0)
  totalPaid       Decimal  @default(0)
  valueReceived   Decimal  @default(0)
  pendingBalance  Decimal  @default(0)

  // Relations
  payments        SupplierPayment[]
  merchandise     MerchandiseReceipt[]
  products        Product[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@check(totalPaid >= 0)
  @@check(valueReceived >= 0)
}

model SupplierPayment {
  id              String   @id @default(cuid())
  supplierId      String
  supplier        Supplier @relation(fields: [supplierId], references: [id], onDelete: Restrict)
  bankAccountId   String
  bankAccount     BankAccount @relation(fields: [bankAccountId], references: [id], onDelete: Restrict)
  amount          Decimal
  voucher         String?  // URL imagen
  invoice         String?
  date            DateTime
  createdBy       String
  createdAt       DateTime @default(now())

  @@check(amount > 0)
}

// ============================================
// MÓDULO: TESORERÍA/BANCOS (Treasury)
// ============================================

model BankAccount {
  id              String   @id @default(cuid())
  name            String   @unique
  accountNumber   String?  @unique
  accountType     AccountType
  balance         Decimal  @default(0)

  // Relations
  transactions    BankTransaction[]
  supplierPayments SupplierPayment[]
  cardPayments    CreditCardPayment[]
  expenses        Expense[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@check(balance >= 0, name: "balance_non_negative")
}

enum AccountType {
  CHECKING
  SAVINGS
  CREDIT_CARD
  CASH
  DOLLARS
}

model BankTransaction {
  id              String   @id @default(cuid())
  bankAccountId   String
  bankAccount     BankAccount @relation(fields: [bankAccountId], references: [id], onDelete: Restrict)
  type            TransactionType
  amount          Decimal
  description     String
  reference       String?
  date            DateTime
  createdBy       String
  createdAt       DateTime @default(now())

  @@check(amount > 0)
}

enum TransactionType {
  DEPOSIT
  WITHDRAWAL
  TRANSFER_IN
  TRANSFER_OUT
}

model InterbankTransfer {
  id              String   @id @default(cuid())
  fromBankId      String
  toBankId        String
  amount          Decimal
  reason          String?
  note            String?
  date            DateTime
  createdBy       String
  createdAt       DateTime @default(now())

  @@check(amount > 0)
}

model PaymentProcessor {
  id              String   @id @default(cuid())
  name            String   @unique  // Carnet, AZUL
  totalCollected  Decimal  @default(0)
  commissionRate  Decimal  // 6%, 7%
  commissionAmount Decimal @default(0)
  transferred     Decimal  @default(0)
  toBankId        String?
  transactionCount Int     @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@check(commissionRate >= 0)
  @@check(commissionRate <= 100)
}

// ============================================
// MÓDULO: TARJETAS (Credit Cards)
// ============================================

model CreditCard {
  id              String   @id @default(cuid())
  name            String   @unique
  cardNumber      String?
  initialDebt     Decimal  @default(0)
  totalExpenses   Decimal  @default(0)
  totalPaid       Decimal  @default(0)
  currentDebt     Decimal  @default(0)

  // Relations
  payments        CreditCardPayment[]
  expenses        Expense[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@check(currentDebt >= 0)
}

model CreditCardPayment {
  id              String   @id @default(cuid())
  creditCardId    String
  creditCard      CreditCard @relation(fields: [creditCardId], references: [id], onDelete: Restrict)
  bankAccountId   String
  bankAccount     BankAccount @relation(fields: [bankAccountId], references: [id], onDelete: Restrict)
  amount          Decimal
  note            String?
  date            DateTime
  createdBy       String
  createdAt       DateTime @default(now())

  @@check(amount > 0)
}

// ============================================
// MÓDULO: GASTOS (Expenses)
// ============================================

model Expense {
  id              String   @id @default(cuid())
  date            DateTime
  amount          Decimal
  note            String?
  category        ExpenseCategory
  branchId        String?
  branch          Branch?  @relation(fields: [branchId], references: [id], onDelete: SetNull)
  department      Department?
  bankAccountId   String?
  bankAccount     BankAccount? @relation(fields: [bankAccountId], references: [id], onDelete: SetNull)
  creditCardId    String?
  creditCard      CreditCard? @relation(fields: [creditCardId], references: [id], onDelete: SetNull)
  receipt         String?
  isFixedExpense  Boolean  @default(false)
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@check(amount > 0)
}

enum ExpenseCategory {
  UTILITIES
  PAYROLL
  RENT
  COURIER
  FUEL
  SUPPLIES
  MAINTENANCE
  MARKETING
  OTHER
}

enum Department {
  BRANCHES
  COURIER
  CUSTOMER_SERVICE
  HUMAN_RESOURCES
  FINANCE
  ADMIN
}

// ============================================
// MÓDULO: CUADRES (Cash Reconciliation)
// ============================================

model CashReconciliation {
  id                  String   @id @default(cuid())
  date                DateTime
  branchId            String
  branch              Branch   @relation(fields: [branchId], references: [id], onDelete: Restrict)

  // Breakdown por método de pago
  cash                Decimal  @default(0)
  pocket              Decimal  @default(0)
  azul                Decimal  @default(0)
  popular             Decimal  @default(0)
  banreservas         Decimal  @default(0)
  bhdLeon             Decimal  @default(0)
  otherCards          Decimal  @default(0)

  // Totales
  totalReconciled     Decimal
  totalInvoiced       Decimal
  merchandiseCount    Int
  difference          Decimal  // Faltante (negativo) o Sobrante (positivo)

  createdBy           String
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([branchId, date])  // Solo un cuadre por día por sucursal
}

// ============================================
// MÓDULO: ALERTAS (Alerts System)
// ============================================

model Alert {
  id              String   @id @default(cuid())
  type            AlertType
  severity        AlertSeverity
  title           String
  description     String
  reference       String?
  resolved        Boolean  @default(false)
  resolvedBy      String?
  resolvedAt      DateTime?
  createdAt       DateTime @default(now())
}

enum AlertType {
  CASH_DISCREPANCY
  LOW_STOCK
  NEGATIVE_BALANCE
  OVERDUE_PAYMENT
  SYSTEM_ERROR
}

enum AlertSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

---

## 🎯 Resumen: Cómo se Garantiza 0 Errores

### 1. **Foreign Keys** = No puedes referenciar algo que no existe

- ✅ Factura DEBE tener sucursal válida
- ✅ Item DEBE tener producto válido
- ✅ Pago DEBE tener proveedor válido

### 2. **Constraints** = Reglas de negocio en la base de datos

- ✅ Stock nunca negativo
- ✅ Precios nunca negativos
- ✅ Balance de banco nunca negativo
- ✅ Cantidad vendida siempre > 0

### 3. **Transactions** = Todo o nada

- ✅ Crear factura + reducir stock + registrar movimiento = 1 operación atómica
- ✅ Si falla UNA cosa, TODO se deshace
- ✅ No hay estados intermedios inconsistentes

### 4. **Unique Constraints** = No duplicados

- ✅ No 2 facturas con mismo número
- ✅ No 2 productos con mismo SKU
- ✅ No 2 proveedores con mismo RNC

### 5. **Cascading** = Acciones automáticas controladas

- ✅ Si borras factura → borra items automáticamente
- ✅ Si intentas borrar proveedor con pagos → RECHAZA
- ✅ Si borras producto vendido → RECHAZA

### 6. **Type Safety (Prisma)** = Errores en compile-time

- ✅ No puedes pasar string donde va number
- ✅ No puedes olvidar campos requeridos
- ✅ Autocomplete de todas las relaciones

---

## 📊 Comparación: Airtable vs CuretCore

| Feature               | Airtable             | CuretCore (PostgreSQL + Prisma)        |
| --------------------- | -------------------- | -------------------------------------- |
| **Foreign Keys**      | ✅ Linked records    | ✅ Foreign keys reales                 |
| **Validations**       | ✅ Field validations | ✅ Check constraints + App validations |
| **Transactions**      | ❌ No tiene          | ✅ ACID transactions                   |
| **Type Safety**       | ❌ Runtime errors    | ✅ Compile-time errors                 |
| **Performance**       | 🟡 Limitado          | ✅ Índices optimizados                 |
| **Queries complejas** | 🟡 Limitado          | ✅ SQL completo                        |
| **Triggers**          | ❌ Solo automations  | ✅ Database triggers                   |
| **Backups**           | ✅ Automático        | ✅ Automático (Railway/Render)         |
| **Cost**              | 💰 $20/user/month    | 💰 $5-20/month total                   |

**Resultado:** CuretCore será **más robusto** que Airtable porque tiene garantías a nivel de base de datos que Airtable no tiene.

---

## ✅ Conclusión

**¿Cómo vincular 11 módulos con 0 errores?**

1. **PostgreSQL** garantiza integridad referencial con Foreign Keys
2. **Constraints** validan reglas de negocio antes de guardar
3. **Transactions** aseguran que operaciones complejas sean atómicas
4. **Prisma** da type-safety y previene errores en desarrollo
5. **Cascading** maneja borrados/actualizaciones automáticamente

**Resultado:** Sistema más robusto que Airtable, con validaciones en:

- ✅ Database level (PostgreSQL)
- ✅ ORM level (Prisma)
- ✅ Application level (Next.js + Zod/TypeScript)

**Imposible tener datos inconsistentes.**

---

**Última actualización:** 2025-11-18
**Estado:** ✅ Arquitectura definida
