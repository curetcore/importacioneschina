# 📋 ANÁLISIS COMPLETO: Módulo "Registros"

## 🎯 Objetivo
Crear un módulo "Registros" con 3 subsecciones para gestionar datos maestros del sistema de manera centralizada y profesional.

---

## 📊 SITUACIÓN ACTUAL (Estado del Sistema)

### ✅ Lo que YA tenemos:

#### 1. **Proveedores** (Implementación Simple)
- **Ubicación actual**: Tabla `configuracion` con `categoria = 'proveedores'`
- **Campos actuales**:
  - `id` (UUID)
  - `categoria` = "proveedores"
  - `valor` = "Nike China" (solo el nombre)
  - `orden` = número
  - `activo` = boolean
- **Cómo se usa**:
  - En `OCChina.proveedor` (String simple)
  - En `GastosLogisticos.proveedorServicio` (String simple)
  - Se selecciona desde dropdown en formulario de órdenes
- **Limitaciones actuales**:
  - ❌ Solo guarda el nombre
  - ❌ No tiene contacto (email, teléfono)
  - ❌ No tiene dirección
  - ❌ No tiene métodos de pago asociados
  - ❌ No tiene productos asociados
  - ❌ No se pueden ver métricas (cuántas órdenes, total pagado, etc.)

#### 2. **Productos** (NO existe como entidad independiente)
- **Ubicación actual**: Solo en `OCChinaItem` (productos dentro de órdenes)
- **Campos actuales**:
  - `sku`
  - `nombre`
  - `material`
  - `color`
  - `especificaciones`
  - `tallaDistribucion`
  - `cantidadTotal`
  - `precioUnitarioUSD`
  - `subtotalUSD`
- **Problema**:
  - ❌ Cada vez que creas una orden, escribes el producto de nuevo
  - ❌ Si "Zapato Nike Air Max" se escribe en 10 órdenes diferentes, hay 10 registros duplicados
  - ❌ No hay catálogo maestro de productos
  - ❌ No se puede reutilizar información de productos

#### 3. **Métodos de Pago** (Implementación Simple)
- **Ubicación actual**: Tabla `configuracion` con `categoria = 'metodosPago'`
- **Campos actuales**: Solo `valor` = "Transferencia bancaria"
- **Cómo se usa**:
  - En `PagosChina.metodoPago` (String simple)
  - En `GastosLogisticos.metodoPago` (String simple)
- **Limitaciones actuales**:
  - ❌ Solo guarda el nombre del método
  - ❌ No tiene cuenta bancaria asociada
  - ❌ No tiene número de tarjeta/cuenta
  - ❌ No tiene límites o saldos
  - ❌ No se puede asociar a un proveedor específico

---

## 🎯 LO QUE NECESITAMOS (Módulo "Registros")

### 📂 Estructura del Menú

```
Dashboard
Órdenes
Pagos
Gastos
Inventario
📂 Registros          ← NUEVO
  ├── 👥 Proveedores  ← NUEVO
  ├── 📦 Productos    ← NUEVO
  └── 💳 Métodos de Pago ← NUEVO
Configuración
```

---

## 1️⃣ SUBSECCIÓN: PROVEEDORES

### 🎯 Objetivo
Convertir "proveedor" de un simple texto a una **entidad completa con perfil CRM**.

### 📋 Nuevo Modelo de Datos

```typescript
model Proveedor {
  id                    String   @id @default(cuid())
  codigo                String   @unique // "PROV-001"
  nombre                String   // "Nike China Factory"
  nombreCorto           String?  // "Nike CN"

  // Información de contacto
  contactoPrincipal     String?  // "Juan Pérez"
  email                 String?
  telefono              String?
  whatsapp              String?

  // Información de ubicación
  pais                  String   @default("China")
  ciudad                String?
  direccion             String?  @db.Text

  // Información comercial
  tipoProveedor         String?  // "Fabricante", "Distribuidor", "Broker"
  categoriasPrincipales String[] // ["Zapatos", "Carteras"]

  // Términos comerciales
  diasCredito           Int      @default(0)
  monedaPreferida       String   @default("USD")
  metodoPagoPrincipal   String?

  // Notas y documentos
  notas                 String?  @db.Text
  documentos            Json?    // [{nombre, url, tipo, uploadedAt}]

  // Estado
  activo                Boolean  @default(true)
  calificacion          Int?     @default(0) // 1-5 estrellas

  // Relaciones
  metodoPago            MetodoPago[]  // Varios métodos de pago
  productos             Producto[]    // Catálogo de productos del proveedor
  ordenes               OCChina[]     // Órdenes de compra

  // Timestamps
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@map("proveedores")
  @@index([nombre])
  @@index([codigo])
  @@index([activo])
}
```

