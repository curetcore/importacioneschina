# 🎨 Plan de Feedback Visual - Sistema de Importaciones

> **Estado:** 📋 Planificado | **Prioridad:** Media | **Riesgo:** Bajo-Medio
> **Esfuerzo estimado:** 12-16 horas | **Impacto en UX:** Alto (+40%)

---

## 📊 Análisis de Riesgo para Producción

### ⚠️ Consideraciones Críticas

**Estado actual del sistema:**

- ✅ Sistema en producción activa
- ✅ Usuarios trabajando diariamente
- ✅ Datos reales en base de datos
- ⚠️ Sin tests E2E completos

**Nivel de riesgo por mejora:**

| Mejora               | Riesgo   | Impacto si falla                      | Mitigación                     |
| -------------------- | -------- | ------------------------------------- | ------------------------------ |
| Skeleton Screens     | 🟢 Bajo  | Solo visual, no afecta datos          | Deploy gradual, rollback fácil |
| Progress Bars Upload | 🟡 Medio | Archivos podrían no subir visualmente | Testear en staging primero     |
| Loading States       | 🟢 Bajo  | UI podría verse rara temporalmente    | CSS fallback                   |
| Animaciones          | 🟢 Bajo  | Perf                                  |

ormance en dispositivos lentos | Optional animations, reducedMotion |
| Feedback Optimista | 🔴 Alto | Datos podrían desincronizarse | NO implementar sin tests robustos |
| Toast Mejoradas | 🟢 Bajo | Notificaciones menos claras | Ya tienes toast working |

---

## 🚦 Estrategia de Implementación Segura

### Fase 1: Quick Wins (Bajo Riesgo) - 4 horas

**✅ SEGURO PARA PRODUCCIÓN**

1. **Skeleton Screens** (1.5h)
   - Componente standalone
   - No toca lógica existente
   - Fácil rollback (borrar componente)

2. **Button Loading States** (1h)
   - Solo agrega spinner a botones
   - Usa `isSubmitting` existente
   - Backward compatible

3. **Toast con Íconos** (1h)
   - Mejora toast actual
   - No cambia API
   - Degradation graceful

4. **Hover States Mejorados** (0.5h)
   - Solo CSS
   - Zero riesgo
   - Rollback instantáneo

**Deployment:** Viernes tarde → Monitorear fin de semana

---

### Fase 2: Mejoras Moderadas (Riesgo Medio) - 6 horas

**⚠️ REQUIERE TESTING CUIDADOSO**

1. **Progress Bar en Uploads** (3h)
   - **Riesgo:** Podría romper upload existente
   - **Mitigación:**
     - Feature flag: `ENABLE_UPLOAD_PROGRESS=true`
     - Testear con archivos de 1KB, 1MB, 10MB
     - Fallback a upload sin progress si falla
   - **Rollback:** Deshabilitar flag

2. **Fade Animations** (2h)
   - **Riesgo:** Performance en listas grandes
   - **Mitigación:**
     - Solo en items individuales (< 50 elementos)
     - Deshabilitar con `prefers-reduced-motion`
     - Timeout máximo 300ms
   - **Rollback:** Remover clases CSS

3. **Confirmación con Countdown** (1h)
   - **Riesgo:** Confusión en UX
   - **Mitigación:**
     - A/B test con 2 usuarios primero
     - Botón "deshacer" muy visible
     - Timeout de 5 segundos (no muy corto)
   - **Rollback:** Volver a modal estándar

**Deployment:** Staging 3 días → Producción con flag

---

### Fase 3: Avanzado (Alto Riesgo) - 6 horas

**🔴 NO IMPLEMENTAR SIN TESTS COMPLETOS**

1. **Feedback Optimista** (4h)
   - **Riesgo:** Datos desincronizados, race conditions
   - **Requerimientos antes de implementar:**
     - Tests E2E con Playwright ✅
     - Manejo de errores robusto ✅
     - Estrategia de reversión clara ✅
     - Logging de operaciones ✅
   - **NO implementar hasta tener todo lo anterior**

2. **Real-time Updates** (2h)
   - **Riesgo:** WebSocket puede romper app
   - **Mitigación:**
     - Implementar como enhancement opcional
     - Polling fallback si WebSocket falla
     - Circuit breaker pattern
   - **Alternativa más segura:** Polling cada 30s

**Deployment:** Solo después de Fase 1 y 2 estables por 2+ semanas

---

## 📋 Checklist Pre-Implementación

