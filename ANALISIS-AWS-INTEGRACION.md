# Análisis de Integración AWS - CuretCore Platform

**Fecha**: 21 de Noviembre 2025
**Documento**: Análisis y Plan de Implementación AWS
**Módulo Inicial**: Sistema de Importaciones
**Alcance**: Toda la plataforma CuretCore (monorepo)

---

## 📋 Índice

1. [Situación Actual](#situación-actual)
2. [Problemas Identificados](#problemas-identificados)
3. [Servicios AWS Propuestos](#servicios-aws-propuestos)
4. [Beneficios Específicos](#beneficios-específicos)
5. [Análisis de Costos](#análisis-de-costos)
6. [Arquitectura Propuesta](#arquitectura-propuesta)
7. [Plan de Implementación](#plan-de-implementación)
8. [Comparativa Antes/Después](#comparativa-antesdespués)
9. [Conclusiones](#conclusiones)

---

## 🔍 Situación Actual

### Módulo de Importaciones (Actual)

**Entidades principales con archivos adjuntos:**

- **OC China**: Órdenes de compra con fotos de productos y PDFs
- **Pagos China**: Pagos con recibos y comprobantes
- **Gastos Logísticos**: Facturas, recibos y documentos varios

**Almacenamiento actual:**

```typescript
// Configuración actual en app/api/upload/route.ts
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

// Estructura de carpetas
/public/uploads/
  ├── oc-china/
  ├── pagos-china/
  └── gastos-logisticos/
```

**Base de datos:**

- PostgreSQL en Docker
- Sin backups automáticos configurados
- Sin alta disponibilidad

**Email:**

- Resend API (presentando fallas intermitentes)
- Usado para invitaciones de usuarios
- No hay sistema de notificaciones por email

---

## ⚠️ Problemas Identificados

### 1. Almacenamiento de Archivos

| Problema                                  | Impacto                                                                   | Severidad  |
| ----------------------------------------- | ------------------------------------------------------------------------- | ---------- |
| **Archivos en sistema de archivos local** | Si el servidor falla, se pierden todos los archivos                       | 🔴 CRÍTICO |
| **No hay redundancia**                    | Sin respaldo automático de archivos                                       | 🔴 CRÍTICO |
| **Límite de espacio en disco**            | El servidor puede quedarse sin espacio                                    | 🟡 MEDIO   |
| **Sin CDN**                               | Los archivos consumen recursos del servidor                               | 🟡 MEDIO   |
| **Problemas con Docker volumes**          | Si el contenedor se recrea sin volume mount correcto, se pierden archivos | 🔴 CRÍTICO |

### 2. Base de Datos

| Problema                                              | Impacto                                            | Severidad  |
| ----------------------------------------------------- | -------------------------------------------------- | ---------- |
| **PostgreSQL en Docker sin configuración de backups** | Pérdida de datos si el contenedor falla            | 🔴 CRÍTICO |
| **Sin alta disponibilidad**                           | Si el servidor cae, el sistema completo se detiene | 🔴 CRÍTICO |
| **Backups manuales**                                  | Propenso a error humano                            | 🟡 MEDIO   |

### 3. Emails

| Problema                                    | Impacto                                     | Severidad |
| ------------------------------------------- | ------------------------------------------- | --------- |
| **Resend API no confiable**                 | Invitaciones no llegan consistentemente     | 🟠 ALTO   |
| **Sin sistema de notificaciones por email** | Los usuarios no reciben alertas importantes | 🟡 MEDIO  |
| **Dependencia de tercero no enterprise**    | No hay SLA garantizado                      | 🟡 MEDIO  |

### 4. Escalabilidad

| Problema                            | Impacto                                       | Severidad |
| ----------------------------------- | --------------------------------------------- | --------- |
| **Arquitectura no escalable**       | No puede manejar múltiples módulos fácilmente | 🟠 ALTO   |
| **Sin procesamiento en background** | Tareas pesadas bloquean el servidor           | 🟡 MEDIO  |
| **Sin CDN para assets estáticos**   | Rendimiento limitado para usuarios remotos    | 🟡 MEDIO  |

---

## ☁️ Servicios AWS Propuestos

### 1. AWS S3 (Simple Storage Service)

**Para qué:**

- Almacenar todos los archivos adjuntos (fotos, PDFs, documentos)
- Servir como almacenamiento ilimitado y redundante

**Características clave:**

- ✅ Durabilidad 99.999999999% (11 nueves)
- ✅ Almacenamiento ilimitado
- ✅ Versionado de archivos
- ✅ Lifecycle policies (mover a Glacier archivos antiguos para ahorrar)
- ✅ Presigned URLs para seguridad
- ✅ Integración con CloudFront (CDN)

**Uso específico en el sistema:**

```typescript
// Estructura propuesta de buckets
curetcore-uploads-production/
  ├── importaciones/
  │   ├── oc-china/
  │   ├── pagos-china/
  │   └── gastos-logisticos/
  ├── [futuro-modulo-1]/
  └── [futuro-modulo-2]/
```

### 2. AWS SES (Simple Email Service)

**Para qué:**

- Envío de invitaciones de usuarios
- Notificaciones por email
- Reportes automáticos

**Características clave:**

- ✅ 99.9% uptime SLA
- ✅ Deliverability mejorada (reputación de Amazon)
- ✅ Tracking de emails (opens, clicks, bounces)
- ✅ Templates de emails
- ✅ Configuración de dominio personalizado

**Costo:**

- $0.10 por 1,000 emails (vs Resend: $20/mes por 3,000 emails)

### 3. AWS RDS (Relational Database Service) - PostgreSQL

**Para qué:**

- Base de datos PostgreSQL administrada
- Backups automáticos
- Alta disponibilidad

**Características clave:**

- ✅ Backups automáticos diarios (retention configurable)
- ✅ Point-in-time recovery
- ✅ Multi-AZ deployment (alta disponibilidad)
- ✅ Snapshots manuales
- ✅ Escalamiento vertical sin downtime
- ✅ Monitoreo con CloudWatch

**Configuración recomendada inicial:**

```
Instancia: db.t4g.micro (2 vCPU, 1GB RAM)
Storage: 20GB SSD (auto-scaling hasta 100GB)
Multi-AZ: No (inicialmente, habilitar en producción)
Backup retention: 7 días
```

### 4. AWS Lambda (Opcional pero Recomendado)

**Para qué:**

- Procesamiento de archivos en background
- Resize automático de imágenes
- Generación de reportes
- Limpieza de archivos temporales

**Características clave:**

- ✅ Pago por uso (solo cuando se ejecuta)
- ✅ Escalamiento automático
- ✅ Sin administración de servidores
- ✅ Integración con S3 (triggers automáticos)

**Casos de uso específicos:**

```typescript
// 1. Cuando se sube una imagen a S3
S3 → Lambda → Resize imagen → Guardar thumbnails

// 2. Cuando se sube un PDF
S3 → Lambda → Extraer texto → Indexar para búsqueda

// 3. Reportes programados
EventBridge (cron) → Lambda → Generar PDF → Enviar por SES
```

---

## 🎯 Beneficios Específicos

### Beneficios Técnicos

| Área               | Beneficio                                          | Impacto                            |
| ------------------ | -------------------------------------------------- | ---------------------------------- |
| **Disponibilidad** | 99.99% uptime en S3, SES y RDS                     | Sistema siempre disponible         |
| **Seguridad**      | Archivos no públicos, URLs firmadas con expiración | Mayor control de acceso            |
| **Backups**        | Automáticos diarios + snapshots                    | Recuperación ante desastres        |
| **Escalabilidad**  | Ilimitada en S3, automática en Lambda              | Soporta crecimiento                |
| **Rendimiento**    | CDN global con CloudFront                          | Carga rápida desde cualquier lugar |

### Beneficios Operacionales

| Área              | Beneficio                                     | Impacto                     |
| ----------------- | --------------------------------------------- | --------------------------- |
| **Costo**         | Pago por uso real, no por capacidad reservada | Ahorro vs servidor dedicado |
| **Mantenimiento** | AWS gestiona actualizaciones y parches        | Menos trabajo operacional   |
| **Monitoreo**     | CloudWatch incluido                           | Visibilidad completa        |
| **Compliance**    | Certificaciones de seguridad de AWS           | Auditorías más fáciles      |

### Beneficios para el Negocio

| Área                | Beneficio                            | Impacto                      |
| ------------------- | ------------------------------------ | ---------------------------- |
| **Confiabilidad**   | Emails de invitación siempre llegan  | Mejor onboarding de usuarios |
| **Profesionalismo** | Infraestructura enterprise-grade     | Credibilidad con clientes    |
| **Agilidad**        | Nuevos módulos usan mismos servicios | Desarrollo más rápido        |
| **Datos seguros**   | Sin riesgo de pérdida de información | Tranquilidad                 |

---

## 💰 Análisis de Costos

### Estimación Mensual (Escenario Inicial)

#### AWS S3

```
Almacenamiento: 20GB × $0.023/GB = $0.46/mes
Requests (PUT/GET): ~10,000 requests × $0.0004 = $4.00/mes
Transfer out: ~5GB × $0.09/GB = $0.45/mes

Total S3: ~$5/mes
```

#### AWS SES

```
Primeros 62,000 emails/mes: GRATIS (desde EC2)
Después: $0.10 por 1,000 emails

Estimado inicial: ~1,000 emails/mes = GRATIS

Total SES: $0/mes inicialmente
```

#### AWS RDS (PostgreSQL)

```
db.t4g.micro: $0.016/hora × 730 horas = $11.68/mes
Storage: 20GB × $0.115/GB = $2.30/mes
Backups: 20GB × $0.095/GB = $1.90/mes

Total RDS: ~$16/mes
```

#### AWS Lambda (Uso estimado bajo)

```
Primeros 1M requests/mes: GRATIS
Primeros 400,000 GB-seconds: GRATIS

Estimado inicial: GRATIS (dentro del free tier)

Total Lambda: $0/mes inicialmente
```

### **TOTAL ESTIMADO: ~$21/mes**

### Comparación con Alternativas

| Servicio  | Actual                  | AWS                 | Ahorro Anual       |
| --------- | ----------------------- | ------------------- | ------------------ |
| Emails    | Resend $20/mes          | SES $0/mes          | $240/año           |
| Storage   | Servidor local (riesgo) | S3 $5/mes           | N/A (seguridad)    |
| Database  | PostgreSQL Docker       | RDS $16/mes         | N/A (backups)      |
| **TOTAL** | $20/mes + riesgos       | $21/mes sin riesgos | Valor incalculable |

> **Nota**: Los costos de AWS pueden parecer similares, pero el valor real está en:
>
> - Eliminación de riesgos de pérdida de datos
> - Alta disponibilidad garantizada
> - Escalabilidad automática
> - Backups automáticos
> - Infraestructura enterprise

---

## 🏗️ Arquitectura Propuesta

### Flujo de Archivos (Actual vs AWS)

**ACTUAL:**

```
Usuario → Next.js → File System Local → Public URL
                     ⚠️ Sin respaldo
                     ⚠️ Sin redundancia
```

**CON AWS:**

```
Usuario → Next.js → S3 Bucket → CloudFront CDN → Usuario
                     ✅ Respaldo automático
                     ✅ Redundancia multi-AZ
                     ✅ URLs firmadas
                     ✅ CDN global
```

### Flujo de Emails (Actual vs AWS)

**ACTUAL:**

```
Sistema → Resend API → Email
           ⚠️ Fallas intermitentes
```

**CON AWS:**

```
Sistema → AWS SES → Email
           ✅ 99.9% SLA
           ✅ Tracking incluido
           ✅ Dominio verificado
```

### Arquitectura Completa Propuesta

```
┌─────────────────────────────────────────────────────────┐
│                    USUARIOS                              │
└────────────────────┬────────────────────────────────────┘
                     │
            ┌────────▼────────┐
            │   CloudFront    │ (CDN - Opcional)
            │   (Assets)      │
            └────────┬────────┘
                     │
         ┌───────────▼──────────────┐
         │  Next.js App (Docker)    │
         │  - API Routes            │
         │  - Server Components     │
         └─┬────────┬────────┬──────┘
           │        │        │
    ┌──────▼───┐ ┌─▼──────┐ ┌▼────────┐
    │  AWS S3  │ │AWS RDS │ │ AWS SES │
    │(Storage) │ │(DB)    │ │(Email)  │
    └──────┬───┘ └────────┘ └─────────┘
           │
    ┌──────▼───────┐
    │ AWS Lambda   │ (Procesamiento background)
    │ - Resize     │
    │ - Reports    │
    └──────────────┘
```

---

## 📝 Plan de Implementación

### Fase 1: Preparación (1-2 días)

1. **Configuración de cuenta AWS**
   - Crear cuenta AWS (si no existe)
   - Configurar IAM users y roles
   - Habilitar MFA
   - Configurar billing alerts

2. **Crear recursos base**
   - Bucket S3 para uploads
   - Verificar dominio en SES
   - Crear instancia RDS (staging primero)

3. **Configurar SDK**
   ```bash
   npm install @aws-sdk/client-s3 @aws-sdk/client-ses @aws-sdk/s3-request-presigner
   ```

### Fase 2: Implementación S3 (2-3 días)

1. **Crear servicio de S3**

   ```typescript
   // packages/shared/src/aws/s3-service.ts
   ;-uploadFile() - deleteFile() - getSignedUrl() - listFiles()
   ```

2. **Migrar endpoint de upload**
   - Modificar `app/api/upload/route.ts` para usar S3
   - Mantener validaciones de seguridad
   - Agregar presigned URLs

3. **Migrar archivos existentes**
   - Script para mover archivos de `/public/uploads` a S3
   - Actualizar URLs en base de datos

### Fase 3: Implementación SES (1 día)

1. **Crear servicio de email**

   ```typescript
   // packages/shared/src/aws/ses-service.ts
   ;-sendEmail() - sendTemplatedEmail() - verifyEmail()
   ```

2. **Migrar de Resend a SES**
   - Reemplazar `lib/email/resend-client.ts`
   - Mantener misma interfaz para no romper código existente
   - Verificar dominio en SES

### Fase 4: Implementación RDS (2-3 días)

1. **Crear instancia RDS**
   - PostgreSQL 16
   - db.t4g.micro inicial
   - Configurar backups automáticos

2. **Migrar base de datos**
   - Dump de DB actual
   - Restore en RDS
   - Actualizar `DATABASE_URL`
   - Validar funcionamiento

3. **Configurar backups**
   - Retention de 7 días
   - Window de backup en horario bajo
   - Crear snapshot manual inicial

### Fase 5: Lambda (Opcional - 2-3 días)

1. **Crear funciones Lambda**
   - Image resize on upload
   - PDF text extraction
   - Report generation

2. **Configurar triggers**
   - S3 events → Lambda
   - EventBridge schedule → Lambda

### Fase 6: Testing y Validación (2 días)

1. **Testing funcional**
   - Upload de archivos
   - Envío de emails
   - Queries a RDS
   - Lambda functions

2. **Testing de seguridad**
   - Presigned URLs funcionan y expiran
   - No hay acceso público no autorizado
   - Logs de auditoría funcionan

3. **Testing de performance**
   - Medir tiempos de carga
   - Verificar CDN (si se usa)
   - Load testing básico

---

## 📊 Comparativa Antes/Después

### Almacenamiento

| Aspecto     | ANTES                | DESPUÉS                 |
| ----------- | -------------------- | ----------------------- |
| Ubicación   | File system local    | AWS S3                  |
| Capacidad   | Limitada por disco   | Ilimitada               |
| Redundancia | ❌ Ninguna           | ✅ Multi-AZ automática  |
| Backup      | ❌ Manual            | ✅ Automático           |
| CDN         | ❌ No                | ✅ CloudFront opcional  |
| URLs        | Públicas siempre     | Firmadas con expiración |
| Costo       | Incluido en servidor | $5/mes                  |

### Base de Datos

| Aspecto             | ANTES                    | DESPUÉS              |
| ------------------- | ------------------------ | -------------------- |
| Plataforma          | PostgreSQL Docker        | AWS RDS PostgreSQL   |
| Backups             | ❌ Manual/No configurado | ✅ Automático diario |
| Alta disponibilidad | ❌ No                    | ✅ Multi-AZ opcional |
| Recovery            | ❌ Manual                | ✅ Point-in-time     |
| Monitoreo           | Básico                   | CloudWatch completo  |
| Costo               | Incluido en servidor     | $16/mes              |

### Emails

| Aspecto        | ANTES           | DESPUÉS          |
| -------------- | --------------- | ---------------- |
| Proveedor      | Resend          | AWS SES          |
| Confiabilidad  | ⚠️ Intermitente | ✅ 99.9% SLA     |
| Costo          | $20/mes         | $0-1/mes         |
| Tracking       | Básico          | Completo         |
| Templates      | Limited         | Completo         |
| Deliverability | Variable        | Enterprise-grade |

---

## ✅ Conclusiones

### Recomendaciones

1. **IMPLEMENTAR AWS ES ALTAMENTE RECOMENDADO**
   - Resuelve problemas críticos de seguridad de datos
   - Costo similar pero valor significativamente mayor
   - Infraestructura preparada para escalar

2. **PRIORIDAD DE IMPLEMENTACIÓN**
   - **Alta**: S3 (resolver riesgo de pérdida de archivos)
   - **Alta**: RDS (backups automáticos)
   - **Media**: SES (mejorar emails)
   - **Baja**: Lambda (optimización futura)

3. **ORDEN SUGERIDO**
   ```
   1. RDS (mover DB a ambiente seguro) - 2-3 días
   2. S3 (proteger archivos existentes) - 2-3 días
   3. SES (mejorar emails) - 1 día
   4. Lambda (cuando se necesite) - Future
   ```

### Próximos Pasos

1. **Aprobación de presupuesto**: ~$21/mes
2. **Crear cuenta AWS** (si no existe)
3. **Implementar en orden de prioridad**
4. **Documentar credenciales de forma segura**
5. **Capacitar al equipo en herramientas AWS**

### Notas Importantes

- ⚠️ **Credenciales AWS**: Nunca commitear en Git, usar variables de entorno
- ⚠️ **Costos**: Configurar billing alerts en AWS ($25, $50, $100)
- ⚠️ **Backup pre-migración**: Hacer backup completo antes de migrar a RDS
- ✅ **Free Tier**: AWS ofrece 12 meses de free tier para nuevas cuentas

---

**Documento preparado por**: Claude (AI Assistant)
**Para**: CuretCore Platform
**Fecha**: Noviembre 21, 2025

_Este documento debe revisarse y actualizarse periódicamente según evolucionen las necesidades del sistema._