### 📱 Vista de Lista (Estilo CRM)

**URL**: `/registros/proveedores`

**Tabla con columnas**:
| Código | Nombre | País | Contacto | Teléfono | # Órdenes | Total Pagado | Último Pago | Estado | Acciones |
|--------|--------|------|----------|----------|-----------|--------------|-------------|--------|----------|
| PROV-001 | Nike China | China | Juan P. | +86 123... | 15 | $125,450 | 2 días | 🟢 Activo | 👁️ ✏️ |
| PROV-002 | Adidas Factory | China | Maria L. | +86 456... | 8 | $87,300 | 1 semana | 🟢 Activo | 👁️ ✏️ |

**Filtros disponibles**:
- Por país
- Por tipo de proveedor
- Por estado (activo/inactivo)
- Buscar por nombre/código

**Botones de acción**:
- ➕ **Nuevo Proveedor**
- 📊 **Exportar a Excel**

### 📄 Vista de Detalle

**URL**: `/registros/proveedores/[id]`

**Secciones**:

#### 📌 **Información General**
```
Código: PROV-001
Nombre: Nike China Factory
Tipo: Fabricante
País: China
Ciudad: Guangzhou
Calificación: ⭐⭐⭐⭐⭐
Estado: 🟢 Activo
```

#### 👤 **Contacto**
```
Contacto Principal: Juan Pérez
Email: juan@nikechina.com
Teléfono: +86 123 456 7890
WhatsApp: +86 123 456 7890
Dirección: Calle Principal 123, Guangzhou, China
```

#### 💼 **Términos Comerciales**
```
Días de crédito: 30 días
Moneda preferida: USD
Método de pago principal: Transferencia bancaria
```

#### 💳 **Métodos de Pago / Monederos** (Tabla)
| Tipo | Banco/Cuenta | Número/Alias | Titular | Predeterminado |
|------|--------------|--------------|---------|----------------|
| Transferencia | Bank of China | 1234-5678-9012 | Nike Factory Ltd | ⭐ Sí |
| Alipay | - | nikefactory@alipay.cn | - | No |

**Botón**: ➕ Agregar Método de Pago

#### 📦 **Catálogo de Productos** (Tabla)
| SKU | Producto | Categoría | Precio Base USD | Stock | Última OC |
|-----|----------|-----------|-----------------|-------|-----------|
| ZAP-001 | Nike Air Max | Zapatos | $45.00 | - | OC-2025-003 |
| ZAP-002 | Nike Revolution | Zapatos | $38.50 | - | OC-2025-001 |

**Botón**: ➕ Agregar Producto

#### 📊 **Estadísticas**
```
Total de Órdenes: 15
Total Pagado (histórico): $125,450 USD
Promedio por orden: $8,363 USD
Última orden: OC-2025-015 (hace 2 días)
Último pago: PAG-2025-030 (hace 2 días)
```

#### 📋 **Órdenes de Compra** (Últimas 10)
| OC | Fecha | Total USD | Pagado | Pendiente | Estado |
|----|-------|-----------|--------|-----------|--------|
| OC-2025-015 | 15/11/2025 | $8,500 | $8,500 | $0 | ✅ Completa |
| OC-2025-012 | 10/11/2025 | $12,300 | $12,300 | $0 | ✅ Completa |

**Botón**: 📄 Ver todas las órdenes

#### 📝 **Notas**
```
[Editor de texto]
Proveedor confiable. Entrega siempre a tiempo.
Contacto principal habla español.
```

#### 📎 **Documentos**
```
📄 Contrato_Nike_2025.pdf (1.2 MB) - Subido 01/01/2025
📄 Certificado_Calidad.pdf (850 KB) - Subido 15/01/2025
```

**Botón**: ⬆️ Subir Documento

---

## 2️⃣ SUBSECCIÓN: PRODUCTOS

