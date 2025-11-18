# 🛒 Integración Shopify ↔ CuretCore con n8n

## 🎯 Objetivo

Tener **un solo inventario** sincronizado entre:

- **Shopify** (ventas online)
- **CuretCore** (ventas físicas + operaciones internas)

Con **reconciliación automática** para detectar discrepancias.

---

## 🏗️ Arquitectura de Integración

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLUJO COMPLETO                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SHOPIFY (Tienda Online)                                        │
│  ├─ Cliente compra producto                                     │
│  ├─ Shopify reduce stock automáticamente                        │
│  └─ 🔔 WEBHOOK → n8n                                            │
│                    ↓                                             │
│  N8N (Automatización)                                           │
│  ├─ Recibe webhook de Shopify                                   │
│  ├─ Transforma datos                                            │
│  ├─ Valida producto existe en CuretCore                         │
│  └─ 📤 POST → CuretCore API                                     │
│                    ↓                                             │
│  CURETCORE (Sistema Interno)                                    │
│  ├─ Recibe venta de Shopify (marcada como "shopify")           │
│  ├─ Reduce stock en CuretCore                                   │
│  ├─ Crea factura automática                                     │
│  └─ Registra en banco/tesorería                                 │
│                                                                  │
│  ─────────────────────────────────────────────────────           │
│                                                                  │
│  CURETCORE - VENTAS MANUALES (Tienda Física)                   │
│  ├─ Vendedor usa formulario web                                │
│  ├─ Selecciona productos del inventario                         │
│  ├─ Crea factura manual (marcada como "manual")                │
│  ├─ Reduce stock en CuretCore                                   │
│  └─ 🔔 WEBHOOK → n8n                                            │
│                    ↓                                             │
│  N8N                                                             │
│  ├─ Recibe webhook de CuretCore                                 │
│  └─ 📤 PUT → Shopify (actualiza stock)                          │
│                                                                  │
│  ─────────────────────────────────────────────────────           │
│                                                                  │
│  RECONCILIACIÓN DIARIA                                          │
│  ├─ 11:59 PM → n8n ejecuta workflow programado                 │
│  ├─ Compara stock Shopify vs CuretCore                         │
│  ├─ Detecta discrepancias                                       │
│  └─ Envía reporte de diferencias                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo 1: Venta en Shopify → CuretCore

### Paso a Paso

**1. Cliente compra en Shopify**

- Producto: "Bolso de cuero negro"
- Cantidad: 2
- Precio: RD$3,000
- Método de pago: Tarjeta (Shopify Payments)

**2. Shopify genera webhook**

```json
{
  "id": 5678901234,
  "order_number": 1024,
  "created_at": "2025-11-18T14:30:00Z",
  "total_price": "3000.00",
  "currency": "DOP",
  "customer": {
    "id": 123456,
    "email": "cliente@example.com",
    "first_name": "María",
    "last_name": "García"
  },
  "line_items": [
    {
      "id": 987654321,
      "product_id": 123,
      "variant_id": 456,
      "sku": "BOLSO-CUERO-NEGRO",
      "title": "Bolso de cuero negro",
      "quantity": 2,
      "price": "1500.00"
    }
  ],
  "shipping_address": {
    "city": "Santo Domingo",
    "province": "Distrito Nacional"
  },
  "financial_status": "paid",
  "fulfillment_status": null
}
```

**3. n8n recibe webhook**

Workflow de n8n:

```
┌─────────────────────────────────────────┐
│  1. WEBHOOK TRIGGER                     │
│     ├─ Escucha POST de Shopify         │
│     └─ URL: https://n8n.tudominio.com/webhook/shopify-order
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  2. TRANSFORM DATA                      │
│     ├─ Extrae productos                │
│     ├─ Mapea SKU de Shopify a CuretCore│
│     └─ Calcula totales                 │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  3. VALIDAR PRODUCTOS                   │
│     ├─ GET /api/products?sku=XXX       │
│     ├─ Verifica que existen            │
│     └─ Verifica stock disponible       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  4. CREAR FACTURA EN CURETCORE          │
│     ├─ POST /api/invoices              │
│     ├─ source: "shopify"               │
│     ├─ shopify_order_id: 5678901234    │
│     └─ Reduce stock automáticamente    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  5. NOTIFICACIÓN                        │
│     ├─ Slack: "Nueva venta Shopify"   │
│     └─ Email a almacén para preparar   │
└─────────────────────────────────────────┘
```

