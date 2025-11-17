# 📊 Guía de Uso: StatCard y StatsGrid

## Componentes Creados

### 1. StatCard
Tarjeta de estadística reutilizable con iconos, valores y tendencias.

### 2. StatsGrid
Grid responsivo para organizar múltiples StatCards.

---

## 🎨 Ejemplos de Uso

### Ejemplo Básico

```tsx
import { StatCard, StatsGrid } from "@/components/ui"
import { DollarSign, Package, TrendingUp, Users } from "lucide-react"

export default function ExamplePage() {
  return (
    <StatsGrid cols={4}>
      <StatCard
        icon={<Package />}
        label="Total Órdenes"
        value="45"
        subtitle="Este mes"
      />

      <StatCard
        icon={<DollarSign />}
        label="FOB Total"
        value="$125,000"
        subtitle="En 45 órdenes"
      />

      <StatCard
        icon={<Users />}
        label="Proveedores"
        value="12"
        subtitle="Activos"
      />

      <StatCard
        icon={<TrendingUp />}
        label="Items Totales"
        value="1,250"
        subtitle="En inventario"
      />
    </StatsGrid>
  )
}
```

---

### Con Variantes de Color

```tsx
<StatsGrid cols={4}>
  {/* Default - Gris */}
  <StatCard
    variant="default"
    icon={<Package />}
    label="Total Órdenes"
    value="45"
  />

  {/* Primary - Azul */}
  <StatCard
    variant="primary"
    icon={<DollarSign />}
    label="Total Pagado"
    value="RD$ 2,500,000"
  />

  {/* Success - Verde */}
  <StatCard
    variant="success"
    icon={<CheckCircle />}
    label="Completadas"
    value="38"
  />

  {/* Warning - Amarillo */}
  <StatCard
    variant="warning"
    icon={<Clock />}
    label="Pendientes"
    value="7"
  />

  {/* Danger - Rojo */}
  <StatCard
    variant="danger"
    icon={<AlertTriangle />}
    label="Atrasadas"
    value="2"
  />
</StatsGrid>
```

---

### Con Indicadores de Tendencia

```tsx
<StatsGrid cols={3}>
  {/* Tendencia positiva */}
  <StatCard
    icon={<DollarSign />}
    label="Ventas del Mes"
    value="$125,000"
    trend={{ value: 15, isPositive: true }}
  />

  {/* Tendencia negativa */}
  <StatCard
    icon={<Package />}
    label="Inventario"
    value="1,250"
    trend={{ value: 8, isPositive: false }}
  />

  {/* Sin tendencia */}
  <StatCard
    icon={<Users />}
    label="Proveedores"
    value="12"
    subtitle="Activos"
  />
</StatsGrid>
```

---

### Con Estado de Loading

```tsx
const [loading, setLoading] = useState(true)

<StatsGrid cols={4}>
  <StatCard
    icon={<Package />}
    label="Total Órdenes"
    value="45"
    loading={loading}
  />

  <StatCard
    icon={<DollarSign />}
    label="FOB Total"
    value="$125,000"
    loading={loading}
  />

  {/* ... más cards */}
</StatsGrid>
```

---

### Con Datos Calculados

```tsx
import { useMemo } from "react"

export default function OrdenesPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([])

  // Calcular KPIs desde los datos
  const stats = useMemo(() => {
    const totalOCs = ordenes.length
    const totalItems = ordenes.reduce((sum, oc) => sum + oc._count.items, 0)
    const totalFOB = ordenes.reduce((sum, oc) => {
      return sum + oc.items.reduce((s, item) => s + item.subtotalUSD, 0)
    }, 0)
    const pendientes = ordenes.filter(oc => oc._count.pagosChina === 0).length

    return { totalOCs, totalItems, totalFOB, pendientes }
  }, [ordenes])

  return (
    <div>
      {/* KPIs calculados en tiempo real */}
      <StatsGrid cols={4}>
        <StatCard
          icon={<ClipboardList />}
          label="Total OCs"
          value={stats.totalOCs}
          subtitle="Filtradas"
        />

        <StatCard
          icon={<Package />}
          label="Items Totales"
          value={stats.totalItems.toLocaleString()}
        />

        <StatCard
          variant="primary"
          icon={<DollarSign />}
          label="FOB Total"
          value={`$${stats.totalFOB.toLocaleString()}`}
        />

        <StatCard
          variant={stats.pendientes > 0 ? "warning" : "success"}
          icon={<Clock />}
          label="OCs Pendientes"
          value={stats.pendientes}
        />
      </StatsGrid>

      {/* Resto del contenido */}
    </div>
  )
}
```