### 🎯 Objetivo
Crear un **catálogo maestro de productos** que se pueda reutilizar en múltiples órdenes.

### 📋 Nuevo Modelo de Datos

```typescript
model Producto {
  id                    String   @id @default(cuid())
  sku                   String   @unique // "ZAP-001"
  nombre                String   // "Nike Air Max 2025"
  nombreCorto           String?  // "Air Max 25"

  // Clasificación
  categoria             String   // "Zapatos"
  subcategoria          String?  // "Deportivos"
  marca                 String?  // "Nike"

  // Detalles del producto
  material              String?  @db.Text
  color                 String?
  especificaciones      String?  @db.Text

  // Tallas disponibles (catálogo)
  tallasDisponibles     String[] // ["38", "39", "40", "41", "42"]

  // Información comercial
  proveedorId           String?
  proveedor             Proveedor? @relation(fields: [proveedorId], references: [id], onDelete: SetNull)
  precioBaseUSD         Decimal?  @db.Decimal(10, 4)
  moneda                String    @default("USD")

  // Imágenes y documentos
  imagenes              Json?     // [{url, descripcion, principal: boolean}]
  fichaTecnica          Json?     // {url, nombre, uploadedAt}

  // Estado
  activo                Boolean   @default(true)
  destacado             Boolean   @default(false)

  // Estadísticas (calculadas)
  // vecesOrdenado - cuenta en OCChinaItem
  // ultimaOrden - max(OCChina.fechaOC) donde item.sku = this.sku

  // Notas
  notas                 String?   @db.Text

  // Timestamps
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@map("productos")
  @@index([sku])
  @@index([categoria])
  @@index([proveedorId])
  @@index([activo])
}
```

### 📱 Vista de Lista

**URL**: `/registros/productos`

**Tabla con columnas**:
| Imagen | SKU | Producto | Categoría | Proveedor | Precio Base | Veces Ordenado | Última OC | Estado | Acciones |
|--------|-----|----------|-----------|-----------|-------------|----------------|-----------|--------|----------|
| 🖼️ | ZAP-001 | Nike Air Max | Zapatos | Nike China | $45.00 | 12 | OC-2025-015 | 🟢 | 👁️ ✏️ |
| 🖼️ | CAR-001 | Cartera Cuero | Carteras | Leather Co. | $28.50 | 8 | OC-2025-012 | 🟢 | 👁️ ✏️ |

**Filtros**:
- Por categoría
- Por proveedor
- Por estado
- Buscar por SKU/nombre

**Botones**:
- ➕ **Nuevo Producto**
- 📊 **Exportar Catálogo**

### 📄 Vista de Detalle

**URL**: `/registros/productos/[id]`

**Secciones**:

#### 📌 **Información General**
```
SKU: ZAP-001
Nombre: Nike Air Max 2025
Categoría: Zapatos > Deportivos
Marca: Nike
Estado: 🟢 Activo
```

#### 🏭 **Proveedor**
```
Proveedor: Nike China Factory (PROV-001)
Precio Base: $45.00 USD
[Enlace al proveedor]
```

#### 📐 **Especificaciones**
```
Material: Cuero sintético + EVA
Color: Negro con detalles blancos
Tallas disponibles: 38, 39, 40, 41, 42, 43, 44
Peso aproximado: 350g
```

#### 🖼️ **Imágenes**
```
[Galería de imágenes]
📷 Imagen principal
📷 Vista lateral
📷 Detalle suela
```

**Botón**: ⬆️ Subir Imagen

#### 📊 **Estadísticas de Uso**
```
Veces ordenado: 12
Cantidad total ordenada: 1,250 unidades
Última orden: OC-2025-015 (hace 2 días)
Precio promedio pagado: $44.85 USD
```

#### 📋 **Historial de Órdenes**
| OC | Fecha | Cantidad | Precio Unit. | Total | Proveedor |
|----|-------|----------|--------------|-------|-----------|
| OC-2025-015 | 15/11/2025 | 100 | $45.00 | $4,500 | Nike China |
| OC-2025-012 | 10/11/2025 | 150 | $44.50 | $6,675 | Nike China |

---

## 3️⃣ SUBSECCIÓN: MÉTODOS DE PAGO / MONEDEROS

### 🎯 Objetivo
Gestionar **cuentas bancarias, tarjetas, y métodos de pago** con información completa.