**4. CuretCore crea factura**

```typescript
// API endpoint: POST /api/invoices
{
  "source": "shopify",
  "shopifyOrderId": "5678901234",
  "shopifyOrderNumber": "1024",
  "customerName": "María García",
  "customerEmail": "cliente@example.com",
  "branchId": "online",  // Sucursal virtual "Online"
  "salespersonId": "shopify-system",  // Usuario sistema
  "items": [
    {
      "sku": "BOLSO-CUERO-NEGRO",
      "quantity": 2,
      "price": 1500
    }
  ],
  "paymentMethod": "shopify_payments",
  "status": "paid",
  "shippingAddress": {
    "city": "Santo Domingo",
    "province": "Distrito Nacional"
  }
}
```

**Resultado:**

- ✅ Factura creada en CuretCore (marcada como "shopify")
- ✅ Stock reducido en CuretCore
- ✅ Inventario sincronizado
- ✅ Notificación enviada

---

## 🏪 Flujo 2: Venta Manual (Tienda Física) → Actualiza Shopify

### Paso a Paso

**1. Vendedor en tienda física crea factura**

Usa formulario web de CuretCore:

```
┌────────────────────────────────────────┐
│  CREAR FACTURA - Sucursal Piantini    │
├────────────────────────────────────────┤
│                                        │
│  Cliente: [Juan Pérez____________]    │
│                                        │
│  Productos:                            │
│  ┌──────────────────────────────────┐ │
│  │ Bolso de cuero negro             │ │
│  │ SKU: BOLSO-CUERO-NEGRO           │ │
│  │ Stock disponible: 25             │ │
│  │ Cantidad: [2]                    │ │
│  │ Precio: RD$1,500 x 2 = RD$3,000 │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Método de pago:                       │
│  ○ Efectivo: RD$ [3000]               │
│  ○ Tarjeta:  RD$ [    ]               │
│                                        │
│  Vendedor: [Anderson Almonte ▼]       │
│                                        │
│  [CREAR FACTURA]                       │
└────────────────────────────────────────┘
```

**2. CuretCore procesa factura**

```typescript
// Backend: POST /api/invoices
async function createManualInvoice(data) {
  return await prisma.$transaction(async tx => {
    // 1. Crear factura
    const invoice = await tx.invoice.create({
      data: {
        source: "manual", // ← IMPORTANTE: marcada como manual
        invoiceNumber: await generateNumber(tx),
        customerName: data.customerName,
        branchId: data.branchId,
        salespersonId: data.salespersonId,
        // ... resto de datos
      },
    })

    // 2. Crear items y reducir stock
    for (const item of data.items) {
      // Reducir en CuretCore
      await tx.product.update({
        where: { sku: item.sku },
        data: { stock: { decrement: item.quantity } },
      })

      // ... crear invoice items
    }

    // 3. 🔔 Trigger webhook para n8n
    await triggerWebhook("https://n8n.tudominio.com/webhook/curetcore-sale", {
      event: "invoice.created",
      source: "manual",
      invoice: invoice,
      items: data.items,
    })

    return invoice
  })
}
```

**3. n8n recibe webhook y actualiza Shopify**

```
┌─────────────────────────────────────────┐
│  1. WEBHOOK TRIGGER                     │
│     ├─ Recibe venta de CuretCore       │
│     └─ Verifica source = "manual"      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  2. PARA CADA PRODUCTO                  │
│     ├─ Extrae SKU                      │
│     └─ Extrae cantidad vendida         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  3. BUSCAR EN SHOPIFY                   │
│     ├─ GET /admin/api/2024-01/products.json?fields=id,variants&sku=XXX
│     └─ Obtiene variant_id             │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  4. ACTUALIZAR STOCK EN SHOPIFY         │
│     ├─ GET current inventory_quantity  │
│     ├─ Calcula nuevo stock             │
│     └─ POST /admin/api/2024-01/inventory_levels/set.json
│        {                               │
│          "location_id": 12345,         │
│          "inventory_item_id": 67890,   │
│          "available": nuevo_stock      │
│        }                               │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  5. LOG                                 │
│     └─ Registra sync en base de datos │
└─────────────────────────────────────────┘
```

**Resultado:**

- ✅ Factura creada en CuretCore
- ✅ Stock reducido en CuretCore
- ✅ Stock actualizado en Shopify automáticamente
- ✅ Inventarios sincronizados