Antes de empezar CUALQUIER mejora, verificar:

- [ ] Backup de base de datos reciente (< 24h)
- [ ] Commit limpio en Git
- [ ] Tag de versión actual (`git tag v1.x.x`)
- [ ] Staging environment disponible
- [ ] Plan de rollback documentado
- [ ] Usuario de prueba con datos de test
- [ ] Monitoreo de errores activo (logs)

---

## 🎯 Implementación Detallada por Fase

### FASE 1.1: Skeleton Screens

**Archivo:** `components/ui/skeleton.tsx`

```tsx
interface SkeletonProps {
  className?: string
  count?: number
}

export function Skeleton({ className, count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`animate-pulse bg-gray-200 rounded ${className}`} />
      ))}
    </>
  )
}

export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
```

**Uso:**

```tsx
{isLoading ? <TableSkeleton rows={10} columns={6} /> : <DataTable ... />}
```

**Riesgo:** 🟢 Ninguno - componente aislado
**Rollback:** Borrar archivo + volver a "Cargando..."

---

### FASE 1.2: Button Loading States

**Archivo:** `components/ui/button.tsx` (modificar existente)

```tsx
interface ButtonProps {
  isLoading?: boolean
  loadingText?: string
  children: React.ReactNode
  // ... existing props
}

export function Button({ isLoading, loadingText, children, ...props }: ButtonProps) {
  return (
    <button {...props} disabled={props.disabled || isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? loadingText || children : children}
    </button>
  )
}
```

**Uso:**

```tsx
<Button type="submit" isLoading={isSubmitting} loadingText="Guardando...">
  Guardar
</Button>
```

**Riesgo:** 🟢 Muy bajo - extiende componente existente
**Rollback:** Props son opcionales, no rompe nada

---

### FASE 2.1: Progress Bar en Uploads

**Archivo:** `components/ui/file-upload.tsx`

```tsx
const [uploadProgress, setUploadProgress] = useState(0)

const uploadFile = async (file: File) => {
  const formData = new FormData()
  formData.append("file", file)

  try {
    const xhr = new XMLHttpRequest()

    // Tracking de progreso
    xhr.upload.addEventListener("progress", e => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100
        setUploadProgress(percentComplete)
      }
    })

    // Promise wrapper para XMLHttpRequest
    await new Promise((resolve, reject) => {
      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText))
        } else {
          reject(new Error("Upload failed"))
        }
      })
      xhr.addEventListener("error", reject)
      xhr.open("POST", "/api/upload")
      xhr.send(formData)
    })
  } catch (error) {
    // Fallback a fetch si XMLHttpRequest falla
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })
    // ... handle response
  }
}
```

**UI:**

```tsx
{
  uploadProgress > 0 && uploadProgress < 100 && (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all"
        style={{ width: `${uploadProgress}%` }}
      />
    </div>
  )
}
```

**Riesgo:** 🟡 Medio
**Mitigación:**

- Feature flag: `const ENABLE_PROGRESS = process.env.NEXT_PUBLIC_UPLOAD_PROGRESS === 'true'`
- Try/catch con fallback a fetch estándar
- Testing: 1KB, 1MB, 10MB, 50MB

**Rollback:** Disable flag o revert commit

---

## 🧪 Plan de Testing

### Testing Manual (Mínimo)

**Antes de deploy a producción:**

1. **Skeleton Screens**
   - [ ] Cargar página de Órdenes → Ver skeleton
   - [ ] Throttle Network to 3G → Skeleton visible por 2+ segundos
   - [ ] Datos cargan → Skeleton desaparece smooth

2. **Button Loading**
   - [ ] Click "Guardar" → Spinner aparece
   - [ ] Botón disabled durante submit
   - [ ] Success → Spinner desaparece
   - [ ] Error → Spinner desaparece, botón habilitado nuevamente

3. **Upload Progress**
   - [ ] Upload 1KB file → Barra llega a 100% instantáneamente
   - [ ] Upload 10MB file → Barra incrementa gradualmente
   - [ ] Cancelar mid-upload → Progress resetea
   - [ ] Error en upload → Progress desaparece, mensaje de error

### Testing Automatizado (Recomendado para Fase 3)