---

### Grid con Diferentes Columnas

```tsx
{/* 2 columnas en desktop */}
<StatsGrid cols={2}>
  <StatCard label="Stat 1" value="100" />
  <StatCard label="Stat 2" value="200" />
</StatsGrid>

{/* 3 columnas en desktop */}
<StatsGrid cols={3}>
  <StatCard label="Stat 1" value="100" />
  <StatCard label="Stat 2" value="200" />
  <StatCard label="Stat 3" value="300" />
</StatsGrid>

{/* 4 columnas en desktop (default) */}
<StatsGrid cols={4}>
  <StatCard label="Stat 1" value="100" />
  <StatCard label="Stat 2" value="200" />
  <StatCard label="Stat 3" value="300" />
  <StatCard label="Stat 4" value="400" />
</StatsGrid>
```

---

## 📱 Responsive Behavior

### Breakpoints Automáticos

| Columnas | Mobile | Tablet (md) | Desktop (lg) |
|----------|--------|-------------|--------------|
| `cols={2}` | 1 col | 2 cols | 2 cols |
| `cols={3}` | 1 col | 2 cols | 3 cols |
| `cols={4}` | 1 col | 2 cols | 4 cols |

---

## 🎨 Variantes de Color

| Variant | Color | Uso Recomendado |
|---------|-------|-----------------|
| `default` | Gris | Estadísticas neutras |
| `primary` | Azul | Métricas principales |
| `success` | Verde | Valores positivos, completados |
| `warning` | Amarillo | Pendientes, en proceso |
| `danger` | Rojo | Alertas, errores, atrasadas |

---

## 💡 Props API

### StatCard Props

```typescript
interface StatCardProps {
  icon?: React.ReactNode           // Icono (Lucide React)
  label: string                    // Etiqueta/título
  value: string | number           // Valor principal
  subtitle?: string                // Subtítulo opcional
  trend?: {                        // Tendencia opcional
    value: number                  // % de cambio
    isPositive: boolean            // ↑ verde o ↓ rojo
  }
  loading?: boolean                // Estado de carga
  variant?: "default" | "primary" | "success" | "warning" | "danger"
  className?: string               // Clases adicionales
}
```

### StatsGrid Props

```typescript
interface StatsGridProps {
  cols?: 2 | 3 | 4                // Número de columnas
  children: React.ReactNode       // StatCards
  className?: string              // Clases adicionales
}
```

---

## ✅ Best Practices

1. **Usar `useMemo` para cálculos**
   - Evita recalcular en cada render
   - Mejora performance

2. **Formato de números**
   - Usar `toLocaleString()` para separadores de miles
   - Usar `formatCurrency()` del sistema

3. **Iconos consistentes**
   - Usar Lucide React
   - Mantener iconos relevantes a la métrica

4. **Variantes significativas**
   - `success` para completados
   - `warning` para pendientes
   - `danger` para alertas

5. **Subtítulos descriptivos**
   - Dar contexto al valor
   - Ej: "En 45 órdenes", "Este mes"

---

## 🚀 Ejemplos Reales del Sistema

### Página OC China
```tsx
<StatsGrid cols={4}>
  <StatCard icon={<ClipboardList />} label="Total OCs" value={totalOCs} />
  <StatCard icon={<Package />} label="Items" value={totalItems} />
  <StatCard icon={<DollarSign />} label="FOB Total" value={`$${totalFOB}K`} />
  <StatCard icon={<Clock />} label="Pendientes" value={pendientes} variant="warning" />
</StatsGrid>
```

### Página Pagos
```tsx
<StatsGrid cols={4}>
  <StatCard icon={<DollarSign />} label="Total Pagado" value={`RD$ ${total}M`} variant="primary" />
  <StatCard icon={<Banknote />} label="USD" value={`$${usd}K`} />
  <StatCard icon={<Coins />} label="CNY" value={`¥${cny}K`} />
  <StatCard icon={<TrendingUp />} label="Tasa Promedio" value={tasaPromedio} />
</StatsGrid>
```

---

**Creado para:** Sistema de Importaciones v2.5.1
**Fecha:** Noviembre 2025
**Componentes:** `components/ui/stat-card.tsx`, `components/ui/stats-grid.tsx`