---

## ⚖️ Flujo 3: Reconciliación Diaria

### Propósito

**Detectar discrepancias** entre Shopify y CuretCore por:

- Ventas que no se sincronizaron
- Errores de red
- Ajustes manuales no reportados
- Bugs

### Workflow de n8n (Programado 11:59 PM diario)

```
┌─────────────────────────────────────────┐
│  1. CRON TRIGGER                        │
│     └─ Cada día a las 11:59 PM         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  2. OBTENER INVENTARIO DE SHOPIFY       │
│     ├─ GET /admin/api/2024-01/products.json
│     └─ Extrae SKU + stock disponible  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  3. OBTENER INVENTARIO DE CURETCORE     │
│     ├─ GET /api/products?fields=sku,stock
│     └─ Extrae SKU + stock disponible  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  4. COMPARAR STOCKS                     │
│     ├─ Para cada producto:             │
│     │   if (shopify.stock !== curetcore.stock) {
│     │     discrepancias.push({        │
│     │       sku,                       │
│     │       shopify: shopify.stock,   │
│     │       curetcore: curetcore.stock,
│     │       diff: shopify - curetcore │
│     │     })                           │
│     │   }                              │
│     └─ Genera reporte                  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  5. SI HAY DISCREPANCIAS                │
│     ├─ Envía email con reporte         │
│     ├─ Notifica en Slack               │
│     └─ Crea alerta en CuretCore        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  6. REGISTRO EN DB                      │
│     └─ Guarda resultado de reconciliación
└─────────────────────────────────────────┘
```

### Reporte de Discrepancias

```
═══════════════════════════════════════════════════════════
  REPORTE DE RECONCILIACIÓN DE INVENTARIO
  Fecha: 2025-11-18 23:59:00
═══════════════════════════════════════════════════════════

PRODUCTOS CON DISCREPANCIAS (3):

┌────────────────────┬──────────┬────────────┬──────────┐
│ SKU                │ Shopify  │ CuretCore  │ Dif      │
├────────────────────┼──────────┼────────────┼──────────┤
│ BOLSO-CUERO-NEGRO  │    23    │     25     │  -2  ⚠️  │
│ CARTERA-ROJA       │    15    │     14     │  +1  ⚠️  │
│ BILLETERA-CAFE     │     0    │      2     │  -2  🔴  │
└────────────────────┴──────────┴────────────┴──────────┘

ANÁLISIS:
• Total productos: 125
• Sincronizados: 122 ✅
• Con discrepancias: 3 ⚠️
• Precisión: 97.6%

ACCIONES REQUERIDAS:
1. Revisar ventas manuales del BOLSO-CUERO-NEGRO
2. Verificar ajuste de inventario en CARTERA-ROJA
3. URGENTE: BILLETERA-CAFE muestra 0 en Shopify pero 2 en sistema

═══════════════════════════════════════════════════════════
```

---

## 🗄️ Schema de Base de Datos Extendido

### Nueva tabla: Sync Log

```prisma
model InventorySync {
  id              String   @id @default(cuid())
  productId       String
  product         Product  @relation(fields: [productId], references: [id])

  // Estado antes y después
  shopifyBefore   Int
  shopifyAfter    Int
  curetcoreBefore Int
  curetcoreAfter  Int

  // Origen del sync
  source          SyncSource
  triggeredBy     String   // invoice_id, manual_adjustment_id, etc.

  // Resultado
  success         Boolean
  error           String?

  syncedAt        DateTime @default(now())
}

enum SyncSource {
  SHOPIFY_SALE      // Venta en Shopify
  MANUAL_SALE       // Venta manual en tienda
  ADJUSTMENT        // Ajuste manual
  RECONCILIATION    // Reconciliación diaria
  IMPORT_RECEIPT    // Recepción de importación
}

model ReconciliationReport {
  id                String   @id @default(cuid())
  date              DateTime
  totalProducts     Int
  matchedProducts   Int
  discrepancies     Int
  accuracy          Decimal  // Porcentaje
  reportData        Json     // Array de discrepancias
  createdAt         DateTime @default(now())
}
```

### Extender tabla Product

