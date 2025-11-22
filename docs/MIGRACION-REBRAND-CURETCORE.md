# 🔄 Guía Completa de Migración: Rebranding a CuretCore Platform

**De:** `importacion.curetcore.com` (Sistema de Importaciones)
**A:** `curetcore.com` (CuretCore Platform - SaaS)

**Fecha:** 2025-11-22
**Estado:** ⚠️ **APLICACIÓN EN PRODUCCIÓN**
**Riesgo:** 🟡 **MEDIO-BAJO**
**Downtime estimado:** ~2-5 minutos (solo al reiniciar contenedor)

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis de Impacto](#análisis-de-impacto)
3. [Pre-Requisitos](#pre-requisitos)
4. [Backup y Seguridad](#backup-y-seguridad)
5. [Fase 1: Infraestructura](#fase-1-infraestructura)
6. [Fase 2: Variables de Entorno](#fase-2-variables-de-entorno)
7. [Fase 3: Código y Assets](#fase-3-código-y-assets)
8. [Fase 4: Documentación](#fase-4-documentación)
9. [Fase 5: Validación](#fase-5-validación)
10. [Rollback Plan](#rollback-plan)
11. [Checklist Final](#checklist-final)

---

## 🎯 Resumen Ejecutivo

### Objetivo

Migrar de un módulo específico de importaciones (`importacion.curetcore.com`) a una plataforma SaaS completa (`curetcore.com`), preparando el terreno para arquitectura de monorepo con múltiples módulos.

### Cambios Principales

| Componente       | Antes                     | Después                        |
| ---------------- | ------------------------- | ------------------------------ |
| **Dominio**      | importacion.curetcore.com | curetcore.com                  |
| **Package Name** | sistema-importacion       | @curetcore/platform            |
| **Branding**     | Sistema de Importaciones  | CuretCore Platform             |
| **Descripción**  | Sistema de importación    | Enterprise Management Platform |
| **Arquitectura** | App única                 | Preparado para monorepo        |

### Impacto

- ✅ **Base de datos:** Sin cambios (no hay referencias al dominio)
- ✅ **Pusher:** Sin cambios (no depende del dominio)
- ⚠️ **NextAuth:** Requiere actualización NEXTAUTH_URL
- ⚠️ **Assets:** Requiere renombrar imágenes de logo
- ⚠️ **Build:** Requiere actualizar NEXT_PUBLIC_API_URL
- ℹ️ **Usuarios:** Deben hacer re-login después de cambio de dominio

---

## 🔍 Análisis de Impacto

### Archivos Afectados por Categoría

#### 🔴 **CRÍTICOS (Afectan Funcionalidad)**

| Archivo                                   | Cambio Requerido    | Impacto                     |
| ----------------------------------------- | ------------------- | --------------------------- |
| `.env.production`                         | NEXT_PUBLIC_API_URL | Build de producción         |
| `.env.local` (servidor)                   | NEXTAUTH_URL        | Autenticación               |
| `package.json`                            | name, description   | Identificación del proyecto |
| `public/images/logotipo-importacion*.png` | Renombrar archivos  | Navbar, login               |

**Total de referencias encontradas:**

- 57 archivos con "importacion/importaciones" en código/docs
- 3 imágenes con "importacion" en nombre
- 2 variables de entorno críticas

#### 🟡 **IMPORTANTES (Branding/Documentación)**

| Archivo                        | Cambio Requerido                       | Impacto                    |
| ------------------------------ | -------------------------------------- | -------------------------- |
| `README.md`                    | Título y descripción                   | Primera impresión del repo |
| `EASYPANEL-DEPLOYMENT.md`      | Referencias al dominio                 | Documentación de deploy    |
| `docs/*.md` (57 archivos)      | Referencias "sistema de importaciones" | Consistencia de docs       |
| `scripts/generate-favicons.ts` | Referencias a imágenes                 | Generación de favicons     |

#### 🟢 **OPCIONALES (No Afectan Funcionalidad)**

| Archivo               | Cambio Requerido          | Impacto                    |
| --------------------- | ------------------------- | -------------------------- |
| Nombres de carpetas   | Mantener como están       | Solo interno, no visible   |
| Comentarios en código | Actualizar gradualmente   | Claridad del código        |
| Tests E2E             | email: test@curetcore.com | Ya usa dominio correcto ✅ |

---

## ✅ Pre-Requisitos

### Accesos Necesarios

- [ ] Acceso a proveedor DNS (Cloudflare, etc.)
- [ ] Acceso a EasyPanel dashboard (https://panel.easypanel.io)
- [ ] SSH al servidor: `root@147.93.177.156` (password: `Pitagora1844*`)
- [ ] Acceso al repositorio GitHub
- [ ] Variables de entorno actuales guardadas

### Herramientas

```bash
# Verificar acceso SSH
sshpass -p 'Pitagora1844*' ssh -o StrictHostKeyChecking=no root@147.93.177.156 "echo 'SSH OK'"

# Verificar Docker en servidor
sshpass -p 'Pitagora1844*' ssh root@147.93.177.156 "docker ps | grep importacion"
```

### Información a Recopilar

```bash
# 1. Nombre exacto del contenedor Docker
CONTAINER_NAME=$(sshpass -p 'Pitagora1844*' ssh root@147.93.177.156 "docker ps --filter name=importacion --format '{{.Names}}'")
echo "Contenedor: $CONTAINER_NAME"

# 2. Variables de entorno actuales
sshpass -p 'Pitagora1844*' ssh root@147.93.177.156 "docker exec $CONTAINER_NAME env | grep -E 'NEXTAUTH|PUSHER|DATABASE'"
```

---

## 🛡️ Backup y Seguridad

### 1. Backup de Base de Datos

```bash
# Conectar al servidor
sshpass -p 'Pitagora1844*' ssh root@147.93.177.156

# Crear backup de PostgreSQL
docker exec apps_postgres_sistemadechina pg_dump \
  -U postgres \
  -d apps \
  -F c \
  -f /tmp/backup_pre_rebrand_$(date +%Y%m%d_%H%M%S).dump

# Copiar backup localmente
docker cp apps_postgres_sistemadechina:/tmp/backup_pre_rebrand_*.dump ./
```

### 2. Backup de Variables de Entorno

```bash
# En el servidor
docker exec apps_sistema_de_importacion.1.XXXXX env > /tmp/env_backup_$(date +%Y%m%d).txt

# Copiar localmente
scp root@147.93.177.156:/tmp/env_backup_*.txt ./backups/
```

### 3. Backup de Código Local

```bash
# Crear branch de backup
git checkout -b backup/pre-rebrand-$(date +%Y%m%d)
git push origin backup/pre-rebrand-$(date +%Y%m%d)

# Volver a main
git checkout main
```

### 4. Snapshot del Servidor (Contabo)

⚠️ **MUY RECOMENDADO:** Crear snapshot del servidor en el panel de Contabo antes de proceder.

---

## 🏗️ Fase 1: Infraestructura

**Duración:** 30-45 minutos
**Downtime:** 0 minutos (ambos dominios activos durante transición)

### 1.1 Configurar DNS

**En tu proveedor DNS (Cloudflare, etc.):**

```dns
# A Record (IPv4)
Type: A
Name: @
Content: 147.93.177.156
TTL: Auto
Proxy: Off (Naranja desactivado si usas Cloudflare)

# A Record para www
Type: A
Name: www
Content: 147.93.177.156
TTL: Auto
Proxy: Off

# OPCIONAL: CNAME para www
Type: CNAME
Name: www
Content: curetcore.com
TTL: Auto
```

**Verificar propagación DNS:**

```bash
# Verificar que apunta al servidor correcto
dig curetcore.com +short
# Debe devolver: 147.93.177.156

# Verificar www
dig www.curetcore.com +short
# Debe devolver: 147.93.177.156 o curetcore.com
```

⏱️ **NOTA:** La propagación DNS puede tomar 5 minutos a 48 horas. En la práctica, suele ser < 1 hora.

### 1.2 Configurar EasyPanel

**Acceso:** https://panel.easypanel.io

**Pasos:**

1. **Login** en EasyPanel
2. **Navegar** a tu proyecto: `apps_sistema_de_importacion`
3. **Settings** → **Domains**
4. **Agregar nuevo dominio:**
   ```
   Domain: curetcore.com
   Enable SSL: ✅ Yes (Let's Encrypt automático)
   ```
5. **Agregar www (opcional):**
   ```
   Domain: www.curetcore.com
   Redirect to: curetcore.com
   Enable SSL: ✅ Yes
   ```
6. **Mantener dominio antiguo (transición de 30 días):**
   ```
   Domain: importacion.curetcore.com
   Enable SSL: ✅ Yes (mantener activo)
   ```

**Verificación:**

```bash
# Verificar SSL se generó correctamente (después de 2-5 min)
curl -I https://curetcore.com
# Debe devolver: HTTP/2 200

# Verificar certificado SSL
openssl s_client -connect curetcore.com:443 -servername curetcore.com < /dev/null 2>/dev/null | openssl x509 -noout -dates
```

### 1.3 Configurar Firewall (Si aplicable)

```bash
# En el servidor
sshpass -p 'Pitagora1844*' ssh root@147.93.177.156

# Verificar reglas actuales
iptables -L -n | grep 443

# Si usas UFW
ufw status
# Debe permitir 443/tcp (HTTPS)
```

---

## ⚙️ Fase 2: Variables de Entorno

**Duración:** 15-20 minutos
**Downtime:** 2-5 minutos (al reiniciar contenedor)

### 2.1 Variables de Entorno en Servidor (.env.local)

**⚠️ CRÍTICO:** Estos cambios requieren reinicio del contenedor.

```bash
# SSH al servidor
sshpass -p 'Pitagora1844*' ssh root@147.93.177.156

# Obtener nombre exacto del contenedor
docker ps --filter name=importacion

# Editar .env del contenedor (opción con archivo)
# NOTA: EasyPanel monta las variables desde su UI, NO desde archivo .env

# MEJOR OPCIÓN: Actualizar en EasyPanel UI
```

**En EasyPanel UI:**

1. Ir a `apps_sistema_de_importacion` → **Environment**
2. **Actualizar variables:**

```env
# ANTES:
NEXTAUTH_URL=https://importacion.curetcore.com

# DESPUÉS:
NEXTAUTH_URL=https://curetcore.com
```

3. **Agregar/Verificar variables NEXT*PUBLIC*\***

```env
NEXT_PUBLIC_API_URL=https://curetcore.com
NEXT_PUBLIC_PUSHER_KEY=3cc9bbd481f155c2d75c
NEXT_PUBLIC_PUSHER_CLUSTER=us2
NEXT_PUBLIC_ENABLE_REALTIME_NOTIFICATIONS=true
```

4. **Click "Save & Deploy"**

⏱️ **Downtime:** EasyPanel reiniciará el contenedor automáticamente (~2-5 min).

### 2.2 Variables de Entorno Locales (.env.production)

**En tu máquina local:**

```bash
cd /Users/ronaldopaulino/curet-importaciones
```

**Editar `.env.production`:**

```diff
# API URL
- NEXT_PUBLIC_API_URL=https://importacion.curetcore.com
+ NEXT_PUBLIC_API_URL=https://curetcore.com

# Pusher (sin cambios)
NEXT_PUBLIC_PUSHER_KEY=3cc9bbd481f155c2d75c
NEXT_PUBLIC_PUSHER_CLUSTER=us2

# Feature Flags (sin cambios)
NEXT_PUBLIC_ENABLE_REALTIME_NOTIFICATIONS=true
```

**Editar `.env.local` (si tienes):**

```diff
- NEXTAUTH_URL=https://importacion.curetcore.com
+ NEXTAUTH_URL=https://curetcore.com

- NEXTAUTH_SECRET=curet-importaciones-secret-key-2024-production-secure
+ NEXTAUTH_SECRET=curetcore-secret-key-2024-production-secure
```

### 2.3 Actualizar Dockerfile Build Args (si es necesario)

**El Dockerfile actual ya está preparado.** Solo verificar que EasyPanel pase los build args correctos:

**En EasyPanel UI** → **Build Settings:**

```env
DATABASE_URL=${DATABASE_URL}
NEXT_PUBLIC_API_URL=https://curetcore.com
NODE_ENV=production
NEXT_PUBLIC_PUSHER_KEY=3cc9bbd481f155c2d75c
NEXT_PUBLIC_PUSHER_CLUSTER=us2
NEXT_PUBLIC_ENABLE_REALTIME_NOTIFICATIONS=true
```

---

## 💻 Fase 3: Código y Assets

**Duración:** 45-60 minutos
**Downtime:** 0 minutos (cambios en local, deploy después)

### 3.1 Actualizar package.json

**Archivo:** `package.json`

```diff
{
-  "name": "sistema-importacion",
+  "name": "@curetcore/platform",
   "version": "1.0.0",
-  "description": "Sistema de importacion con control financiero automático",
+  "description": "CuretCore Platform - Enterprise Management SaaS (ERP modules: Imports, Inventory, Finance, HR)",
```

### 3.2 Renombrar Assets de Branding

**Imágenes actuales:**

```
public/images/isotipo-importacion.png
public/images/logotipo-importacion.png
public/images/logotipo-importacion-grisclaro.png
```

**Opción A - Renombrar archivos:**

```bash
cd public/images/

# Renombrar
mv isotipo-importacion.png isotipo.png
mv logotipo-importacion.png logotipo.png
mv logotipo-importacion-grisclaro.png logotipo-grisclaro.png
```

**Opción B - Copiar (mantener ambos durante transición):**

```bash
cd public/images/

# Copiar (recomendado para transición sin romper referencias)
cp isotipo-importacion.png isotipo.png
cp logotipo-importacion.png logotipo.png
cp logotipo-importacion-grisclaro.png logotipo-grisclaro.png
```

**Actualizar referencias en código:**

```bash
# Buscar todas las referencias
grep -r "logotipo-importacion" --include="*.tsx" --include="*.ts" .

# Archivos a actualizar:
# - components/layout/Navbar.tsx
# - scripts/generate-favicons.ts
```

### 3.3 Actualizar Navbar

**Archivo:** `components/layout/Navbar.tsx:19`

```diff
<Image
-  src="/images/logotipo-importacion-grisclaro.png"
+  src="/images/logotipo-grisclaro.png"
  alt="CuretCore"
  width={140}
  height={32}
  className="h-8 w-auto"
/>
```

### 3.4 Actualizar Scripts de Favicons

**Archivo:** `scripts/generate-favicons.ts`

```diff
// Línea 33
- const inputFile = path.join(INPUT_DIR, `${config.input}-importacion.png`)
+ const inputFile = path.join(INPUT_DIR, `${config.input}.png`)

// Línea 52
- const logoInput = path.join(INPUT_DIR, "logotipo-importacion.png")
+ const logoInput = path.join(INPUT_DIR, "logotipo.png")

// Línea 65
- const isotipoInput = path.join(INPUT_DIR, "isotipo-importacion.png")
+ const isotipoInput = path.join(INPUT_DIR, "isotipo.png")
```

### 3.5 Actualizar Textos de UI

**Archivos con textos de branding:**

#### `app/(auth)/login/page.tsx:107`

```diff
- <p className="text-xs text-gray-500">Sistema de gestión de importaciones</p>
+ <p className="text-xs text-gray-500">Enterprise Management Platform</p>
```

#### `app/auth/invitation/[token]/page.tsx:212`

```diff
- <CardDescription>Has sido invitado a unirte al Sistema de Importaciones</CardDescription>
+ <CardDescription>Has sido invitado a unirte a CuretCore Platform</CardDescription>
```

#### PDFs de Exportación (4 archivos)

**Archivos:**

- `app/(pages)/ordenes/page.tsx:218`
- `app/(pages)/pagos-china/page.tsx:234`
- `app/(pages)/gastos-logisticos/page.tsx:234`
- `app/(pages)/inventario-recibido/page.tsx:303`

```diff
- exportToPDF(dataToExport, "ordenes", "Órdenes de Compra - Sistema de Importaciones")
+ exportToPDF(dataToExport, "ordenes", "Órdenes de Compra - CuretCore")
```

### 3.6 Actualizar Email Service

**Archivo:** `lib/email/invitation-service.ts:6`

```diff
- const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@curetcore.com"
+ const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@curetcore.com" // ✅ Ya correcto

// Línea 84 (comentario)
- //   subject: "Invitación al Sistema de Importaciones",
+ //   subject: "Invitación a CuretCore Platform",
```

---

## 📚 Fase 4: Documentación

**Duración:** 30-60 minutos
**Downtime:** 0 minutos

### 4.1 Actualizar README.md Principal

**Archivo:** `README.md`

```diff
  <div align="center">
    <img src="public/images/isotipo.png" alt="CuretCore Logo" width="120" />
-   <h1>🏢 CuretCore - Sistema de Importaciones</h1>
+   <h1>🏢 CuretCore Platform</h1>
  </div>

- > **Sistema modular de gestión empresarial para retail, distribución e importación**
+ > **Enterprise Management Platform - Modular SaaS for retail, distribution, and operations**
  > Integrado con Shopify para ventas e inventario en tiempo real.

  ## 🎯 Visión General

- **CuretCore** es un ecosistema completo de aplicaciones empresariales construido con arquitectura de **monorepo** que permite crear y desplegar nuevos módulos en minutos con diseño consistente.
+ **CuretCore** es una plataforma empresarial modular tipo SaaS, construida con arquitectura de **monorepo**, similar a Odoo o Zoho, que permite gestionar todos los aspectos de tu negocio desde una única plataforma.

  Similar a **Odoo** o **Zoho**, CuretCore ofrece módulos especializados que se integran perfectamente:

- **Importaciones** - Órdenes de compra, proveedores, logística ✅
+ **Importaciones** - Órdenes de compra internacionales, proveedores, logística ✅
  - **Inventario** - Sincronizado con Shopify automáticamente 🔜
  - **Tesorería** - Bancos, tarjetas, cuadres de caja 🔜
  - **Contabilidad** - Reportes, P&L, Balance Sheet 🔜
  - **RRHH** - Nómina, adelantos, vacaciones 🔜
  - **Ventas** - Integración completa con Shopify POS 🔜

  **Arquitectura:** Monorepo modular con paquetes compartidos (UI, lógica, APIs) para escalabilidad máxima.
```

### 4.2 Buscar y Reemplazar en Documentación

**Automatizar con sed (macOS):**

```bash
# Backup de todos los .md primero
find docs -name "*.md" -exec cp {} {}.bak \;

# Reemplazar "Sistema de Importaciones" por "CuretCore Platform"
find docs -name "*.md" -type f -exec sed -i '' 's/Sistema de Importaciones/CuretCore Platform/g' {} +

# Reemplazar "sistema de importación" por "CuretCore"
find docs -name "*.md" -type f -exec sed -i '' 's/sistema de importación/CuretCore/gi' {} +

# Reemplazar dominio en docs
find docs -name "*.md" -type f -exec sed -i '' 's/importacion\.curetcore\.com/curetcore.com/g' {} +

# Verificar cambios
git diff docs/
```

**Archivos clave a revisar manualmente:**

- `EASYPANEL-DEPLOYMENT.md` - Actualizar referencias de dominio
- `docs/INDEX.md` - Tabla de contenidos principal
- `SETUP.md` - Instrucciones de setup
- `docs/CHECKLIST-PRODUCCION.md` - Checklist de producción

### 4.3 Actualizar Metadata de Proyecto

**Archivo:** `lib/full-text-search.ts:3`

```diff
- * Sistema de Importaciones - Curet
+ * CuretCore Platform - Full-text Search
```

---

## ✅ Fase 5: Validación

**Duración:** 30 minutos
**Objetivo:** Verificar que TODA la funcionalidad sigue operando correctamente

### 5.1 Checklist de Validación Post-Deploy

```bash
# 1. Verificar que el sitio carga
curl -I https://curetcore.com
# Esperar: HTTP/2 200

# 2. Verificar SSL
curl https://curetcore.com | grep -i "html"
# No debe mostrar errores de certificado

# 3. Verificar dominio antiguo (transición)
curl -I https://importacion.curetcore.com
# Debe seguir funcionando
```

### 5.2 Tests Funcionales Manuales

**Acceder a:** https://curetcore.com

- [ ] **Login:** Ingresar con usuario existente
  - Email: tu_email@curetcore.com
  - Password: tu_password
  - ✅ Debe iniciar sesión correctamente
  - ⚠️ Si falla: Verificar NEXTAUTH_URL en servidor

- [ ] **Dashboard:** Verificar que carga datos
  - ✅ Debe mostrar KPIs, gráficos, y actividad reciente

- [ ] **Pusher (Real-time):**
  - Abrir dos navegadores con usuarios diferentes
  - Crear una orden en navegador 1
  - ✅ Debe aparecer notificación toast en navegador 2

- [ ] **Órdenes de Compra:**
  - Crear nueva OC
  - ✅ Debe guardar correctamente
  - ✅ Debe aparecer en la lista

- [ ] **Uploads:**
  - Subir imagen a una OC
  - ✅ Debe subir correctamente
  - ✅ Debe verse la imagen después de refrescar

- [ ] **Exportar PDF:**
  - Exportar lista de órdenes a PDF
  - ✅ Verificar que el título dice "CuretCore" no "Sistema de Importaciones"

- [ ] **User Presence:**
  - Verificar que apareces como "Activo ahora" en usuarios conectados
  - ✅ Debe mostrar tu avatar y actividad

- [ ] **Notificaciones:**
  - Crear una acción (ej: nueva OC)
  - ✅ Debe aparecer notificación en campana
  - ✅ Marcar como leída debe persistir

### 5.3 Tests de Navegadores

- [ ] **Chrome/Edge:** Todo funcional
- [ ] **Firefox:** Todo funcional
- [ ] **Safari:** Todo funcional
- [ ] **Mobile (iPhone/Android):** Responsive OK

### 5.4 Verificar Logs del Servidor

```bash
# SSH al servidor
sshpass -p 'Pitagora1844*' ssh root@147.93.177.156

# Ver logs en tiempo real
docker logs -f apps_sistema_de_importacion.1.XXXXX --tail 100

# Buscar errores
docker logs apps_sistema_de_importacion.1.XXXXX 2>&1 | grep -i error | tail -50
```

**Errores esperables (normales):**

- ✅ Ninguno relacionado con NEXTAUTH_URL
- ✅ Ninguno relacionado con Pusher
- ✅ Ninguno relacionado con imágenes/assets

**Errores que requieren acción:**

- ❌ "NEXTAUTH_URL is not configured"
- ❌ "Pusher credentials are not configured"
- ❌ "Failed to fetch"
- ❌ "Cannot read property of undefined"

---

## 🔙 Rollback Plan

**Si algo sale mal, puedes revertir en < 10 minutos.**

### Rollback Rápido (Solo Variables de Entorno)

**En EasyPanel UI:**

1. Ir a `apps_sistema_de_importacion` → **Environment**
2. Revertir variables:

```env
NEXTAUTH_URL=https://importacion.curetcore.com
NEXT_PUBLIC_API_URL=https://importacion.curetcore.com
```

3. **Click "Save & Deploy"**
4. ⏱️ Esperar 2-5 min (reinicio de contenedor)

### Rollback Completo (Código + Infra)

**1. Revertir código en Git:**

```bash
# Volver al commit anterior
git log --oneline -5
git revert HEAD

# O hacer rollback a branch de backup
git checkout backup/pre-rebrand-YYYYMMDD
git push origin main --force
```

**2. EasyPanel hará auto-deploy** del código revertido

**3. Restaurar base de datos (si fue afectada):**

```bash
# SSH al servidor
sshpass -p 'Pitagora1844*' ssh root@147.93.177.156

# Restaurar desde backup
docker exec -i apps_postgres_sistemadechina pg_restore \
  -U postgres \
  -d apps \
  -c \
  < /tmp/backup_pre_rebrand_YYYYMMDD_HHMMSS.dump
```

**4. Verificar:**

```bash
curl -I https://importacion.curetcore.com
# Debe volver a funcionar
```

---

## 📋 Checklist Final

### Pre-Migración

- [ ] ✅ Backup de base de datos creado
- [ ] ✅ Backup de variables de entorno guardado
- [ ] ✅ Snapshot del servidor creado (Contabo)
- [ ] ✅ Branch de backup creado en Git
- [ ] ✅ DNS configurado y propagado (verificar con `dig curetcore.com`)
- [ ] ✅ EasyPanel tiene dominio curetcore.com configurado
- [ ] ✅ SSL generado correctamente (verificar con `curl -I https://curetcore.com`)

### Durante Migración

- [ ] ✅ Variables de entorno actualizadas en EasyPanel
- [ ] ✅ Contenedor reiniciado correctamente
- [ ] ✅ Variables de entorno locales actualizadas (.env.production)
- [ ] ✅ package.json actualizado (name, description)
- [ ] ✅ Assets renombrados (logotipos)
- [ ] ✅ Referencias en código actualizadas (Navbar, scripts, UI)
- [ ] ✅ Documentación actualizada (README, docs/)
- [ ] ✅ Commit y push a GitHub

### Post-Migración

- [ ] ✅ Login funciona en https://curetcore.com
- [ ] ✅ Pusher funciona (notificaciones en tiempo real)
- [ ] ✅ Dashboard carga datos correctamente
- [ ] ✅ Crear nueva orden funciona
- [ ] ✅ Subir imágenes funciona
- [ ] ✅ Exportar PDF muestra branding correcto
- [ ] ✅ User presence funciona
- [ ] ✅ Notificaciones funcionan y persisten
- [ ] ✅ Logs del servidor sin errores críticos
- [ ] ✅ Dominio antiguo sigue funcionando (transición)

### Cleanup (Después de 30 días)

- [ ] Remover dominio antiguo de EasyPanel
- [ ] Remover DNS de importacion.curetcore.com
- [ ] Eliminar imágenes antiguas (-importacion.png)
- [ ] Eliminar backups antiguos

---

## 🎯 Orden de Ejecución Recomendado

### 🟢 **Opción A: Migración Gradual (RECOMENDADO para producción)**

**Día 1 - Preparación:**

1. ✅ DNS + EasyPanel (agregar curetcore.com SIN remover dominio antiguo)
2. ✅ Esperar propagación DNS (1-24h)

**Día 2 - Variables de Entorno:** 3. ✅ Actualizar NEXTAUTH_URL en servidor (downtime 2-5 min) 4. ✅ Validar login funciona en ambos dominios

**Día 3 - Código:** 5. ✅ Actualizar código local (package.json, assets, referencias) 6. ✅ Commit + push → Auto-deploy en EasyPanel 7. ✅ Validación completa

**Día 4-30 - Transición:** 8. ✅ Ambos dominios activos 9. ✅ Comunicar nuevo dominio a usuarios 10. ✅ Monitorear logs por 30 días

**Día 30 - Cleanup:** 11. ✅ Remover dominio antiguo

### 🟡 **Opción B: Migración Rápida (1-2 horas)**

**Solo si tienes confianza y pocos usuarios activos:**

1. ✅ Comunicar mantenimiento programado (1 hora)
2. ✅ Ejecutar Fase 1-5 en secuencia
3. ✅ Validación completa
4. ✅ Comunicar fin de mantenimiento

---

## 📞 Contactos de Emergencia

**Si algo falla:**

1. **Rollback inmediato** (ver sección Rollback Plan)
2. **Verificar logs** del servidor
3. **Contactar equipo** (si aplica)

**Recursos:**

- EasyPanel Docs: https://easypanel.io/docs
- Next.js Docs: https://nextjs.org/docs
- NextAuth Docs: https://next-auth.js.org/configuration/options

---

## ✨ Resultado Esperado

Después de completar esta migración:

✅ **Dominio principal:** https://curetcore.com
✅ **Branding:** CuretCore Platform (en lugar de Sistema de Importaciones)
✅ **Package name:** @curetcore/platform
✅ **Preparado para:** Arquitectura monorepo con múltiples módulos
✅ **Sin pérdida de datos:** Toda la información se mantiene intacta
✅ **Downtime total:** < 5 minutos

🎉 **¡Tu aplicación está lista para evolucionar de módulo único a plataforma SaaS completa!**

---

**Documentación creada:** 2025-11-22
**Versión:** 1.0
**Autor:** Claude Code + Equipo CuretCore
**Estado:** ✅ Lista para ejecución
