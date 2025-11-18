# ✅ Checklist para Producción

## 📊 Estado Actual

**App:** https://importacion.curetcore.com
**Status:** ✅ Desplegada y funcionando
**Servidor:** 147.93.177.156 (EasyPanel)
**SSL:** ✅ Configurado
**Base de Datos:** ✅ PostgreSQL 17 funcionando

---

## ✅ Ya Configurado

- ✅ Servidor VPS (147.93.177.156)
- ✅ EasyPanel como panel de control
- ✅ Dominio (importacion.curetcore.com)
- ✅ SSL/HTTPS funcionando
- ✅ PostgreSQL 17 en Docker Swarm
- ✅ Next.js desplegado en Docker
- ✅ Backups automáticos (BD + archivos, 3 AM diario)
- ✅ Logging estructurado (Winston)
- ✅ Audit logs completo
- ✅ Full-text search
- ✅ Rate limiting
- ✅ Error handling global
- ✅ Soft deletes
- ✅ React Query con caché
- ✅ Forms con validación (Zod)
- ✅ Tests básicos configurados

---

## ❌ Pendiente para Producción

### **🔴 CRÍTICO (Bloqueadores)**

#### 1. Verificar NextAuth en Producción

**Status:** ⚠️ Desconocido
**Prioridad:** CRÍTICA

- [ ] Verificar que NextAuth funciona en https://importacion.curetcore.com
- [ ] Variables de entorno configuradas:
  - `NEXTAUTH_SECRET` (producción)
  - `NEXTAUTH_URL=https://importacion.curetcore.com`
- [ ] Probar login/logout en producción
- [ ] Verificar sesiones persistentes

**¿Cómo verificar?**

```bash
# Conectar a servidor
ssh root@147.93.177.156

# Ver variables de entorno del contenedor
docker service inspect apps_sistema_de_importacion --format '{{json .Spec.TaskTemplate.ContainerSpec.Env}}' | jq .
```

**Tiempo:** 30 minutos

---

#### 2. Migración de Base de Datos

**Status:** ⚠️ Verificar
**Prioridad:** CRÍTICA

- [ ] Verificar que TODAS las migraciones están aplicadas
  - Schema de Prisma sincronizado
  - Full-text search aplicado
  - Índices creados
- [ ] Seed de datos iniciales (si aplica)

**¿Cómo verificar?**

```bash
# Conectar a PostgreSQL
docker exec -it apps_postgres_sistemadechina.1.XXXXX psql -U postgres apps

# Verificar tablas
\dt

# Verificar que existen columnas search_vector
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name = 'search_vector';

# Verificar índices FTS
SELECT tablename, indexname FROM pg_indexes WHERE indexname LIKE '%search_idx';
```

**Tiempo:** 1 hora

---

#### 3. Datos de Prueba vs Producción

**Status:** ⚠️ Verificar
**Prioridad:** ALTA

- [ ] ¿La BD tiene datos reales o de prueba?
- [ ] Si es producción real: ¿backup reciente confirmado?
- [ ] Si es staging: ¿datos de demo cargados?

**Tiempo:** 30 minutos

---

### **🟡 IMPORTANTE (Recomendado antes de usuarios reales)**

#### 4. Error Tracking (Sentry)

**Status:** ❌ No configurado
**Prioridad:** ALTA

- [ ] Crear cuenta en Sentry (gratis)
- [ ] Instalar `@sentry/nextjs`
- [ ] Configurar en producción
- [ ] Verificar que reporta errores

**Beneficio:** Ver errores en producción en tiempo real

**Tiempo:** 1 hora

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

#### 5. Uptime Monitoring

**Status:** ❌ No configurado
**Prioridad:** ALTA

- [ ] Configurar UptimeRobot (gratis)
  - URL: https://importacion.curetcore.com
  - Intervalo: Cada 5 minutos
- [ ] Configurar alertas por email/SMS si cae

**Beneficio:** Saber si el sitio está caído

**Tiempo:** 15 minutos

---

#### 6. Health Check Endpoint

**Status:** ❌ No existe
**Prioridad:** MEDIA

- [ ] Crear `/api/health` endpoint
  - Verificar conexión a BD
  - Retornar status 200 si todo OK
  - Usar para monitoring

