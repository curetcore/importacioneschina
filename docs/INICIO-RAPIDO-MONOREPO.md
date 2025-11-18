# ⚡ Inicio Rápido - Migración a Monorepo

> **Tiempo estimado:** 1-2 horas
> **Dificultad:** Baja
> **Riesgo:** Mínimo (no toca código existente)

---

## 🎯 ¿Qué vamos a hacer?

Migrar este proyecto a una estructura de monorepo **sin cambiar nada del código existente**.

**Resultado:** Tu app funcionará exactamente igual, pero estará lista para escalar a múltiples aplicaciones.

---

## ✅ Pre-requisitos

Verifica que tienes todo listo:

```bash
# 1. Node.js >= 18
node --version
# Debe mostrar: v18.x.x o superior

# 2. Git funcionando
git --version
# Debe mostrar la versión

# 3. Commits limpios (sin cambios pendientes es ideal)
git status
# Idealmente: "nothing to commit, working tree clean"
```

Si tienes cambios pendientes, haz commit primero:

```bash
git add .
git commit -m "chore: Snapshot antes de migración a monorepo"
git push
```

---

## 🚀 Paso a Paso (Copy-Paste Ready)

### PASO 1: Instalar pnpm (5 min)

```bash
# Instalar pnpm globalmente
npm install -g pnpm

# Verificar instalación
pnpm --version
# Debe mostrar: 8.x.x o superior
```

**¿Por qué pnpm?**

- ✅ 2-3x más rápido que npm
- ✅ Ahorra espacio en disco
- ✅ Workspaces nativos (necesario para monorepo)

---

### PASO 2: Backup del proyecto (2 min)

```bash
# Ir al directorio padre
cd /Users/ronaldopaulino

# Crear backup completo
cp -r curet-importaciones curet-importaciones.backup

# Verificar que se copió
ls -la | grep curet
# Deberías ver: curet-importaciones y curet-importaciones.backup
```

**Seguridad:** Si algo sale mal, siempre puedes volver al backup.

---

### PASO 3: Crear estructura del monorepo (10 min)

```bash
# 1. Crear directorio raíz
cd /Users/ronaldopaulino
mkdir curet-monorepo
cd curet-monorepo

# 2. Crear estructura de carpetas
mkdir -p apps packages

# 3. Inicializar package.json raíz
pnpm init
```

Ahora **edita** `package.json` (el que se acaba de crear) y reemplázalo con:

```json
{
  "name": "curet-monorepo",
  "version": "1.0.0",
  "private": true,
  "description": "Monorepo del ecosistema Curet",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
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

**Guarda el archivo** (Cmd+S o Ctrl+S)

---

### PASO 4: Configurar workspace (5 min)

Crear archivo `pnpm-workspace.yaml`:

```bash
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF
```

Verificar que se creó:

```bash
cat pnpm-workspace.yaml
# Debe mostrar el contenido
```

---

### PASO 5: Configurar Turborepo (5 min)

Crear archivo `turbo.json`:

```bash
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local", "**/.env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "clean": {
      "cache": false
    }
  }
}
EOF
```

---

### PASO 6: Mover proyecto actual (10 min)

```bash
# Mover el proyecto a apps/importaciones
mv ../curet-importaciones ./apps/importaciones

# Verificar estructura
ls -la apps/
# Debe mostrar: importaciones/

# Verificar que el proyecto está ahí
ls -la apps/importaciones/
# Debe mostrar: app/, components/, lib/, package.json, etc.
```

**Actualizar nombre del proyecto:**

```bash
cd apps/importaciones

# Abrir package.json y cambiar el nombre
# Buscar la línea: "name": "..."
# Cambiarla a: "name": "@curet/importaciones"
```

O hazlo con sed (macOS):

```bash
sed -i '' 's/"name": "[^"]*"/"name": "@curet\/importaciones"/' package.json

# Verificar cambio
grep '"name"' package.json
# Debe mostrar: "name": "@curet/importaciones"
```

Agregar `"private": true` si no existe:

```bash
# Abrir package.json y agregar después de "name":
# "private": true,
```

---

### PASO 7: Instalar dependencias (15 min)

```bash
# Volver a la raíz del monorepo
cd /Users/ronaldopaulino/curet-monorepo

# Instalar Turborepo
pnpm add -D turbo

# Instalar TODAS las dependencias (esto puede tardar)
pnpm install
```

**Espera pacientemente...** pnpm va a instalar todas las dependencias del proyecto.

---

### PASO 8: Probar que funciona (10 min)

```bash
# Desde la raíz del monorepo
pnpm dev
```

Deberías ver algo como:

```
• apps/importaciones:dev: ready started server on 0.0.0.0:3000
```

**Abre el navegador:** http://localhost:3000

✅ **Si la app carga correctamente:** ¡ÉXITO! La migración funcionó
❌ **Si hay errores:** Ver sección de Troubleshooting abajo

Para detener el servidor: `Ctrl+C`

---

### PASO 9: Inicializar Git (5 min)

```bash
# Desde la raíz del monorepo
cd /Users/ronaldopaulino/curet-monorepo

# Inicializar repositorio
git init

# Crear .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/

# Next.js
.next/
out/

# Turbo
.turbo

# Environment
.env
.env.local
.env*.local

# Logs
*.log

# OS
.DS_Store

# Testing
coverage/

# Build
dist/
build/
*.tsbuildinfo
EOF

