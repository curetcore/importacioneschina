# 🎨 Shopify Admin Design System - Análisis Completo

> **Objetivo:** Documentar TODOS los componentes, patrones y estilos de Shopify Admin para crear un Design System replicable en el ecosistema Curet.

**Fecha:** 2025-11-18
**Versión Shopify analizada:** 2024 Admin

---

## 📊 Tabla de Contenidos

1. [Design Tokens](#design-tokens)
2. [Layout & Structure](#layout--structure)
3. [Typography](#typography)
4. [Componentes Base](#componentes-base)
5. [Componentes Complejos](#componentes-complejos)
6. [Patrones de Navegación](#patrones-de-navegación)
7. [Patrones de Data Display](#patrones-de-data-display)
8. [Patrones de Forms](#patrones-de-forms)
9. [Feedback & Messaging](#feedback--messaging)
10. [Animations & Transitions](#animations--transitions)
11. [Iconografía](#iconografía)
12. [Responsive Behavior](#responsive-behavior)

---

## 1. Design Tokens

### 1.1 Color Palette

#### Primary/Brand Colors

```css
--p-surface-primary: #008060 /* Verde Shopify */ --p-surface-primary-hovered: #006e52
  /* Verde hover */ --p-surface-primary-pressed: #005c46 /* Verde pressed */
  --p-surface-primary-subdued: #e3f5f1 /* Verde claro background */;
```

#### Surface Colors

```css
--p-surface: #ffffff /* Blanco puro */ --p-surface-neutral: #f6f6f7 /* Gris muy claro */
  --p-surface-subdued: #f1f2f4 /* Gris claro */ --p-surface-disabled: #fafbfb
  /* Disabled background */ --p-surface-hovered: #f6f6f7 /* Hover en rows */
  --p-surface-pressed: #f1f2f4 /* Pressed state */ --p-surface-selected: #f2f7fe
  /* Selected (azul claro) */;
```

#### Background Colors

```css
--p-background: #f1f2f4 /* Page background */ --p-background-hovered: #e4e5e7 /* Sidebar hover */
  --p-background-pressed: #d2d3d5 /* Pressed */ --p-background-selected: #cce0f6 /* Selected */;
```

#### Border Colors

```css
--p-border-neutral-subdued: #e1e3e5 /* Bordes sutiles */ --p-border: #c9cccf /* Bordes normales */
  --p-border-strong: #8c9196 /* Bordes fuertes */ --p-border-subdued: #f1f2f4
  /* Bordes muy sutiles */;
```

#### Text Colors

```css
--p-text: #202223 /* Texto principal */ --p-text-subdued: #6d7175 /* Texto secundario */
  --p-text-disabled: #8c9196 /* Texto disabled */ --p-text-on-primary: #ffffff
  /* Texto sobre verde */;
```

#### Interactive Colors

```css
--p-interactive: #2c6ecb /* Links azul */ --p-interactive-hovered: #1f5199 /* Links hover */
  --p-interactive-pressed: #103262 /* Links pressed */ --p-interactive-disabled: #c9cccf
  /* Links disabled */;
```

#### Status Colors

```css
/* Success */
--p-surface-success: #aee9d1 /* Verde claro */ --p-border-success: #00a47c /* Verde borde */
  --p-text-success: #008060 /* Verde texto */ --p-icon-success: #008060 /* Warning */
  --p-surface-warning: #ffea8a /* Amarillo claro */ --p-border-warning: #ffc453 /* Amarillo borde */
  --p-text-warning: #916a00 /* Marrón texto */ --p-icon-warning: #ffc453 /* Critical/Error */
  --p-surface-critical: #ffc0b3 /* Rojo claro */ --p-border-critical: #d82c0d /* Rojo borde */
  --p-text-critical: #d72c0d /* Rojo texto */ --p-icon-critical: #d82c0d /* Info */
  --p-surface-info: #b3e3ff /* Azul claro */ --p-border-info: #0074d4 /* Azul borde */
  --p-text-info: #003d7a /* Azul oscuro texto */ --p-icon-info: #0074d4;
```

#### Shadow System

```css
--p-shadow-sm:
  0 1px 0 rgba(0, 0, 0, 0.05) --p-shadow-md: 0 2px 1px rgba(0, 0, 0, 0.05) --p-shadow-lg: 0 4px 6px
    rgba(0, 0, 0, 0.1) --p-shadow-xl: 0 8px 16px rgba(0, 0, 0, 0.1) --p-shadow-2xl: 0 12px 24px
    rgba(0, 0, 0, 0.15) --p-shadow-inset: inset 0 1px 0 rgba(0, 0, 0, 0.1) /* Específicas */
    --p-shadow-card: 0 0 0 1px rgba(0, 0, 0, 0.1),
  0 1px 0 rgba(0, 0, 0, 0.05) --p-shadow-button: 0 1px 0 rgba(0, 0, 0, 0.05) --p-shadow-popover: 0
    4px 8px rgba(0, 0, 0, 0.15);
```

### 1.2 Spacing Scale

Shopify usa un sistema base-4:

```css
--p-space-1: 4px /* 0.25rem */ --p-space-2: 8px /* 0.5rem */ --p-space-3: 12px /* 0.75rem */
  --p-space-4: 16px /* 1rem */ --p-space-5: 20px /* 1.25rem */ --p-space-6: 24px /* 1.5rem */
  --p-space-8: 32px /* 2rem */ --p-space-10: 40px /* 2.5rem */ --p-space-12: 48px /* 3rem */
  --p-space-16: 64px /* 4rem */ --p-space-20: 80px /* 5rem */;
```

**Uso común:**

- Padding cards: `16px` (space-4)
- Gap entre cards: `20px` (space-5)
- Margin sections: `24px` (space-6)
- Padding page: `32px` (space-8)

### 1.3 Border Radius

```css
--p-border-radius-sm: 4px /* Pequeño */ --p-border-radius-md: 8px /* Medio - default */
  --p-border-radius-lg: 12px /* Grande */ --p-border-radius-xl: 16px /* Extra grande */
  --p-border-radius-full: 9999px /* Circular */;
```

**Uso:**

- Buttons: 8px
- Cards: 8px
- Inputs: 8px
- Badges: 4px
- Modals: 12px

---

## 2. Layout & Structure

### 2.1 App Frame (Layout Principal)

```
┌─────────────────────────────────────────────┐
│ TopBar (#1a1a1a - oscuro)                   │
│ Logo | Search | Notifications | User        │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │  Page Content                    │
│ (#f7f8fa)│  (#f1f2f4 background)            │
│          │                                  │
│  Nav     │  ┌────────────────────────────┐  │
│  Items   │  │ Page Header                │  │
│          │  ├────────────────────────────┤  │
│          │  │ Card 1                     │  │
│          │  │                            │  │
│          │  ├────────────────────────────┤  │
│          │  │ Card 2                     │  │
│          │  └────────────────────────────┘  │
└──────────┴──────────────────────────────────┘
```

**Dimensiones:**

- TopBar height: `56px`
- Sidebar width: `240px`
- Content max-width: `1200px` (centrado)
- Content padding: `32px`

### 2.2 Grid System

Shopify usa **CSS Grid** para layouts:

```css
/* 2 columnas iguales */
.grid-2-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* 2/3 + 1/3 */
.grid-2-3 {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

/* 3 columnas */
.grid-3-col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
```

### 2.3 Container System

```css
/* Page container */
.Polaris-Page {
  max-width: 100%;
  padding: 32px;
}

/* Narrow container (formularios) */
.Polaris-Page--narrow {
  max-width: 800px;
  margin: 0 auto;
}

/* Full bleed */
.Polaris-Page--fullWidth {
  max-width: none;
}
```

---

## 3. Typography

### 3.1 Font Family

```css
font-family:
  -apple-system, BlinkMacSystemFont, "San Francisco", "Segoe UI", Roboto, "Helvetica Neue",
  sans-serif;
```

**Nota:** Shopify usa **San Francisco** en macOS, **Segoe UI** en Windows. Nosotros usaremos **Inter** que es muy similar.

### 3.2 Type Scale

```css
/* Display */
--p-font-size-display-xl: 42px /* Títulos hero */ --p-font-size-display-lg: 32px
  /* Títulos grandes */ --p-font-size-display-md: 26px /* Títulos medianos */ /* Headings */
  --p-font-size-heading-xl: 24px /* H1 */ --p-font-size-heading-lg: 20px /* H2 */
  --p-font-size-heading-md: 17px /* H3 */ --p-font-size-heading-sm: 15px /* H4 */
  --p-font-size-heading-xs: 13px /* H5, labels importantes */ /* Body */ --p-font-size-body-lg: 15px
  /* Body grande */ --p-font-size-body-md: 14px /* Body normal */ --p-font-size-body-sm: 13px
  /* Body pequeño */ --p-font-size-body-xs: 12px /* Captions, helper text */;
```

### 3.3 Font Weights

```css
--p-font-weight-regular: 400 /* Texto normal */ --p-font-weight-medium: 500 /* Labels, subtítulos */
  --p-font-weight-semibold: 600 /* Headings */ --p-font-weight-bold: 700 /* Énfasis fuerte */;
```

### 3.4 Line Heights

```css
--p-line-height-tight: 1.2 /* Headings */ --p-line-height-normal: 1.5 /* Body text */
  --p-line-height-relaxed: 1.6 /* Textos largos */;
```

### 3.5 Estilos de Texto Comunes

```tsx
/* Page title */
<h1 className="text-2xl font-semibold text-[#202223]">
  Órdenes de compra
</h1>

/* Card title */
<h2 className="text-base font-medium text-[#202223]">
  Detalles de la orden
</h2>

/* Section heading */
<h3 className="text-sm font-semibold text-[#202223] uppercase tracking-wide">
  Información general
</h3>

/* Body text */
<p className="text-sm text-[#202223]">
  Contenido regular
</p>

/* Subdued text */
<p className="text-sm text-[#6d7175]">
  Texto secundario
</p>

/* Caption */
<span className="text-xs text-[#6d7175]">
  Helper text o metadata
</span>
```

---

## 4. Componentes Base

### 4.1 Button

**Variantes:**

#### Primary

```tsx
<button
  className="
  bg-[#008060] text-white
  px-4 py-2 rounded-lg
  font-medium text-sm
  hover:bg-[#006e52]
  active:bg-[#005c46]
  shadow-[0_1px_0_rgba(0,0,0,0.05)]
  transition-colors
"
>
  Guardar
</button>
```

#### Secondary (Outline)

```tsx
<button
  className="
  bg-white text-[#202223]
  border border-[#c9cccf]
  px-4 py-2 rounded-lg
  font-medium text-sm
  hover:bg-[#f6f6f7]
  active:bg-[#f1f2f4]
  shadow-[0_1px_0_rgba(0,0,0,0.05)]
"
>
  Cancelar
</button>
```

#### Plain (Sin fondo)

```tsx
<button
  className="
  text-[#2c6ecb]
  px-2 py-1
  font-medium text-sm
  hover:underline
  hover:text-[#1f5199]
"
>
  Ver más
</button>
```

#### Destructive

```tsx
<button
  className="
  bg-[#d82c0d] text-white
  px-4 py-2 rounded-lg
  font-medium text-sm
  hover:bg-[#b92107]
  shadow-[0_1px_0_rgba(0,0,0,0.05)]
"
>
  Eliminar
</button>
```

**Tamaños:**

- Small: `px-3 py-1.5 text-xs`
- Medium: `px-4 py-2 text-sm` (default)
- Large: `px-5 py-3 text-base`

**Estados:**

- Disabled: `opacity-50 cursor-not-allowed`
- Loading: Spinner interno + `opacity-80`

### 4.2 Badge

```tsx
/* Success */
<span className="
  inline-flex items-center gap-1
  px-2 py-0.5 rounded
  bg-[#aee9d1] text-[#008060]
  text-xs font-medium
">
  <span className="w-1.5 h-1.5 rounded-full bg-[#008060]" />
  Pagado
</span>

/* Warning */
<span className="
  inline-flex items-center gap-1
  px-2 py-0.5 rounded
  bg-[#ffea8a] text-[#916a00]
  text-xs font-medium
">
  <span className="w-1.5 h-1.5 rounded-full bg-[#ffc453]" />
  Pendiente
</span>

/* Critical */
<span className="
  inline-flex items-center gap-1
  px-2 py-0.5 rounded
  bg-[#ffc0b3] text-[#d72c0d]
  text-xs font-medium
">
  <span className="w-1.5 h-1.5 rounded-full bg-[#d82c0d]" />
  Cancelado
</span>

/* Info */
<span className="
  inline-flex items-center gap-1
  px-2 py-0.5 rounded
  bg-[#b3e3ff] text-[#003d7a]
  text-xs font-medium
">
  <span className="w-1.5 h-1.5 rounded-full bg-[#0074d4]" />
  En proceso
</span>

/* Neutral */
<span className="
  px-2 py-0.5 rounded
  bg-[#f1f2f4] text-[#202223]
  text-xs font-medium
">
  Borrador
</span>
```

**Variante Progress:**

```tsx
<span
  className="
  inline-flex items-center gap-1.5
  px-2 py-1 rounded
  bg-white border border-[#e1e3e5]
  text-xs
"
>
  <span className="text-[#6d7175]">2 de 5 completados</span>
  <div className="w-12 h-1 bg-[#e1e3e5] rounded-full overflow-hidden">
    <div className="h-full bg-[#008060]" style={{ width: "40%" }} />
  </div>
</span>
```

### 4.3 Card

```tsx
<div
  className="
  bg-white
  rounded-lg
  shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_1px_0_rgba(0,0,0,0.05)]
"
>
  {/* Header (opcional) */}
  <div
    className="
    px-5 py-4
    border-b border-[#e1e3e5]
  "
  >
    <h2 className="text-base font-medium text-[#202223]">Título de la card</h2>
  </div>

  {/* Content */}
  <div className="px-5 py-4">Contenido</div>

  {/* Footer subdued (opcional) */}
  <div
    className="
    px-5 py-4
    bg-[#f6f6f7]
    border-t border-[#e1e3e5]
    rounded-b-lg
  "
  >
    Footer con fondo gris
  </div>
</div>
```

**Variantes:**

- **Subdued**: `bg-[#f6f6f7]` en lugar de blanco
- **No shadow**: Sin `shadow-` para cards anidadas
- **Sectioned**: Múltiples secciones con `border-b`

### 4.4 Input / TextField

```tsx
<div className="space-y-1">
  {/* Label */}
  <label className="block text-sm font-medium text-[#202223]">Nombre del producto</label>

  {/* Input */}
  <input
    type="text"
    className="
      w-full px-3 py-2
      bg-white
      border border-[#c9cccf] rounded-lg
      text-sm text-[#202223]
      placeholder:text-[#8c9196]
      focus:outline-none
      focus:ring-2 focus:ring-[#0074d4]
      focus:border-transparent
      disabled:bg-[#fafbfb]
      disabled:text-[#8c9196]
      disabled:cursor-not-allowed
    "
    placeholder="Ej: iPhone 15 Pro"
  />

  {/* Helper text */}
  <p className="text-xs text-[#6d7175]">Nombre que se mostrará en el sistema</p>
</div>
```

**Estado de error:**

```tsx
<div className="space-y-1">
  <label className="block text-sm font-medium text-[#202223]">Email</label>

  <input
    type="email"
    className="
      w-full px-3 py-2
      bg-white
      border-2 border-[#d82c0d] rounded-lg
      text-sm text-[#202223]
      focus:outline-none
      focus:ring-2 focus:ring-[#d82c0d]
    "
  />

  <p className="text-xs text-[#d72c0d] flex items-center gap-1">
    <svg className="w-4 h-4" /* error icon */ />
    Email inválido
  </p>
</div>
```

### 4.5 Select / Dropdown

```tsx
<div className="space-y-1">
  <label className="block text-sm font-medium text-[#202223]">Estado</label>

  <select
    className="
    w-full px-3 py-2
    bg-white
    border border-[#c9cccf] rounded-lg
    text-sm text-[#202223]
    focus:outline-none
    focus:ring-2 focus:ring-[#0074d4]
    focus:border-transparent
    cursor-pointer
  "
  >
    <option>Seleccionar...</option>
    <option>Activo</option>
    <option>Inactivo</option>
  </select>
</div>
```

### 4.6 Checkbox

```tsx
<label className="inline-flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    className="
      w-4 h-4
      rounded
      border-[#c9cccf]
      text-[#008060]
      focus:ring-2 focus:ring-[#0074d4]
      focus:ring-offset-0
    "
  />
  <span className="text-sm text-[#202223]">Acepto los términos</span>
</label>
```

### 4.7 Radio

```tsx
<div className="space-y-2">
  <label className="flex items-center gap-2 cursor-pointer">
    <input
      type="radio"
      name="payment"
      className="
        w-4 h-4
        border-[#c9cccf]
        text-[#008060]
        focus:ring-2 focus:ring-[#0074d4]
      "
    />
    <span className="text-sm text-[#202223]">Transferencia</span>
  </label>

  <label className="flex items-center gap-2 cursor-pointer">
    <input
      type="radio"
      name="payment"
      className="
        w-4 h-4
        border-[#c9cccf]
        text-[#008060]
        focus:ring-2 focus:ring-[#0074d4]
      "
    />
    <span className="text-sm text-[#202223]">Efectivo</span>
  </label>
</div>
```

---

## 5. Componentes Complejos

### 5.1 Page Header

```tsx
<div className="mb-6">
  {/* Breadcrumbs */}
  <nav className="mb-2">
    <ol className="flex items-center gap-2 text-sm">
      <li>
        <a href="#" className="text-[#2c6ecb] hover:underline">
          Órdenes
        </a>
      </li>
      <li className="text-[#8c9196]">/</li>
      <li className="text-[#202223]">#1234</li>
    </ol>
  </nav>

  {/* Header */}
  <div className="flex items-start justify-between">
    <div>
      <h1 className="text-2xl font-semibold text-[#202223] mb-1">Orden #1234</h1>
      <p className="text-sm text-[#6d7175]">Creada el 15 de enero de 2024</p>
    </div>

    {/* Actions */}
    <div className="flex items-center gap-2">
      <button className="px-4 py-2 border border-[#c9cccf] rounded-lg text-sm font-medium hover:bg-[#f6f6f7]">
        Exportar
      </button>
      <button className="px-4 py-2 bg-[#008060] text-white rounded-lg text-sm font-medium hover:bg-[#006e52]">
        Guardar
      </button>
    </div>
  </div>
</div>
```

### 5.2 Banner (Alert/Notification)

```tsx
/* Success Banner */
<div className="
  flex items-start gap-3
  p-4 rounded-lg
  bg-[#aee9d1]
  border border-[#00a47c]
">
  <svg className="w-5 h-5 text-[#008060] flex-shrink-0" /* checkmark icon */ />
  <div className="flex-1">
    <p className="text-sm font-medium text-[#008060] mb-1">
      Orden creada correctamente
    </p>
    <p className="text-sm text-[#202223]">
      La orden #1234 se creó y se envió notificación al proveedor.
    </p>
  </div>
  <button className="text-[#008060] hover:text-[#006e52]">
    <svg className="w-5 h-5" /* close icon */ />
  </button>
</div>

/* Info Banner */
<div className="
  flex items-start gap-3
  p-4 rounded-lg
  bg-[#b3e3ff]
  border border-[#0074d4]
">
  <svg className="w-5 h-5 text-[#0074d4] flex-shrink-0" /* info icon */ />
  <div className="flex-1">
    <p className="text-sm font-medium text-[#003d7a] mb-1">
      Recordatorio
    </p>
    <p className="text-sm text-[#202223]">
      Esta orden requiere aprobación antes de procesar.
    </p>
  </div>
</div>

/* Warning Banner */
<div className="
  flex items-start gap-3
  p-4 rounded-lg
  bg-[#ffea8a]
  border border-[#ffc453]
">
  <svg className="w-5 h-5 text-[#916a00] flex-shrink-0" /* warning icon */ />
  <div className="flex-1">
    <p className="text-sm font-medium text-[#916a00] mb-1">
      Atención
    </p>
    <p className="text-sm text-[#202223]">
      El inventario de este producto está bajo (5 unidades).
    </p>
  </div>
</div>

/* Critical Banner */
<div className="
  flex items-start gap-3
  p-4 rounded-lg
  bg-[#ffc0b3]
  border border-[#d82c0d]
">
  <svg className="w-5 h-5 text-[#d72c0d] flex-shrink-0" /* error icon */ />
  <div className="flex-1">
    <p className="text-sm font-medium text-[#d72c0d] mb-1">
      Error al procesar pago
    </p>
    <p className="text-sm text-[#202223]">
      La tarjeta fue rechazada. Intenta con otro método de pago.
    </p>
  </div>
</div>
```

### 5.3 Empty State

```tsx
<div
  className="
  py-16 px-8
  text-center
  bg-white
  rounded-lg
  border-2 border-dashed border-[#c9cccf]
"
>
  {/* Ilustración o ícono grande */}
  <div className="w-20 h-20 mx-auto mb-4 text-[#8c9196]">
    <svg /* empty icon */ />
  </div>

  <h3 className="text-lg font-medium text-[#202223] mb-2">No hay órdenes todavía</h3>

  <p className="text-sm text-[#6d7175] mb-6 max-w-md mx-auto">
    Crea tu primera orden de compra para empezar a gestionar tus importaciones.
  </p>

  <button
    className="
    px-4 py-2
    bg-[#008060] text-white
    rounded-lg font-medium text-sm
    hover:bg-[#006e52]
  "
  >
    Crear orden
  </button>
</div>
```

### 5.4 Modal / Dialog

```tsx
/* Overlay */
<div className="fixed inset-0 bg-black/50 z-40" />

/* Modal */
<div className="
  fixed inset-0 z-50
  flex items-center justify-center
  p-4
">
  <div className="
    bg-white rounded-xl
    shadow-2xl
    max-w-lg w-full
    max-h-[90vh]
    overflow-hidden
    flex flex-col
  ">
    {/* Header */}
    <div className="
      px-6 py-4
      border-b border-[#e1e3e5]
      flex items-center justify-between
    ">
      <h2 className="text-lg font-semibold text-[#202223]">
        Confirmar eliminación
      </h2>
      <button className="text-[#6d7175] hover:text-[#202223]">
        <svg className="w-5 h-5" /* close icon */ />
      </button>
    </div>

    {/* Content */}
    <div className="px-6 py-6 overflow-y-auto">
      <p className="text-sm text-[#202223]">
        ¿Estás seguro que deseas eliminar esta orden?
        Esta acción no se puede deshacer.
      </p>
    </div>

    {/* Footer */}
    <div className="
      px-6 py-4
      bg-[#f6f6f7]
      border-t border-[#e1e3e5]
      flex items-center justify-end gap-3
    ">
      <button className="
        px-4 py-2
        border border-[#c9cccf]
        rounded-lg text-sm font-medium
        hover:bg-white
      ">
        Cancelar
      </button>
      <button className="
        px-4 py-2
        bg-[#d82c0d] text-white
        rounded-lg text-sm font-medium
        hover:bg-[#b92107]
      ">
        Eliminar
      </button>
    </div>
  </div>
</div>
```

### 5.5 Tabs

```tsx
<div>
  {/* Tab List */}
  <div className="border-b border-[#e1e3e5]">
    <nav className="flex gap-6">
      <button
        className="
        pb-3 px-1
        text-sm font-medium
        text-[#202223]
        border-b-2 border-[#202223]
      "
      >
        General
      </button>

      <button
        className="
        pb-3 px-1
        text-sm font-medium
        text-[#6d7175]
        border-b-2 border-transparent
        hover:text-[#202223]
        hover:border-[#c9cccf]
      "
      >
        Productos
      </button>

      <button
        className="
        pb-3 px-1
        text-sm font-medium
        text-[#6d7175]
        border-b-2 border-transparent
        hover:text-[#202223]
        hover:border-[#c9cccf]
      "
      >
        Pagos
      </button>
    </nav>
  </div>

  {/* Tab Panel */}
  <div className="pt-6">Contenido del tab activo</div>
</div>
```

### 5.6 Tooltip

```tsx
<div className="relative group">
  <button className="text-[#2c6ecb]">Hover me</button>

  {/* Tooltip */}
  <div
    className="
    absolute bottom-full left-1/2 -translate-x-1/2 mb-2
    px-3 py-2
    bg-[#202223] text-white
    text-xs rounded
    whitespace-nowrap
    opacity-0 group-hover:opacity-100
    pointer-events-none
    transition-opacity
  "
  >
    Este es un tooltip
    {/* Arrow */}
    <div
      className="
      absolute top-full left-1/2 -translate-x-1/2
      w-0 h-0
      border-4 border-transparent
      border-t-[#202223]
    "
    />
  </div>
</div>
```

---

## 6. Patrones de Navegación

### 6.1 Top Bar

```tsx
<header
  className="
  h-14
  bg-[#1a1a1a]
  border-b border-[#303030]
  flex items-center justify-between
  px-4
"
>
  {/* Left: Logo + Search */}
  <div className="flex items-center gap-4 flex-1">
    <div className="text-white font-bold text-lg">Curet</div>

    <div className="max-w-md w-full">
      <input
        type="search"
        placeholder="Buscar..."
        className="
          w-full px-3 py-1.5
          bg-[#303030]
          border border-[#404040]
          rounded-lg
          text-sm text-white
          placeholder:text-[#8c9196]
          focus:bg-[#404040]
          focus:border-[#606060]
          focus:outline-none
        "
      />
    </div>
  </div>

  {/* Right: Notifications + User */}
  <div className="flex items-center gap-3">
    {/* Notifications */}
    <button
      className="
      relative
      p-2 text-[#e3e3e5]
      hover:text-white
      hover:bg-[#303030]
      rounded-lg
    "
    >
      <svg className="w-5 h-5" /* bell icon */ />
      <span
        className="
        absolute top-1 right-1
        w-2 h-2 bg-[#d82c0d]
        rounded-full
      "
      />
    </button>

    {/* User menu */}
    <button
      className="
      flex items-center gap-2
      px-2 py-1
      text-[#e3e3e5]
      hover:bg-[#303030]
      rounded-lg
    "
    >
      <div
        className="
        w-7 h-7 rounded-full
        bg-[#008060]
        flex items-center justify-center
        text-white text-xs font-medium
      "
      >
        RP
      </div>
      <span className="text-sm">Ronaldo</span>
      <svg className="w-4 h-4" /* chevron down */ />
    </button>
  </div>
</header>
```

### 6.2 Sidebar Navigation

```tsx
<aside
  className="
  w-60
  bg-[#f7f8fa]
  border-r border-[#e1e3e5]
  h-screen
  overflow-y-auto
"
>
  <nav className="p-3 space-y-1">
    {/* Section label (opcional) */}
    <div
      className="
      px-3 py-2
      text-xs font-semibold
      text-[#6d7175]
      uppercase tracking-wide
    "
    >
      Principal
    </div>

    {/* Active item */}
    <a
      href="#"
      className="
      flex items-center gap-3
      px-3 py-2
      bg-[#e4e5e7]
      text-[#008060]
      rounded-lg
      font-medium text-sm
    "
    >
      <svg className="w-5 h-5 text-[#008060]" /* icon */ />
      <span>Dashboard</span>
    </a>

    {/* Normal item */}
    <a
      href="#"
      className="
      flex items-center gap-3
      px-3 py-2
      text-[#202223]
      rounded-lg
      text-sm
      hover:bg-[#f1f2f4]
    "
    >
      <svg className="w-5 h-5 text-[#6d7175]" /* icon */ />
      <span>Órdenes</span>
      {/* Badge opcional */}
      <span className="ml-auto px-1.5 py-0.5 bg-[#e1e3e5] text-[#202223] text-xs rounded">12</span>
    </a>

    <a
      href="#"
      className="
      flex items-center gap-3
      px-3 py-2
      text-[#202223]
      rounded-lg
      text-sm
      hover:bg-[#f1f2f4]
    "
    >
      <svg className="w-5 h-5 text-[#6d7175]" /* icon */ />
      <span>Pagos</span>
    </a>

    {/* Divider */}
    <div className="h-px bg-[#e1e3e5] my-2" />

    {/* Section label */}
    <div
      className="
      px-3 py-2
      text-xs font-semibold
      text-[#6d7175]
      uppercase tracking-wide
    "
    >
      Configuración
    </div>

    <a
      href="#"
      className="
      flex items-center gap-3
      px-3 py-2
      text-[#202223]
      rounded-lg
      text-sm
      hover:bg-[#f1f2f4]
    "
    >
      <svg className="w-5 h-5 text-[#6d7175]" /* icon */ />
      <span>Ajustes</span>
    </a>
  </nav>
</aside>
```

---

## 7. Patrones de Data Display

### 7.1 Data Table (Resource List)

```tsx
<div className="bg-white rounded-lg shadow-sm overflow-hidden">
  {/* Table header con bulk actions (opcional) */}
  <div className="px-5 py-3 border-b border-[#e1e3e5] flex items-center justify-between">
    <div className="flex items-center gap-2">
      <input type="checkbox" className="w-4 h-4" />
      <span className="text-sm text-[#6d7175]">3 seleccionados</span>
    </div>
    <div className="flex items-center gap-2">
      <button className="px-3 py-1.5 text-sm hover:bg-[#f6f6f7] rounded">Exportar</button>
      <button className="px-3 py-1.5 text-sm text-[#d72c0d] hover:bg-[#ffc0b3] rounded">
        Eliminar
      </button>
    </div>
  </div>

  {/* Table */}
  <table className="w-full">
    <thead className="bg-[#f6f6f7] border-b border-[#e1e3e5]">
      <tr>
        <th className="px-5 py-3 text-left">
          <input type="checkbox" className="w-4 h-4" />
        </th>
        <th className="px-5 py-3 text-left text-xs font-semibold text-[#202223] uppercase tracking-wide">
          Orden
        </th>
        <th className="px-5 py-3 text-left text-xs font-semibold text-[#202223] uppercase tracking-wide">
          Proveedor
        </th>
        <th className="px-5 py-3 text-left text-xs font-semibold text-[#202223] uppercase tracking-wide">
          Monto
        </th>
        <th className="px-5 py-3 text-left text-xs font-semibold text-[#202223] uppercase tracking-wide">
          Estado
        </th>
        <th className="px-5 py-3"></th>
      </tr>
    </thead>
    <tbody className="divide-y divide-[#e1e3e5]">
      <tr className="hover:bg-[#f6f6f7] cursor-pointer">
        <td className="px-5 py-4">
          <input type="checkbox" className="w-4 h-4" />
        </td>
        <td className="px-5 py-4">
          <a href="#" className="text-sm font-medium text-[#2c6ecb] hover:underline">
            #1234
          </a>
        </td>
        <td className="px-5 py-4 text-sm text-[#202223]">Proveedor ABC</td>
        <td className="px-5 py-4 text-sm font-mono text-[#202223]">RD$ 125,000</td>
        <td className="px-5 py-4">
          <span
            className="
            inline-flex items-center gap-1
            px-2 py-0.5 rounded
            bg-[#aee9d1] text-[#008060]
            text-xs font-medium
          "
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#008060]" />
            Pagado
          </span>
        </td>
        <td className="px-5 py-4 text-right">
          <button className="text-[#6d7175] hover:text-[#202223]">
            <svg className="w-5 h-5" /* more icon */ />
          </button>
        </td>
      </tr>

      {/* Más rows... */}
    </tbody>
  </table>

  {/* Pagination */}
  <div className="px-5 py-3 border-t border-[#e1e3e5] flex items-center justify-between">
    <div className="text-sm text-[#6d7175]">Mostrando 1-20 de 145</div>
    <div className="flex items-center gap-2">
      <button
        className="
        px-3 py-1.5
        border border-[#c9cccf]
        rounded-lg text-sm
        hover:bg-[#f6f6f7]
        disabled:opacity-50
      "
        disabled
      >
        Anterior
      </button>
      <button
        className="
        px-3 py-1.5
        border border-[#c9cccf]
        rounded-lg text-sm
        hover:bg-[#f6f6f7]
      "
      >
        Siguiente
      </button>
    </div>
  </div>
</div>
```

### 7.2 Stats Grid (KPIs)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
  <div className="bg-white p-5 rounded-lg shadow-sm">
    <div className="text-xs font-medium text-[#6d7175] mb-1">INVERSIÓN TOTAL</div>
    <div className="text-2xl font-semibold text-[#202223] mb-2">RD$ 1,245,000</div>
    <div className="flex items-center gap-1 text-xs">
      <svg className="w-3 h-3 text-[#008060]" /* arrow up */ />
      <span className="text-[#008060] font-medium">12%</span>
      <span className="text-[#6d7175]">vs mes anterior</span>
    </div>
  </div>

  <div className="bg-white p-5 rounded-lg shadow-sm">
    <div className="text-xs font-medium text-[#6d7175] mb-1">UNIDADES ORDENADAS</div>
    <div className="text-2xl font-semibold text-[#202223] mb-2">2,345</div>
    <div className="flex items-center gap-1 text-xs">
      <svg className="w-3 h-3 text-[#d82c0d]" /* arrow down */ />
      <span className="text-[#d82c0d] font-medium">5%</span>
      <span className="text-[#6d7175]">vs mes anterior</span>
    </div>
  </div>

  {/* Más KPIs... */}
</div>
```

### 7.3 Progress Bar

```tsx
<div>
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm font-medium text-[#202223]">Progreso de la orden</span>
    <span className="text-sm text-[#6d7175]">75%</span>
  </div>

  <div className="h-2 bg-[#e1e3e5] rounded-full overflow-hidden">
    <div className="h-full bg-[#008060] rounded-full transition-all" style={{ width: "75%" }} />
  </div>

  <div className="mt-2 text-xs text-[#6d7175]">3 de 4 pasos completados</div>
</div>
```

---

## 8. Patrones de Forms

### 8.1 Form Layout

```tsx
<form className="space-y-6">
  {/* Card con sección */}
  <div className="bg-white rounded-lg shadow-sm">
    <div className="px-5 py-4 border-b border-[#e1e3e5]">
      <h2 className="text-base font-medium text-[#202223]">Información general</h2>
    </div>

    <div className="px-5 py-5 space-y-4">
      {/* Campo */}
      <div>
        <label className="block text-sm font-medium text-[#202223] mb-1">Nombre del producto</label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-[#c9cccf] rounded-lg text-sm"
        />
      </div>

      {/* 2 columnas */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#202223] mb-1">SKU</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-[#c9cccf] rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#202223] mb-1">Cantidad</label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-[#c9cccf] rounded-lg text-sm"
          />
        </div>
      </div>
    </div>
  </div>

  {/* Footer con acciones */}
  <div className="flex items-center justify-end gap-3">
    <button
      type="button"
      className="px-4 py-2 border border-[#c9cccf] rounded-lg text-sm font-medium hover:bg-[#f6f6f7]"
    >
      Cancelar
    </button>
    <button
      type="submit"
      className="px-4 py-2 bg-[#008060] text-white rounded-lg text-sm font-medium hover:bg-[#006e52]"
    >
      Guardar
    </button>
  </div>
</form>
```

### 8.2 Inline Editing

```tsx
<div className="flex items-center gap-2 group">
  <span className="text-sm text-[#202223]">Proveedor ABC</span>
  <button
    className="
    opacity-0 group-hover:opacity-100
    text-[#6d7175] hover:text-[#202223]
    transition-opacity
  "
  >
    <svg className="w-4 h-4" /* edit icon */ />
  </button>
</div>
```

---

## 9. Feedback & Messaging

### 9.1 Loading States

**Spinner:**

```tsx
<div className="flex items-center justify-center p-8">
  <div
    className="
    w-8 h-8
    border-4 border-[#e1e3e5]
    border-t-[#008060]
    rounded-full
    animate-spin
  "
  />
</div>
```

**Skeleton:**

```tsx
<div className="space-y-3 animate-pulse">
  <div className="h-4 bg-[#e1e3e5] rounded w-3/4" />
  <div className="h-4 bg-[#e1e3e5] rounded" />
  <div className="h-4 bg-[#e1e3e5] rounded w-5/6" />
</div>
```

**Button loading:**

```tsx
<button
  disabled
  className="
    px-4 py-2
    bg-[#008060] text-white
    rounded-lg text-sm font-medium
    opacity-80
    flex items-center gap-2
  "
>
  <div
    className="
    w-4 h-4
    border-2 border-white/30
    border-t-white
    rounded-full
    animate-spin
  "
  />
  Guardando...
</button>
```

### 9.2 Toast Notifications

```tsx
<div
  className="
  fixed top-4 right-4
  bg-[#202223] text-white
  px-4 py-3 rounded-lg
  shadow-2xl
  flex items-center gap-3
  max-w-md
  animate-slide-in
"
>
  <svg className="w-5 h-5 text-[#00d96f]" /* checkmark */ />
  <p className="text-sm font-medium flex-1">Orden guardada correctamente</p>
  <button className="text-white/70 hover:text-white">
    <svg className="w-4 h-4" /* close */ />
  </button>
</div>
```

---

## 10. Animations & Transitions

Shopify usa animaciones **muy sutiles**:

```css
/* Durations */
--p-duration-fast: 100ms --p-duration-base: 200ms --p-duration-slow: 300ms /* Easings */
  --p-ease-in: cubic-bezier(0.5, 0, 1, 1) --p-ease-out: cubic-bezier(0, 0, 0.5, 1)
  --p-ease-in-out: cubic-bezier(0.5, 0, 0.5, 1) /* Uso común */ transition: all 200ms
  cubic-bezier(0, 0, 0.5, 1);
```

**Ejemplos:**

- Hover buttons: `transition-colors duration-200`
- Modal fade: `transition-opacity duration-300`
- Slide in: `transition-transform duration-200`

**NO usar:**

- ❌ Animaciones exageradas (>500ms)
- ❌ Bounces, springs
- ❌ Rotaciones o scales dramáticos

---

## 11. Iconografía

Shopify usa **iconos de línea simples**, muy similares a:

- Lucide (recomendado ✅)
- Heroicons Outline
- Feather Icons

**Características:**

- Stroke width: 1.5-2px
- Tamaño: 20x20px (default), 16x16 (small), 24x24 (large)
- Colores: Heredan del text color

**Iconos comunes:**

- Home, Package, DollarSign, FileText
- Settings, User, Bell, Search
- ChevronDown, ChevronRight, X, Check
- AlertCircle, Info, AlertTriangle

---

## 12. Responsive Behavior

### Breakpoints

```css
/* Mobile first */
sm: 640px   /* Tablets small */
md: 768px   /* Tablets */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Mobile adaptations

- **Sidebar**: Se convierte en drawer (overlay)
- **Top bar**: Logo + hamburger menu + user
- **Tables**: Scroll horizontal o cards apiladas
- **Grid 2-col**: Se convierte en 1 columna
- **Padding**: Reducir de 32px a 16px

---

## 📋 Checklist de Implementación

### Fase 1: Foundation

- [ ] Colores Shopify en Tailwind config
- [ ] Fuente Inter cargada
- [ ] Spacing scale configurado
- [ ] Shadow system configurado

### Fase 2: Layout

- [ ] Top Bar oscuro
- [ ] Sidebar claro con navegación
- [ ] Page layout structure
- [ ] Grid system

### Fase 3: Componentes Base (Prioridad)

- [ ] Button (4 variantes)
- [ ] Badge (5 estados)
- [ ] Card
- [ ] Input/TextField
- [ ] Select
- [ ] Checkbox/Radio

### Fase 4: Componentes Complejos

- [ ] Page Header con breadcrumbs
- [ ] Banner (4 estados)
- [ ] Empty State
- [ ] Modal
- [ ] Tabs
- [ ] Tooltip

### Fase 5: Data Display

- [ ] Data Table (Resource List)
- [ ] Stats Grid (KPIs)
- [ ] Progress Bar
- [ ] Pagination

### Fase 6: Forms

- [ ] Form layout patterns
- [ ] Validation states
- [ ] Inline editing

### Fase 7: Feedback

- [ ] Loading (spinner, skeleton)
- [ ] Toast notifications
- [ ] Error states

### Fase 8: Polish

- [ ] Transitions configuradas
- [ ] Iconos Lucide integrados
- [ ] Responsive behaviors
- [ ] Documentación componentes

---

## 🎯 Resultado Final

Al implementar este sistema, tendrás:

✅ **Design System completo** tipo Shopify
✅ **Componentes reutilizables** listos para monorepo
✅ **Estilo corporativo profesional**
✅ **Código limpio y mantenible**
✅ **Base para escalar** a múltiples apps

---

**Última actualización:** 2025-11-18
**Mantenedor:** Claude Code
**Referencia:** Shopify Admin 2024