**Tiempo:** 30 minutos

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    const db = await getPrismaClient()
    await db.$queryRaw`SELECT 1`

    return Response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    })
  } catch (error) {
    return Response.json(
      {
        status: "unhealthy",
        error: error.message,
      },
      { status: 503 }
    )
  }
}
```

---

#### 7. Testing en Producción

**Status:** ❌ Pendiente
**Prioridad:** ALTA

- [ ] Probar flujo completo end-to-end:
  - Login/logout
  - Crear orden de compra
  - Agregar pago
  - Agregar gasto logístico
  - Recibir inventario
  - Generar análisis de costos
  - Exportar a Excel
- [ ] Probar en diferentes navegadores:
  - Chrome
  - Firefox
  - Safari
  - Edge
- [ ] Probar en móvil:
  - iOS
  - Android
- [ ] Verificar performance:
  - Tiempos de carga <2s
  - No hay errores en consola

**Tiempo:** 3 horas

---

#### 8. Migrar Backups a Cloud

**Status:** ✅ Backups locales, ❌ Cloud
**Prioridad:** MEDIA

- [ ] Configurar Cloudflare R2 (gratis 10GB)
- [ ] Actualizar scripts para subir a R2
- [ ] Probar restauración desde cloud

**Beneficio:** Protección si el servidor falla completamente

**Tiempo:** 2 horas

---

### **🟢 NICE TO HAVE (Opcional)**

#### 9. Headers de Seguridad

**Status:** ⚠️ Verificar

- [ ] CSP (Content Security Policy)
- [ ] HSTS, X-Frame-Options, X-Content-Type-Options
- [ ] Configurar en `next.config.js`

**Tiempo:** 1 hora

---

#### 10. Performance Optimizations

**Status:** Parcial

- [ ] Verificar bundle size (`npm run build`)
- [ ] Lazy loading de componentes pesados
- [ ] Image optimization (Next.js Image)
- [ ] Comprimir assets (gzip/brotli)

**Tiempo:** 2 horas

---

#### 11. Documentación de Usuario

**Status:** ❌ No existe

- [ ] Manual básico de uso
- [ ] Screenshots del flujo principal
- [ ] FAQ

**Tiempo:** 3 horas

---

## 🎯 Plan de Acción Recomendado

### **Sprint 1: Verificación (1 día)**

```
□ Verificar NextAuth funciona                    (30 min)
□ Verificar migraciones aplicadas                (1 hora)
□ Testing manual completo                        (3 horas)
□ Crear /api/health endpoint                     (30 min)
□ Configurar Sentry                              (1 hora)
□ Configurar UptimeRobot                         (15 min)
──────────────────────────────────────────────────────────
TOTAL:                                           ~6 horas
```

**Resultado:** App verificada y monitoreada ✅

---

### **Sprint 2: Hardening (Opcional)**

```
□ Migrar backups a Cloudflare R2                 (2 horas)
□ Headers de seguridad                           (1 hora)
□ Performance optimizations                      (2 horas)
□ Documentación básica                           (3 horas)
──────────────────────────────────────────────────────────
TOTAL:                                           ~8 horas
```

**Resultado:** App production-ready al 100% ✅

---

## ✅ Checklist Final Pre-Launch

```
CRÍTICO:
□ NextAuth funciona en producción
□ Todas las migraciones aplicadas
□ Testing manual completo (login, CRUD, exports)
□ Backup reciente verificado
□ Health check endpoint funcionando

IMPORTANTE:
□ Sentry configurado (error tracking)
□ UptimeRobot configurado (monitoring)
□ Testing en múltiples navegadores
□ Testing en móvil

OPCIONAL:
□ Backups en cloud (R2/Backblaze)
□ Headers de seguridad
□ Documentación de usuario
□ Performance optimizado
```

---

## 🚨 Próximos Pasos Inmediatos

**Para verificar estado actual:**

1. **Login a la app:** https://importacion.curetcore.com
2. **Probar autenticación:** ¿Funciona NextAuth?
3. **Crear una orden de prueba:** ¿CRUD funciona?
4. **Ver análisis de costos:** ¿FTS funciona?
5. **Verificar logs:** ¿Winston guardando logs?

**Responde estas preguntas:**

- ¿Ya hay usuarios reales usando el sistema?
- ¿Los datos en la BD son reales o de prueba?
- ¿NextAuth está configurado y funcionando?

**Última actualización:** 2025-11-18
