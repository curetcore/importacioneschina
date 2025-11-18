# 📋 Configuraciones del Monorepo - Archivos de Referencia

> **Nota:** Este documento contiene todos los archivos de configuración necesarios para el monorepo.
> Copia y pega según necesites durante la implementación del PLAN-MONOREPO.md

---

## 📁 Estructura de Archivos

```
curet-monorepo/
├── package.json              # ← Config #1
├── pnpm-workspace.yaml       # ← Config #2
├── turbo.json               # ← Config #3
├── .gitignore               # ← Config #4
├── tsconfig.json            # ← Config #5
├── README.md                # ← Config #6
├── apps/
│   └── importaciones/
│       └── package.json     # ← Config #7 (modificado)
└── packages/
    ├── ui/
    │   ├── package.json     # ← Config #8
    │   ├── tsconfig.json    # ← Config #9
    │   └── tailwind.config.js  # ← Config #10
    ├── utils/
    │   └── package.json     # ← Config #11
    └── config/
        └── package.json     # ← Config #12
```

---

## Config #1: `package.json` (raíz del monorepo)

**Ubicación:** `/curet-monorepo/package.json`

```json
{
  "name": "curet-monorepo",
  "version": "1.0.0",
  "private": true,
  "description": "Monorepo del ecosistema Curet - Design System y aplicaciones",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:watch": "turbo run test:watch",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint --fix",
    "clean": "turbo run clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "type-check": "turbo run type-check"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.1",
    "prettier": "^3.2.5",
    "turbo": "^2.0.0",
    "typescript": "^5.5.4"
  },
  "packageManager": "pnpm@8.15.0",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

---

## Config #2: `pnpm-workspace.yaml`

**Ubicación:** `/curet-monorepo/pnpm-workspace.yaml`

```yaml
packages:
  # Todas las aplicaciones
  - "apps/*"

  # Todos los paquetes compartidos
  - "packages/*"

  # Excluir node_modules de los workspaces
  - "!**/node_modules/**"