### 📋 Nuevo Modelo de Datos

```typescript
model MetodoPago {
  id                    String   @id @default(cuid())
  codigo                String   @unique // "MP-001"

  // Tipo de método
  tipo                  String   // "Transferencia", "Tarjeta", "Efectivo", "Alipay", "PayPal"
  nombre                String   // "Cuenta Bank of China - USD"

  // Información de la cuenta
  banco                 String?  // "Bank of China"
  numeroCuenta          String?  // "1234-5678-9012-3456"
  titular               String?  // "Importadora Curet SRL"
  swift                 String?  // Para transferencias internacionales

  // Para tarjetas
  tipoTarjeta           String?  // "Crédito", "Débito"
  ultimos4Digitos       String?  // "1234"
  fechaVencimiento      String?  // "12/2025"

  // Para monederos digitales
  email                 String?  // Para PayPal
  alias                 String?  // Para Alipay

  // Información comercial
  moneda                String   @default("USD")
  limite                Decimal? @db.Decimal(12, 2)
  saldoActual           Decimal? @db.Decimal(12, 2)

  // Asociación a proveedor (opcional)
  proveedorId           String?
  proveedor             Proveedor? @relation(fields: [proveedorId], references: [id], onDelete: SetNull)

  // Preferencias
  predeterminado        Boolean  @default(false)
  activo                Boolean  @default(true)

  // Relaciones
  pagos                 PagosChina[]
  gastos                GastosLogisticos[]

  // Notas
  notas                 String?  @db.Text

  // Timestamps
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@map("metodos_pago")
  @@index([tipo])
  @@index([proveedorId])
  @@index([activo])
}
```

### 📱 Vista de Lista

**URL**: `/registros/metodos-pago`

**Tabla con columnas**:
| Código | Tipo | Nombre | Banco | Cuenta | Moneda | Proveedor | Saldo | Estado | Acciones |
|--------|------|--------|-------|--------|--------|-----------|-------|--------|----------|
| MP-001 | Transferencia | Cuenta BOC USD | Bank of China | ****3456 | USD | - | $5,000 | 🟢 | 👁️ ✏️ |
| MP-002 | Alipay | Alipay Importaciones | - | nike@alipay | CNY | Nike China | - | 🟢 | 👁️ ✏️ |

**Filtros**:
- Por tipo
- Por moneda
- Por proveedor
- Por estado

**Botones**:
- ➕ **Nuevo Método de Pago**

### 📄 Vista de Detalle

**URL**: `/registros/metodos-pago/[id]`

**Información mostrada**:
```
Código: MP-001
Tipo: Transferencia Bancaria
Nombre: Cuenta Bank of China - USD

Banco: Bank of China
Número de cuenta: 1234-5678-9012-3456
Titular: Importadora Curet SRL
SWIFT: BKCHCNBJ950

Moneda: USD
Límite: $50,000
Saldo actual: $5,000

Proveedor asociado: - (Sin asignar)
Predeterminado: ⭐ Sí
Estado: 🟢 Activo

Estadísticas:
- Pagos realizados: 25
- Total pagado: $125,450
- Último pago: hace 2 días
```

---

## 🔄 CÓMO SE INTEGRA CON EL SISTEMA ACTUAL

### 🔗 Cambios Necesarios

#### 1. **Modificar Modelo OCChina**
```typescript
// ANTES
model OCChina {
  proveedor  String  // Solo texto
}

// DESPUÉS
model OCChina {
  proveedor      String      // Se mantiene para compatibilidad
  proveedorId    String?     // NUEVO - Relación con tabla Proveedor
  proveedorRef   Proveedor?  @relation(fields: [proveedorId], references: [id])
}
```

**Estrategia de migración**:
- ✅ Mantener campo `proveedor` (String) para órdenes existentes
- ✅ Agregar `proveedorId` (opcional) para nuevas órdenes
- ✅ Las órdenes nuevas usarán `proveedorId`
- ✅ Las órdenes viejas seguirán funcionando con `proveedor` (String)