```prisma
model Product {
  id              String   @id @default(cuid())
  sku             String   @unique
  name            String

  // Stock
  stock           Int      @default(0)

  // Shopify integration
  shopifyProductId     String?  @unique
  shopifyVariantId     String?  @unique
  shopifyInventoryItemId String? @unique
  syncWithShopify      Boolean  @default(false)
  lastSyncedAt         DateTime?

  // Relations
  syncLogs        InventorySync[]

  // ... resto de campos
}
```

---

## 🛠️ Implementación Técnica

### 1. Setup de Webhooks en Shopify

**Shopify Admin:**

```
Settings > Notifications > Webhooks

┌─────────────────────────────────────────┐
│  Event: Order creation                  │
│  Format: JSON                           │
│  URL: https://n8n.tudominio.com/webhook/shopify-order
│  API Version: 2024-01                   │
└─────────────────────────────────────────┘
```

**Webhooks necesarios:**

1. `orders/create` - Nueva orden
2. `orders/paid` - Orden pagada
3. `orders/cancelled` - Orden cancelada
4. `inventory_levels/update` - Stock actualizado (para detectar ajustes manuales en Shopify)

---

### 2. n8n Workflow: Shopify → CuretCore

```json
{
  "name": "Shopify Order → CuretCore Invoice",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "path": "shopify-order",
        "responseMode": "responseNode",
        "options": {}
      }
    },
    {
      "name": "Extract Order Data",
      "type": "n8n-nodes-base.function",
      "position": [450, 300],
      "parameters": {
        "functionCode": "const order = items[0].json;\n\nconst invoice = {\n  source: 'shopify',\n  shopifyOrderId: order.id.toString(),\n  shopifyOrderNumber: order.order_number.toString(),\n  customerName: `${order.customer.first_name} ${order.customer.last_name}`,\n  customerEmail: order.customer.email,\n  branchId: 'online',\n  items: order.line_items.map(item => ({\n    sku: item.sku,\n    quantity: item.quantity,\n    price: parseFloat(item.price)\n  })),\n  totalAmount: parseFloat(order.total_price),\n  paymentMethod: 'shopify_payments',\n  shippingAddress: order.shipping_address\n};\n\nreturn [{ json: invoice }];"
      }
    },
    {
      "name": "Create Invoice in CuretCore",
      "type": "n8n-nodes-base.httpRequest",
      "position": [650, 300],
      "parameters": {
        "method": "POST",
        "url": "https://curetcore.tudominio.com/api/invoices",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "curetcoreApi",
        "options": {},
        "bodyParametersJson": "={{ $json }}"
      }
    },
    {
      "name": "Send Slack Notification",
      "type": "n8n-nodes-base.slack",
      "position": [850, 300],
      "parameters": {
        "channel": "#ventas",
        "text": "🛒 Nueva venta Shopify:\nOrden #{{ $node['Extract Order Data'].json.shopifyOrderNumber }}\nCliente: {{ $node['Extract Order Data'].json.customerName }}\nTotal: RD${{ $node['Extract Order Data'].json.totalAmount }}"
      }
    },
    {
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1050, 300],
      "parameters": {
        "options": {}
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Extract Order Data" }]]
    },
    "Extract Order Data": {
      "main": [[{ "node": "Create Invoice in CuretCore" }]]
    },
    "Create Invoice in CuretCore": {
      "main": [[{ "node": "Send Slack Notification" }]]
    },
    "Send Slack Notification": {
      "main": [[{ "node": "Respond to Webhook" }]]
    }
  }
}
```

---

### 3. n8n Workflow: CuretCore → Shopify