```bash
# Instalar Playwright
npm install -D @playwright/test

# Crear test
# tests/e2e/feedback-visual.spec.ts
test('upload muestra progreso', async ({ page }) => {
  await page.goto('/ordenes')
  await page.click('text=Nueva Orden')

  const fileInput = await page.locator('input[type="file"]')
  await fileInput.setInputFiles('test-files/10mb.pdf')

  // Verificar que progress bar aparece
  const progressBar = page.locator('[role="progressbar"]')
  await expect(progressBar).toBeVisible()

  // Verificar que llega a 100%
  await expect(progressBar).toHaveAttribute('aria-valuenow', '100', { timeout: 30000 })
})
```

---

## 📊 Métricas de Éxito

### KPIs a Monitorear Post-Deployment

| Métrica               | Baseline | Objetivo   | Cómo medir      |
| --------------------- | -------- | ---------- | --------------- |
| Perceived Performance | 3/5      | 4.5/5      | User survey     |
| Upload Success Rate   | 98%      | 99%+       | Logs            |
| Error Rate            | 0.5%     | < 1%       | Sentry/logs     |
| User Confusion        | N/A      | Ninguna    | Support tickets |
| Bounce Rate           | N/A      | Sin cambio | Analytics       |

### Red Flags (Rollback inmediato si)

- ❌ Error rate sube > 2%
- ❌ Upload success < 95%
- ❌ 3+ tickets de soporte sobre "no puedo subir archivos"
- ❌ Performance degrada > 20%
- ❌ Crash en navegadores específicos (Safari, Firefox, etc.)

---

## 🔄 Plan de Rollback

### Rollback Rápido (< 5 minutos)

```bash
# Opción 1: Revert commit
git revert HEAD
git push
# Deploy automático trigger

# Opción 2: Feature flag
# En .env.production
NEXT_PUBLIC_UPLOAD_PROGRESS=false
NEXT_PUBLIC_SKELETON_LOADING=false
# Redeploy

# Opción 3: Tag anterior
git checkout v1.x.x  # última versión estable
git push --force
# Deploy
```

### Rollback con Datos Afectados

Si hay datos corruptos por feedback optimista:

```sql
-- Ver últimas operaciones (audit log)
SELECT * FROM "AuditLog"
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
ORDER BY "createdAt" DESC;

-- Restaurar desde backup si necesario
-- (Ver docs/BACKUP-LOCAL.md)
```

---

## 📝 Changelog Template

Cuando implementes una mejora, documentar en `CHANGELOG.md`:

```markdown
## [1.3.0] - 2025-XX-XX

### Added

- Skeleton screens en tablas de Órdenes, Pagos, Gastos
- Progress bar visual en uploads de archivos
- Loading states en todos los botones de submit

### Changed

- Toast notifications ahora incluyen íconos contextuales
- Hover states más visibles en filas de tabla

### Fixed

- N/A

### Security

- N/A

### Performance

- Perceived load time mejorado en ~40%
```

---

## 🎓 Recursos y Referencias

**Librerías recomendadas:**

- ✅ Ya tienes: `lucide-react` (íconos), `tailwindcss`
- 🟡 Considerar: `framer-motion` (animaciones suaves)
- 🟡 Considerar: `react-hot-toast` / `sonner` (toast mejorado)
- ❌ NO usar: `react-spring`, `anime.js` (overkill, bundle size)

**Principios de UX:**

1. **Feedback inmediato** (<100ms) - Usuario debe ver respuesta instantánea
2. **Progreso visible** (>1s) - Mostrar barra si tarda más de 1 segundo
3. **Skeleton > Spinner** - Más informativo sobre qué está cargando
4. **Optimista con cuidado** - Solo para acciones reversibles fácilmente

---

## ✅ Checklist Final Pre-Deploy

Antes de marcar cualquier fase como completa:

- [ ] Code review propio (leer código línea por línea)
- [ ] Testing manual completo (todos los casos)
- [ ] Commit con mensaje descriptivo
- [ ] Tag de versión (`git tag v1.3.0`)
- [ ] Backup DB reciente
- [ ] Deploy a staging primero
- [ ] Testing en staging (48h mínimo)
- [ ] Monitoreo activo post-deploy (logs, Sentry)
- [ ] Plan de rollback revisado y listo
- [ ] Changelog actualizado

---

**Próximo paso sugerido:**
Empezar con **Fase 1.1 (Skeleton Screens)** - Riesgo más bajo, impacto visual alto, fácil rollback.

**Estimado de tiempo para completar todo:**

- Fase 1: 1 semana (4h coding + testing)
- Fase 2: 1.5 semanas (6h coding + testing + staging)
- Fase 3: Solo si fases anteriores exitosas + tests E2E listos

**Total:** 3-4 semanas para implementación completa y segura.