#### 2. **Modificar Formulario de Órdenes**
```typescript
// ANTES: Dropdown con strings simples
<Select
  options={["Nike China", "Adidas Factory"]}
  value={formData.proveedor}
/>

// DESPUÉS: Dropdown con proveedores completos
<Select
  options={proveedores.map(p => ({
    value: p.id,
    label: `${p.codigo} - ${p.nombre}`
  }))}
  value={formData.proveedorId}
/>

// Al guardar:
{
  proveedor: proveedorSeleccionado.nombre,  // Para compatibilidad
  proveedorId: proveedorSeleccionado.id     // Nueva relación
}
```

#### 3. **Modificar Tabla de Pagos/Gastos**
```typescript
// ANTES
model PagosChina {
  metodoPago  String  // "Transferencia bancaria"
}

// DESPUÉS
model PagosChina {
  metodoPago      String       // Se mantiene
  metodoPagoId    String?      // NUEVO
  metodoPagoRef   MetodoPago?  @relation(...)
}
```

#### 4. **Crear Vista de "Usar Productos del Catálogo"**

En el formulario de orden, al agregar productos:

**Opción A: Crear producto nuevo** (como ahora)
```
SKU: [____]
Nombre: [____]
Material: [____]
Color: [____]
Precio: [____]
```

**Opción B: Usar del catálogo** (NUEVO)
```
[Buscar producto] → Autocomplete con productos existentes
↓
Se auto-completan todos los campos:
SKU: ZAP-001 (readonly)
Nombre: Nike Air Max (readonly)
Material: Cuero sintético (readonly)
Color: Negro (editable)
Precio: $45.00 (editable, pre-llenado con precio base)
Cantidad: [____]
```

---

## 🛠️ TECNOLOGÍA A UTILIZAR

### Stack Actual del Proyecto:
```
✅ Next.js 14.2.33 (App Router)
✅ TypeScript 5.5
✅ Prisma 6.19 (ORM)
✅ PostgreSQL (Base de datos)
✅ Tailwind CSS (Estilos)
✅ Componentes UI personalizados (components/ui/)
```

### Para el Módulo "Registros" usaremos:

#### 1. **Base de Datos (Prisma + PostgreSQL)**
```prisma
// Nuevas tablas:
- proveedores
- productos
- metodos_pago

// Modificaciones a tablas existentes:
- oc_china (agregar proveedorId opcional)
- pagos_china (agregar metodoPagoId opcional)
- gastos_logisticos (agregar metodoPagoId opcional)
```

#### 2. **Backend (Next.js API Routes)**
```
app/api/
├── proveedores/
│   ├── route.ts           # GET (list), POST (create)
│   ├── [id]/route.ts      # GET, PUT, DELETE
│   └── [id]/estadisticas/route.ts  # GET stats
├── productos/
│   ├── route.ts
│   ├── [id]/route.ts
│   └── buscar/route.ts    # Para autocomplete
└── metodos-pago/
    ├── route.ts
    └── [id]/route.ts
```

#### 3. **Frontend (React + TypeScript)**
```
app/(pages)/registros/
├── page.tsx                    # Página principal con 3 cards
├── proveedores/
│   ├── page.tsx                # Lista de proveedores
│   └── [id]/page.tsx           # Detalle de proveedor
├── productos/
│   ├── page.tsx                # Lista de productos
│   └── [id]/page.tsx           # Detalle de producto
└── metodos-pago/
    ├── page.tsx                # Lista de métodos
    └── [id]/page.tsx           # Detalle de método
```

#### 4. **Componentes Nuevos**
```
components/
├── forms/
│   ├── ProveedorForm.tsx       # Form completo de proveedor
│   ├── ProductoForm.tsx        # Form completo de producto
│   └── MetodoPagoForm.tsx      # Form completo de método
├── tables/
│   ├── ProveedoresTable.tsx    # Tabla estilo CRM
│   ├── ProductosTable.tsx      # Tabla de catálogo
│   └── MetodosPagoTable.tsx    # Tabla de métodos
└── cards/
    └── EstadisticasCard.tsx    # Card reutilizable para stats
```

#### 5. **Sin bibliotecas adicionales**
- ❌ NO instalaremos TanStack Table (usaremos HTML table simple)
- ❌ NO instalaremos React Hook Form (usaremos useState como ahora)
- ❌ NO instalaremos Chart.js (stats con números simples)
- ✅ Reutilizaremos componentes UI existentes (`Button`, `Input`, `Select`, `Dialog`)

---

## 📊 COMPLEJIDAD Y ESFUERZO

### Estimación de Trabajo:

| Tarea | Complejidad | Tiempo Est. | Archivos |
|-------|-------------|-------------|----------|
| **Modelos Prisma** | Media | 30 min | 1 schema.prisma |
| **Migración BD** | Baja | 10 min | 1 migration |
| **APIs Proveedores** | Media | 1 hora | 3 archivos |
| **APIs Productos** | Media | 1 hora | 3 archivos |
| **APIs Métodos Pago** | Media | 1 hora | 3 archivos |
| **Página Registros** | Baja | 20 min | 1 archivo |
| **Lista Proveedores** | Media | 1.5 horas | 3 archivos |
| **Detalle Proveedor** | Alta | 2 horas | 5 archivos |
| **Lista Productos** | Media | 1 hora | 2 archivos |
| **Detalle Producto** | Media | 1 hora | 3 archivos |
| **Lista Métodos Pago** | Media | 1 hora | 2 archivos |
| **Detalle Método Pago** | Media | 1 hora | 3 archivos |
| **Modificar OCChinaForm** | Alta | 1 hora | 1 archivo |
| **Testing + Ajustes** | - | 2 horas | - |
| **TOTAL** | - | **~14 horas** | **~30 archivos** |

---

## ⚠️ CONSIDERACIONES Y RIESGOS

### ✅ Ventajas:
1. **Catálogo centralizado** - No más duplicación de productos
2. **Información completa** - Contactos, métodos de pago, etc.
3. **Estadísticas útiles** - Ver qué proveedor/producto es más usado
4. **Profesional** - Se ve como un sistema ERP real
5. **Reutilizable** - Productos se usan en múltiples órdenes
6. **Mantenible** - Si cambia el precio base, se actualiza en un solo lugar

### ⚠️ Riesgos:
1. **Compatibilidad hacia atrás**
   - **Problema**: Órdenes existentes usan `proveedor: String`
   - **Solución**: Mantener ambos campos, migrar gradualmente

2. **Complejidad en formularios**
   - **Problema**: Formulario de orden se vuelve más complejo
   - **Solución**: Mantener opción de "crear producto rápido"

3. **Migración de datos**
   - **Problema**: ¿Qué hacemos con proveedores actuales en `configuracion`?
   - **Solución**: Script de migración que crea registros en `proveedores`

4. **Rendimiento**
   - **Problema**: Más JOINs en queries
   - **Solución**: Usar `include` selectivo en Prisma

### 🔄 Estrategia de Migración:

**Fase 1: Crear sin romper nada**
- Crear nuevas tablas (`proveedores`, `productos`, `metodos_pago`)
- Agregar campos opcionales (`proveedorId`, `metodoPagoId`)
- Mantener campos actuales (`proveedor`, `metodoPago`)

**Fase 2: Migrar datos existentes**
- Script que lee `configuracion` donde `categoria = 'proveedores'`
- Crea registros en tabla `proveedores`
- Actualiza `OCChina` para vincular `proveedorId`

**Fase 3: Deprecar lo viejo**
- Una vez que todo funciona, marcar campos antiguos como deprecated
- En el futuro, eliminar campos String simples

---

## 🎯 DECISIÓN FINAL

### ¿Vale la pena implementarlo?

**SÍ, si:**
- ✅ Planeas seguir usando el sistema a largo plazo
- ✅ Quieres tener estadísticas de proveedores/productos
- ✅ Necesitas reutilizar productos en múltiples órdenes
- ✅ Quieres gestionar múltiples cuentas bancarias
- ✅ Te interesa tener un CRM básico de proveedores

**NO, si:**
- ❌ Solo necesitas lo básico (que ya funciona)
- ❌ No tienes tiempo para ~14 horas de desarrollo
- ❌ Los proveedores/productos cambian constantemente

---

## 📝 PRÓXIMOS PASOS (Si decides implementar)

1. **Revisar y aprobar este análisis**
2. **Decidir qué subsecciones implementar**:
   - ¿Las 3? (Proveedores + Productos + Métodos Pago)
   - ¿Solo Proveedores primero?
3. **Crear modelos Prisma**
4. **Generar migración**
5. **Crear APIs**
6. **Crear UIs**
7. **Migrar datos existentes**
8. **Testing**

---

**¿Qué opinas de este análisis? ¿Procedemos con la implementación o hay algo que quieras ajustar primero?**