```json
{
  "name": "CuretCore Sale → Update Shopify Stock",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "path": "curetcore-sale"
      }
    },
    {
      "name": "For Each Product",
      "type": "n8n-nodes-base.splitInBatches",
      "position": [450, 300],
      "parameters": {
        "batchSize": 1,
        "options": {}
      }
    },
    {
      "name": "Get Shopify Product by SKU",
      "type": "n8n-nodes-base.httpRequest",
      "position": [650, 300],
      "parameters": {
        "method": "GET",
        "url": "=https://tu-tienda.myshopify.com/admin/api/2024-01/products.json?fields=id,variants&sku={{ $json.sku }}",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "shopifyApi",
        "options": {}
      }
    },
    {
      "name": "Extract Variant ID",
      "type": "n8n-nodes-base.function",
      "position": [850, 300],
      "parameters": {
        "functionCode": "const products = items[0].json.products;\nif (products.length === 0) {\n  throw new Error(`Product with SKU ${items[0].json.sku} not found in Shopify`);\n}\n\nconst variant = products[0].variants[0];\nreturn [{\n  json: {\n    inventory_item_id: variant.inventory_item_id,\n    quantity_to_reduce: items[0].json.quantity\n  }\n}];"
      }
    },
    {
      "name": "Get Current Stock",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1050, 300],
      "parameters": {
        "method": "GET",
        "url": "=https://tu-tienda.myshopify.com/admin/api/2024-01/inventory_levels.json?inventory_item_ids={{ $json.inventory_item_id }}",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "shopifyApi"
      }
    },
    {
      "name": "Calculate New Stock",
      "type": "n8n-nodes-base.function",
      "position": [1250, 300],
      "parameters": {
        "functionCode": "const currentStock = items[0].json.inventory_levels[0].available;\nconst toReduce = items[0].json.quantity_to_reduce;\nconst newStock = currentStock - toReduce;\n\nif (newStock < 0) {\n  throw new Error(`Stock would become negative: ${newStock}`);\n}\n\nreturn [{\n  json: {\n    location_id: items[0].json.inventory_levels[0].location_id,\n    inventory_item_id: items[0].json.inventory_item_id,\n    available: newStock\n  }\n}];"
      }
    },
    {
      "name": "Update Shopify Stock",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1450, 300],
      "parameters": {
        "method": "POST",
        "url": "https://tu-tienda.myshopify.com/admin/api/2024-01/inventory_levels/set.json",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "shopifyApi",
        "bodyParametersJson": "={{ $json }}"
      }
    }
  ]
}
```

---

### 4. API Endpoints en CuretCore

```typescript
// app/api/invoices/route.ts

export async function POST(request: Request) {
  const data = await request.json()

  // Validar con Zod
  const schema = z.object({
    source: z.enum(["shopify", "manual"]),
    shopifyOrderId: z.string().optional(),
    shopifyOrderNumber: z.string().optional(),
    customerName: z.string(),
    customerEmail: z.string().email().optional(),
    branchId: z.string(),
    salespersonId: z.string().optional(),
    items: z.array(
      z.object({
        sku: z.string(),
        quantity: z.number().int().positive(),
        price: z.number().positive().optional(),
      })
    ),
    paymentMethod: z.string(),
    cashAmount: z.number().optional(),
    cardAmount: z.number().optional(),
    shippingAddress: z
      .object({
        city: z.string(),
        province: z.string(),
      })
      .optional(),
  })

  const validated = schema.parse(data)

  try {
    const invoice = await createInvoice(validated)

    // Si es venta manual, trigger webhook para n8n
    if (validated.source === "manual") {
      await fetch("https://n8n.tudominio.com/webhook/curetcore-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "invoice.created",
          invoice,
          items: validated.items,
        }),
      })
    }

    return Response.json(invoice, { status: 201 })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }
}

// Función helper
async function createInvoice(data: InvoiceInput) {
  return await prisma.$transaction(async tx => {
    // Si viene de Shopify, usar "shopify-system" como vendedor
    const salespersonId = data.source === "shopify" ? await getSystemUserId(tx) : data.salespersonId

    // Crear factura
    const invoice = await tx.invoice.create({
      data: {
        source: data.source,
        shopifyOrderId: data.shopifyOrderId,
        shopifyOrderNumber: data.shopifyOrderNumber,
        invoiceNumber: await generateInvoiceNumber(tx),
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        branchId: data.branchId,
        salespersonId,
        invoiceDate: new Date(),
        status: "PAID",
        // ... resto de campos
      },
    })

    // Crear items y reducir stock
    let totalAmount = 0
    let totalCost = 0

    for (const item of data.items) {
      const product = await tx.product.findUnique({
        where: { sku: item.sku },
      })

      if (!product) {
        throw new Error(`Producto ${item.sku} no encontrado`)
      }

      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente de ${product.name}`)
      }

      const price = item.price || product.price
      const subtotal = item.quantity * price
      const itemCost = item.quantity * product.cost

      // Crear item
      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: price,
          unitCost: product.cost,
          subtotal,
          profit: subtotal - itemCost,
        },
      })

      // Reducir stock
      await tx.product.update({
        where: { id: product.id },
        data: {
          stock: { decrement: item.quantity },
          lastSyncedAt: new Date(),
        },
      })

      // Registrar sync log
      await tx.inventorySync.create({
        data: {
          productId: product.id,
          shopifyBefore: product.stock, // Asumimos sync
          shopifyAfter: product.stock - item.quantity,
          curetcoreBefore: product.stock,
          curetcoreAfter: product.stock - item.quantity,
          source: data.source === "shopify" ? "SHOPIFY_SALE" : "MANUAL_SALE",
          triggeredBy: invoice.id,
          success: true,
        },
      })

      totalAmount += subtotal
      totalCost += itemCost
    }

    // Actualizar totales
    return await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        subtotal: totalAmount,
        totalAmount,
        totalCost,
        grossProfit: totalAmount - totalCost,
        profitMargin: ((totalAmount - totalCost) / totalAmount) * 100,
      },
    })
  })
}
```

---

## 📊 Dashboard de Sincronización

### Vista en CuretCore

```
┌──────────────────────────────────────────────────────────┐
│  SINCRONIZACIÓN SHOPIFY                                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Estado: ✅ Activo                                       │
│  Última sincronización: Hace 2 minutos                   │
│  Próxima reconciliación: Hoy 23:59                       │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  ESTADÍSTICAS HOY                                  │ │
│  ├────────────────────────────────────────────────────┤ │
│  │  Ventas Shopify:    15 facturas  RD$45,000       │ │
│  │  Ventas Manuales:   32 facturas  RD$96,000       │ │
│  │  Productos sincronizados: 125 / 125  ✅           │ │
│  │  Errores de sync:     0                           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  ÚLTIMO REPORTE DE RECONCILIACIÓN                 │ │
│  ├────────────────────────────────────────────────────┤ │
│  │  Fecha: 2025-11-17 23:59                          │ │
│  │  Precisión: 98.4% ✅                               │ │
│  │  Discrepancias: 2 productos                        │ │
│  │                                                    │ │
│  │  [VER REPORTE COMPLETO]                           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  HISTORIAL DE SYNC (últimos 10)                   │ │
│  ├────────────────────────────────────────────────────┤ │
│  │  14:32  ✅  Venta Shopify #1024                   │ │
│  │  14:25  ✅  Venta Manual - Piantini                │ │
│  │  14:18  ✅  Venta Shopify #1023                   │ │
│  │  14:10  ⚠️  Error sync - BOLSO-123 (reintentado)  │ │
│  │  14:05  ✅  Venta Manual - Oficina                 │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [FORZAR RECONCILIACIÓN AHORA]                          │
│  [VER HISTORIAL COMPLETO]                               │
│  [CONFIGURAR WEBHOOKS]                                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## ✅ Ventajas de esta Arquitectura