# Hacer primer commit
git add .
git commit -m "feat: Migrar a monorepo estructura base"
```

---

### PASO 10: Crear repositorio en GitHub (5 min)

**Opción A: Crear nuevo repo**

1. Ir a https://github.com/new
2. Nombre: `curet-monorepo`
3. Privado
4. NO inicializar con README (ya lo tienes)
5. Crear

```bash
# Conectar con GitHub (reemplaza con tu URL)
git remote add origin git@github.com:TU-USUARIO/curet-monorepo.git
git branch -M main
git push -u origin main
```

**Opción B: Usar rama en repo existente**

```bash
# Si prefieres una rama en el mismo repo
git remote add origin git@github.com:TU-USUARIO/curet-importaciones.git
git checkout -b monorepo
git push -u origin monorepo
```

---

## ✅ Verificación Final

Checklist de que todo funcionó:

- [ ] `pnpm dev` inicia el servidor sin errores
- [ ] App se ve correctamente en http://localhost:3000
- [ ] Puedes navegar entre páginas
- [ ] No hay errores en consola del navegador
- [ ] Git inicializado con commit
- [ ] Pusheado a GitHub (opcional pero recomendado)

---

## 🎉 ¡Felicitaciones!

Has completado la **FASE 1** del plan de monorepo.

### 📊 Lo que lograste:

- ✅ Monorepo funcional con Turborepo
- ✅ App migrada sin romper nada
- ✅ Estructura lista para escalar
- ✅ pnpm workspaces configurado

### 🎯 Próximos pasos:

1. **Ahora mismo:** Continúa desarrollando normalmente (FASE 2)
   - Trabaja en `apps/importaciones` como siempre
   - Usa `pnpm dev` en vez de `npm run dev`
   - Todo lo demás es igual

2. **En 1-2 semanas:** Cuando estés listo, pasa a FASE 3
   - Crear paquete `@curet/ui` con componentes
   - Ver [PLAN-MONOREPO.md](./PLAN-MONOREPO.md) FASE 3

3. **En 1 mes:** Crear segunda app
   - Reutilizar componentes del monorepo
   - Validar que el sistema funciona

---

## 🚨 Troubleshooting

### Error: "Cannot find module 'next'"

**Causa:** No se instalaron las dependencias

**Solución:**

```bash
cd /Users/ronaldopaulino/curet-monorepo
pnpm install
```

---

### Error: "turbo: command not found"

**Causa:** Turborepo no está instalado

**Solución:**

```bash
pnpm add -D turbo
```

---

### Error: Puerto 3000 en uso

**Causa:** Otra app usando el puerto

**Solución:**

```bash
# Opción 1: Matar proceso en puerto 3000
lsof -ti:3000 | xargs kill -9

# Opción 2: Usar otro puerto
cd apps/importaciones
PORT=3001 pnpm dev
```

---

### La app no carga estilos (Tailwind)

**Causa:** Puede ser problema de caché

**Solución:**

```bash
# Limpiar todo
pnpm clean

# Reinstalar
pnpm install

# Rebuild
pnpm build

# Intentar dev de nuevo
pnpm dev
```

---

### Quiero volver atrás

**No hay problema, tienes backup:**

```bash
cd /Users/ronaldopaulino

# Eliminar intento de monorepo
rm -rf curet-monorepo

# Restaurar backup
mv curet-importaciones.backup curet-importaciones

# Volver a trabajar normal
cd curet-importaciones
npm install
npm run dev
```

---

### Errores de TypeScript

**Causa:** Puede que falten types

**Solución:**

```bash
cd apps/importaciones
pnpm add -D @types/react @types/react-dom @types/node
```

---

## 📚 Comandos Útiles

```bash
# Desarrollo
pnpm dev                    # Inicia todas las apps
pnpm dev --filter=@curet/importaciones  # Solo una app

# Build
pnpm build                  # Build de todo
pnpm build --filter=@curet/importaciones  # Solo una app

# Tests
pnpm test                   # Todos los tests
pnpm test --filter=@curet/importaciones   # Tests de una app

# Limpiar
pnpm clean                  # Limpiar builds y caché

# Agregar dependencia a una app
cd apps/importaciones
pnpm add nombre-paquete

# Ver qué se ejecutará
turbo run build --dry-run
```

---

## 🆘 ¿Necesitas Ayuda?

1. **Revisa:** [PLAN-MONOREPO.md](./PLAN-MONOREPO.md) - Plan completo
2. **Configs:** [MONOREPO-CONFIGS.md](./MONOREPO-CONFIGS.md) - Archivos de referencia
3. **Documentación oficial:** https://turbo.build/repo/docs

---

## 📝 Notas Importantes

### Cambios en tu workflow:

**ANTES:**

```bash
cd curet-importaciones
npm install
npm run dev
```

**AHORA:**

```bash
cd curet-monorepo
pnpm install
pnpm dev
```

### Estructura de carpetas:

**ANTES:**

```
curet-importaciones/
├── app/
├── components/
├── lib/
└── package.json
```

**AHORA:**

```
curet-monorepo/
├── apps/
│   └── importaciones/     ← Tu proyecto está aquí
│       ├── app/
│       ├── components/
│       └── lib/
├── packages/              ← Futuros paquetes compartidos
└── package.json           ← Root del monorepo
```

### Git branches:

Es buena práctica trabajar en una rama separada para la migración:

```bash
# Crear rama para monorepo
git checkout -b feature/monorepo-migration

# Trabajar y commitear
git add .
git commit -m "feat: Complete monorepo setup"

# Cuando esté listo, merge a main
git checkout main
git merge feature/monorepo-migration
```

---

**🚀 ¡Éxito en tu migración!**

**Última actualización:** 2025-11-18
