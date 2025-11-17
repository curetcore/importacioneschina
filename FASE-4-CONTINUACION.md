# Fase 4: Continuación - Migración de Tablas Restantes

## ✅ Progreso Completado (33%)

### Componentes Base Creados
- ✅ `components/ui/data-table.tsx` - Componente DataTable reutilizable con:
  - Sorting multi-columna
  - Búsqueda global
  - Paginación configurable (10, 20, 30, 40, 50)
  - Column visibility toggle
  - Row selection
  - Navegación completa (primera, anterior, siguiente, última)

- ✅ `components/ui/dropdown-menu.tsx` - Menu para column visibility

### Tablas Migradas (2/6)
1. ✅ **Órdenes** (`/ordenes`) - **COMPLETADA**
   - Archivo: `app/(pages)/ordenes/page.tsx`
   - Columnas: `app/(pages)/ordenes/columns.tsx`
   - Reducción: -162 líneas de código
   - Funcionalidades: Sorting, búsqueda, paginación, editar, eliminar, exportar

2. ✅ **Pagos** (`/pagos-china`) - **COLUMNAS LISTAS**
   - Archivo columnas: `app/(pages)/pagos-china/columns.tsx` ✅
   - Archivo página: `app/(pages)/pagos-china/page.tsx` ⏳ PENDIENTE
   - 11 columnas definidas con soporte multi-moneda

## 🔄 Pendiente para Próxima Sesión (67%)

### Tablas por Migrar (4/6)

#### 1. Pagos China (`/pagos-china`) - PRIORIDAD ALTA
**Archivo:** `app/(pages)/pagos-china/page.tsx` (506 líneas)

**Patrón a seguir** (igual que órdenes):
```typescript
// 1. Importar DataTable y columnas
import { DataTable } from "@/components/ui/data-table"
import { getPagosColumns, Pago } from "./columns"

// 2. Simplificar query (eliminar paginación del servidor)
const { data: pagos = [], isLoading } = useQuery({
  queryKey: ["pagos-china"],
  queryFn: async () => {
    const response = await fetch("/api/pagos-china")
    const result = await response.json()
    if (!result.success) throw new Error(result.error)
    return result.data as Pago[]
  },
})

// 3. Crear columnas con callbacks
const columns = useMemo(
  () => getPagosColumns({
    onEdit: handleEdit,
    onDelete: setPagoToDelete,
    onAddAttachments: handleAddAttachments,
  }),
  []
)

// 4. Reemplazar tabla HTML con DataTable
<DataTable
  columns={columns}
  data={pagos}
  searchKey="idPago"
  searchPlaceholder="Buscar por ID de pago..."
  pageSize={20}
/>
```

**Consideraciones especiales:**
- Mantener funcionalidad de adjuntos
- Filtros por moneda (usar column filtering de React Table)
- KPIs calculados desde datos filtrados

#### 2. Gastos Logísticos (`/gastos-logisticos`)
**Archivo:** `app/(pages)/gastos-logisticos/page.tsx`

**Pasos:**
1. Crear `app/(pages)/gastos-logisticos/columns.tsx`
2. Definir columnas: ID, OC/Proveedor, Fecha, Tipo, Proveedor Servicio, Monto RD$, Adjuntos, Acciones
3. Actualizar página siguiendo patrón de órdenes
4. Mantener: KPIs en tiempo real, export con filtros

#### 3. Inventario Recibido (`/inventario-recibido`)
**Archivo:** `app/(pages)/inventario-recibido/page.tsx`

**Pasos:**
1. Crear `app/(pages)/inventario-recibido/columns.tsx`
2. Definir columnas: ID Recepción, OC/Proveedor, Fecha, Bodega, Cantidad, SKU/Producto, Costos, Acciones
3. Actualizar página siguiendo patrón
4. Mantener: Filtros por bodega, KPIs de recepciones

#### 4. Configuración (`/configuracion`)
**Archivo:** `app/(pages)/configuracion/page.tsx`

**Pasos:**
1. Crear `app/(pages)/configuracion/columns.tsx`
2. Definir columnas: Categoría, Clave, Valor, Descripción, Acciones
3. Actualizar página (tabla más simple)
4. Mantener: Agrupación por categorías

## 📋 Checklist para Próxima Sesión

```
[ ] Migrar tabla de Pagos
    [ ] Actualizar page.tsx
    [ ] Probar funcionalidad de adjuntos
    [ ] Verificar filtros de moneda
    [ ] Test build

[ ] Migrar tabla de Gastos Logísticos
    [ ] Crear columns.tsx
    [ ] Actualizar page.tsx
    [ ] Verificar KPIs
    [ ] Test build

[ ] Migrar tabla de Inventario
    [ ] Crear columns.tsx
    [ ] Actualizar page.tsx
    [ ] Verificar filtros de bodega
    [ ] Test build

[ ] Migrar tabla de Configuración
    [ ] Crear columns.tsx
    [ ] Actualizar page.tsx
    [ ] Verificar agrupación
    [ ] Test build

[ ] Finalización
    [ ] npm run build (verificar sin errores)
    [ ] Actualizar README.md (Fase 4 100%)
    [ ] Commit final
    [ ] Push cambios
```

## 🎯 Comandos Rápidos

```bash
# Iniciar desarrollo
npm run dev

# Build para verificar
npm run build

# Ver cambios
git status

# Commit progreso
git add . && git commit -m "Fase 4: Migrada tabla de [NOMBRE]"

# Push
git push
```

## 📊 Métricas Esperadas

Por cada tabla migrada esperamos:
- **Reducción de código:** ~150-200 líneas
- **Nuevas funcionalidades:** Sorting, column visibility, búsqueda mejorada
- **Tiempo de desarrollo:** 15-20 min por tabla

**Total estimado:** 1.5-2 horas para completar las 4 tablas restantes

## 🚀 Beneficios al Completar Fase 4

- ✅ 6 tablas con sorting profesional
- ✅ ~800-1000 líneas de código eliminadas
- ✅ UX consistente en todo el sistema
- ✅ Column visibility en todas las tablas
- ✅ Paginación mejorada y configurable
- ✅ Búsqueda instantánea
- ✅ Preparado para agregar más features (export por columnas, bulk actions, etc.)