### 1. **Inventario único**

- ✅ Una sola fuente de verdad (CuretCore)
- ✅ Shopify siempre actualizado
- ✅ No hay duplicación de datos

### 2. **Sincronización bidireccional**

- ✅ Shopify → CuretCore (ventas online)
- ✅ CuretCore → Shopify (ventas físicas)
- ✅ Automático en tiempo real

### 3. **Reconciliación automática**

- ✅ Detecta discrepancias diariamente
- ✅ Reportes automáticos
- ✅ Alertas de inconsistencias

### 4. **Trazabilidad completa**

- ✅ Cada venta marcada con origen (shopify/manual)
- ✅ Log de todas las sincronizaciones
- ✅ Auditoría completa

### 5. **Flexibilidad**

- ✅ Puedes vender en Shopify
- ✅ Puedes vender en tienda física
- ✅ Puedes hacer ajustes manuales
- ✅ Todo se sincroniza automáticamente

---

## 💰 Costos

### n8n

- **Opción 1:** n8n Cloud - $20/mes
- **Opción 2:** Self-hosted (Railway) - $5/mes
- **Recomendación:** Self-hosted es más barato

### Webhooks

- Shopify: Incluidos en plan
- CuretCore: Gratis (propio)

### Total adicional: **$5-20/mes**

---

## 🎯 Próximos Pasos

1. ✅ Crear cuenta en n8n
2. ✅ Configurar webhooks en Shopify
3. ✅ Crear workflows en n8n
4. ✅ Extender schema de CuretCore con sync tables
5. ✅ Implementar API endpoints
6. ✅ Crear dashboard de sincronización
7. ✅ Testear con productos de prueba
8. ✅ Ir a producción

---

**Última actualización:** 2025-11-18
**Estado:** ✅ Arquitectura completa