```

---

## Config #3: `turbo.json`

**Ubicación:** `/curet-monorepo/turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local", "**/.env"],
  "globalEnv": ["NODE_ENV", "VERCEL", "CI"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**", "build/**"],
      "env": ["DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "test:watch": {
      "cache": false,
      "persistent": true
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

**Explicación de configuración:**

- `dependsOn: ["^build"]` → Ejecuta build de dependencias primero
- `outputs` → Archivos a cachear (builds, coverage)
- `cache: false` → No cachear dev/watch (siempre fresh)
- `persistent: true` → Mantener proceso vivo (dev servers)

---

## Config #4: `.gitignore` (raíz)

**Ubicación:** `/curet-monorepo/.gitignore`

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
*.lcov

# Next.js
.next/
out/
build/
dist/

# Production
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Vercel
.vercel

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Turbo
.turbo

# OS
.DS_Store
*.pem

# Debug
*.tsbuildinfo

# IDE
.vscode/
.idea/
*.swp
*.swo

# Prisma
prisma/dev.db
prisma/dev.db-journal

# Backups
*.backup
*.bak
```

---

## Config #5: `tsconfig.json` (raíz)

**Ubicación:** `/curet-monorepo/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "jsx": "preserve",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "incremental": true
  },
  "exclude": ["node_modules", "dist", "build", ".next", ".turbo"]
}
```

---

## Config #6: `README.md` (raíz)

**Ubicación:** `/curet-monorepo/README.md`

```markdown
# Curet Monorepo

Monorepo del ecosistema Curet con Design System compartido y múltiples aplicaciones.

## 🏗️ Estructura
```

curet-monorepo/
├── apps/ # Aplicaciones Next.js
│ ├── importaciones/ # Sistema de importaciones
│ ├── inventario/ # Gestión de inventario (futuro)
│ └── facturacion/ # Sistema de facturación (futuro)
│
├── packages/ # Paquetes compartidos
│ ├── ui/ # Componentes UI + Design System
│ ├── utils/ # Utilidades compartidas
│ ├── database/ # Prisma schemas (si aplica)
│ └── config/ # Configuraciones compartidas
│
└── docs/ # Documentación

````

## 🚀 Inicio Rápido

### Requisitos

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Instalación

```bash
# Instalar pnpm globalmente (si no lo tienes)
npm install -g pnpm

# Clonar repositorio
git clone git@github.com:tu-usuario/curet-monorepo.git
cd curet-monorepo

# Instalar todas las dependencias
pnpm install
````

### Desarrollo

```bash
# Iniciar todas las apps en modo desarrollo
pnpm dev

# Iniciar solo una app específica
pnpm dev --filter=@curet/importaciones

# Build de todo
pnpm build

# Tests
pnpm test

# Linter
pnpm lint
```

## 📦 Paquetes

### `@curet/ui`

Design System compartido con componentes React + Tailwind CSS.

```tsx
import { Button, Card, DataTable } from "@curet/ui/components"
import { useToast, useDebounce } from "@curet/ui/hooks"
import { formatCurrency, formatDate } from "@curet/ui/utils"
```

### `@curet/utils`

Utilidades compartidas (currency, dates, export, etc.)

```tsx
import { distributeCurrency, formatDateRelative } from "@curet/utils"
```

### `@curet/config`

Configuraciones compartidas (ESLint, TypeScript, Tailwind)

```js
// eslint.config.js
module.exports = require("@curet/config/eslint")
```

## 🏃 Scripts Disponibles

| Comando       | Descripción                        |
| ------------- | ---------------------------------- |
| `pnpm dev`    | Inicia todos los dev servers       |
| `pnpm build`  | Build de todos los paquetes y apps |
| `pnpm test`   | Ejecuta todos los tests            |
| `pnpm lint`   | Ejecuta linter en todo el monorepo |
| `pnpm clean`  | Limpia builds y node_modules       |
| `pnpm format` | Formatea código con Prettier       |

## 📖 Documentación

- [Plan de Monorepo](./docs/PLAN-MONOREPO.md) - Plan completo de migración
- [Configuraciones](./docs/MONOREPO-CONFIGS.md) - Archivos de config
- [Design System](./packages/ui/README.md) - Guía del Design System
- [Crear Nueva App](./docs/CREAR-NUEVA-APP.md) - Cómo crear apps (crear en FASE 8)

## 🛠️ Tech Stack

- **Build System:** Turborepo
- **Package Manager:** pnpm
- **Framework:** Next.js 14 + App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL + Prisma
- **Testing:** Jest + React Testing Library

## 📝 Crear Nueva App

```bash
# 1. Crear app base
cd apps
pnpx create-next-app@latest mi-nueva-app --typescript --tailwind --app

# 2. Actualizar package.json
{
  "name": "@curet/mi-nueva-app",
  "dependencies": {
    "@curet/ui": "workspace:*",
    "@curet/utils": "workspace:*"
  }
}

# 3. Instalar
pnpm install

# 4. Configurar Tailwind
# Ver docs/CREAR-NUEVA-APP.md

# 5. Listo!
pnpm dev --filter=@curet/mi-nueva-app
```

## 🤝 Contribuir

Ver [CONTRIBUTING.md](./CONTRIBUTING.md) (crear en FASE 8)

## 📄 Licencia

Privado - Uso interno de Curet

````

---

## Config #7: `apps/importaciones/package.json` (modificado)

**Ubicación:** `/curet-monorepo/apps/importaciones/package.json`

**Cambios necesarios:**

```json
{
  "name": "@curet/importaciones",  // ← CAMBIAR: era "curet-importaciones"
  "version": "1.0.0",
  "private": true,                // ← AGREGAR si no existe
  "scripts": {
    // ... scripts existentes (sin cambios)
  },
  "dependencies": {
    // ← AGREGAR estas líneas cuando crees los paquetes
    "@curet/ui": "workspace:*",
    "@curet/utils": "workspace:*",
    "@curet/config": "workspace:*",

    // ... resto de dependencias existentes
    "next": "14.2.33",
    "react": "18.3.1",
    // etc...
  },
  "devDependencies": {
    // ... sin cambios
  }
}
````

**Instrucciones:**

1. Cambiar `"name"` a `"@curet/importaciones"`
2. Agregar `"private": true`
3. NO agregar dependencias de `@curet/*` todavía (esperar a FASE 3+)

---

## Config #8: `packages/ui/package.json`

**Ubicación:** `/curet-monorepo/packages/ui/package.json`

```json
{
  "name": "@curet/ui",
  "version": "1.0.0",
  "description": "Curet Design System - Componentes React + Tailwind CSS",
  "main": "./src/index.tsx",
  "types": "./src/index.tsx",
  "exports": {
    ".": "./src/index.ts",
    "./components": "./src/components/index.ts",
    "./hooks": "./src/hooks/index.ts",
    "./utils": "./src/utils/index.ts",
    "./styles": "./src/styles/globals.css"
  },
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf .turbo node_modules"
  },
  "dependencies": {
    "@tanstack/react-table": "^8.21.3",
    "clsx": "^2.1.0",
    "currency.js": "^2.0.4",
    "date-fns": "^3.3.1",
    "lucide-react": "^0.344.0",
    "react-dropzone": "^14.2.3",
    "sonner": "^1.4.0",
    "tailwind-merge": "^2.2.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "autoprefixer": "^10.4.18",
    "eslint": "^8.57.0",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.5.4"
  },
  "peerDependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
```

---

## Config #9: `packages/ui/tsconfig.json`

**Ubicación:** `/curet-monorepo/packages/ui/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
```

---

## Config #10: `packages/ui/tailwind.config.js`

**Ubicación:** `/curet-monorepo/packages/ui/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Design Tokens - Colores principales
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6", // Color principal
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#10b981", // Verde
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444", // Rojo
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b", // Naranja
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
      },
      spacing: {
        // Scale base 4px
        0: "0px",
        1: "0.25rem", // 4px
        2: "0.5rem", // 8px
        3: "0.75rem", // 12px
        4: "1rem", // 16px
        6: "1.5rem", // 24px
        8: "2rem", // 32px
        12: "3rem", // 48px
        16: "4rem", // 64px
      },
      borderRadius: {
        none: "0px",
        sm: "0.25rem", // 4px
        md: "0.375rem", // 6px
        lg: "0.5rem", // 8px
        xl: "0.75rem", // 12px
        "2xl": "1rem", // 16px
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
      },
    },
  },
  plugins: [],
}
```

---

## Config #11: `packages/utils/package.json`

**Ubicación:** `/curet-monorepo/packages/utils/package.json`

```json
{
  "name": "@curet/utils",
  "version": "1.0.0",
  "description": "Utilidades compartidas del ecosistema Curet",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./currency": "./src/currency.ts",
    "./date": "./src/date.ts",
    "./export": "./src/export.ts",
    "./validators": "./src/validators.ts"
  },
  "scripts": {
    "lint": "eslint . --ext .ts",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "clean": "rm -rf .turbo node_modules"
  },
  "dependencies": {
    "currency.js": "^2.0.4",
    "date-fns": "^3.3.1",
    "exceljs": "^4.4.0",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2"
  },
  "devDependencies": {
    "@types/jest": "^30.2.0",
    "jest": "^30.2.0",
    "typescript": "^5.5.4"
  }
}
```

---

## Config #12: `packages/config/package.json`

**Ubicación:** `/curet-monorepo/packages/config/package.json`

```json
{
  "name": "@curet/config",
  "version": "1.0.0",
  "description": "Configuraciones compartidas (ESLint, TypeScript, Tailwind)",
  "main": "./index.js",
  "files": ["eslint", "typescript", "tailwind"],
  "exports": {
    "./eslint": "./eslint/index.js",
    "./typescript/base": "./typescript/base.json",
    "./typescript/nextjs": "./typescript/nextjs.json",
    "./tailwind": "./tailwind/index.js"
  },
  "devDependencies": {
    "eslint": "^8.57.0",
    "typescript": "^5.5.4",
    "tailwindcss": "^3.4.1"
  }
}
```

---

## 🔧 Ejemplos de Uso

### Cómo usar `@curet/ui` en una app

```tsx
// app/(pages)/dashboard/page.tsx
import { Button, Card, DataTable } from "@curet/ui/components"
import { useToast } from "@curet/ui/hooks"
import { formatCurrency } from "@curet/ui/utils"

export default function DashboardPage() {
  const { toast } = useToast()

  const handleClick = () => {
    toast.success("Acción exitosa!")
  }

  return (
    <div className="p-8">
      <Card>
        <h1>Dashboard</h1>
        <p>Total: {formatCurrency(10000)}</p>
        <Button onClick={handleClick}>Click me</Button>
      </Card>
    </div>
  )
}
```

### Cómo extender Tailwind config desde `@curet/config`

```javascript
// apps/importaciones/tailwind.config.js
const baseConfig = require("@curet/config/tailwind")

module.exports = {
  ...baseConfig,
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    // Importante: incluir paquete UI
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      ...baseConfig.theme.extend,
      // Extensiones específicas de esta app
      colors: {
        ...baseConfig.theme.extend.colors,
        brand: "#custom-color", // App-specific
      },
    },
  },
}
```

### Cómo usar TypeScript config base

```json
// apps/importaciones/tsconfig.json
{
  "extends": "@curet/config/typescript/nextjs",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@curet/ui": ["../../packages/ui/src"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

---

## ✅ Checklist de Verificación

Después de crear todas las configuraciones:

- [ ] `package.json` raíz tiene scripts de turbo
- [ ] `pnpm-workspace.yaml` lista apps/_ y packages/_
- [ ] `turbo.json` tiene pipeline configurado
- [ ] `.gitignore` excluye node_modules, .next, .turbo
- [ ] `README.md` raíz con instrucciones básicas
- [ ] Apps tienen nombre `@curet/nombre-app`
- [ ] Paquetes tienen nombre `@curet/nombre-paquete`
- [ ] Todos los `package.json` tienen `"private": true`
- [ ] Dependencies entre paquetes usan `"workspace:*"`

---

## 🚨 Troubleshooting

### Error: "Cannot find package '@curet/ui'"

**Solución:**

```bash
# En la raíz del monorepo
pnpm install
```

### Error: "Module not found: Can't resolve '@curet/ui/components'"

**Causa:** Exports no configurados correctamente en `package.json`

**Solución:** Verificar que `packages/ui/package.json` tenga:

```json
{
  "exports": {
    "./components": "./src/components/index.ts"
  }
}
```

### Cambios en paquete UI no se reflejan en app

**Solución:**

```bash
# Limpiar caché de Turbo
turbo run clean

# Rebuild todo
pnpm build

# O forzar rebuild sin caché
turbo run build --force
```

### Error de TypeScript: "Cannot find module '@curet/ui'"

**Solución:** Agregar paths en `tsconfig.json` de la app:

```json
{
  "compilerOptions": {
    "paths": {
      "@curet/ui": ["../../packages/ui/src"]
    }
  }
}
```

---

**📅 Última actualización:** 2025-11-18
**🔗 Relacionado:** [PLAN-MONOREPO.md](./PLAN-MONOREPO.md)
