# 🚀 Planes de Implementación Futura

**Fecha de creación:** Noviembre 2025
**Estado:** Documentación para referencia futura

---

## 📋 Índice

1. [Sentry - Error Tracking](#-sentry---error-tracking)
2. [AWS SES - Email Service](#-aws-ses---email-service)
3. [Priorización y Timeline](#-priorización-y-timeline)

---

## 🔍 Sentry - Error Tracking

### ¿Qué es Sentry?

**Sentry** es una plataforma de monitoreo de errores en tiempo real que permite:

- **Ver errores de producción** al instante que ocurren
- **Stack traces completos** con contexto del usuario
- **Alertas automáticas** por email/Slack cuando algo falla
- **Performance monitoring** (tiempos de carga, API calls lentos)
- **Release tracking** (saber qué versión causó un error)

### ¿Por qué Sentry?

| Problema Actual                               | Con Sentry                                    |
| --------------------------------------------- | --------------------------------------------- |
| Usuarios reportan bugs manualmente            | Errores aparecen automáticamente en dashboard |
| No sabemos cuándo algo falla                  | Alertas en tiempo real                        |
| Difícil reproducir errores                    | Stack trace + contexto completo               |
| No sabemos qué tan frecuentes son los errores | Gráficos de frecuencia y tendencias           |

### Plan de Implementación

#### Fase 1: Setup Básico (1 hora)

```bash
# 1. Instalar paquete
npm install @sentry/nextjs

# 2. Configurar con wizard
npx @sentry/wizard@latest -i nextjs
```

El wizard automáticamente:

- Crea cuenta en Sentry (gratis para 5,000 errores/mes)
- Genera `sentry.client.config.ts` y `sentry.server.config.ts`
- Configura `next.config.js` con Sentry
- Genera DSN (clave de conexión)

#### Fase 2: Configuración Avanzada (30 min)

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Solo en producción
  enabled: process.env.NODE_ENV === "production",

  // Nombre del ambiente
  environment: process.env.NODE_ENV,

  // Versión de la app (útil para tracking)
  release: process.env.NEXT_PUBLIC_APP_VERSION,

  // Tracking de performance
  tracesSampleRate: 1.0, // 100% de transacciones (ajustar si hay mucho tráfico)

  // Filtrar errores conocidos
  ignoreErrors: [
    "ResizeObserver loop limit exceeded", // Error inofensivo de Chrome
    "Non-Error promise rejection captured", // Promesas rechazadas sin throw
  ],

  // Capturar info del usuario (sin PII)
  beforeSend(event, hint) {
    // No enviar passwords ni tokens
    if (event.request) {
      delete event.request.cookies
      delete event.request.headers
    }
    return event
  },
})
```

#### Fase 3: Integración con la App (30 min)

**1. Error Boundaries personalizados**

```typescript
// components/ErrorBoundary.tsx
import * as Sentry from "@sentry/nextjs"
import { ErrorBoundary as SentryErrorBoundary } from "@sentry/react"

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <SentryErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Algo salió mal
          </h1>
          <p className="text-gray-600 mb-4">
            El error ha sido reportado automáticamente.
          </p>
          <button
            onClick={resetError}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Intentar de nuevo
          </button>
        </div>
      )}
      onError={(error, errorInfo) => {
        console.error("Error capturado:", error, errorInfo)
      }}
    >
      {children}
    </SentryErrorBoundary>
  )
}
```

**2. Tracking de usuario**

```typescript
// lib/sentry-user.ts
import * as Sentry from "@sentry/nextjs"

export function identifyUser(user: { id: string; email: string; role: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email, // Solo si tienes permiso GDPR
    role: user.role,
  })
}

export function clearUser() {
  Sentry.setUser(null)
}
```

**3. Tracking manual de errores**

```typescript
// En cualquier try/catch
try {
  await apiCall()
} catch (error) {
  // Sentry captura automáticamente errores no manejados,
  // pero puedes agregar contexto adicional
  Sentry.captureException(error, {
    tags: {
      module: "pagos",
      action: "crear-pago",
    },
    extra: {
      ordenId: ordenId,
      monto: monto,
    },
  })

  throw error
}
```

#### Fase 4: Alertas y Notificaciones (15 min)

**Configurar en Sentry Dashboard:**

1. **Alertas por Slack/Email** cuando:
   - Un nuevo error aparece por primera vez
   - Un error ocurre más de 10 veces en 1 hora
   - Performance degrada (>2s de carga)

2. **Releases tracking:**
   ```bash
   # Al hacer deploy
   npx sentry-cli releases new "v1.5.0"
   npx sentry-cli releases finalize "v1.5.0"
   ```

### Costo

| Plan          | Eventos/Mes | Costo    | Recomendación         |
| ------------- | ----------- | -------- | --------------------- |
| **Developer** | 5,000       | **$0**   | ✅ Ideal para empezar |
| Team          | 50,000      | $26/mes  | Para escalar          |
| Business      | 100,000+    | $80+/mes | Empresas grandes      |

**Recomendación:** Empezar con plan gratuito (5,000 errores/mes es suficiente para apps medianas).

### Beneficios Esperados

- ✅ **Detección proactiva** de errores antes que los usuarios reporten
- ✅ **Debugging 10x más rápido** con stack traces completos
- ✅ **Métricas de estabilidad** (% de usuarios afectados)
- ✅ **Performance insights** (qué endpoints son lentos)
- ✅ **Historial de errores** para análisis de tendencias

### Checklist de Implementación

- [ ] Crear cuenta en Sentry (https://sentry.io)
- [ ] Instalar `@sentry/nextjs`
- [ ] Configurar DSN en `.env.production`
- [ ] Configurar `sentry.client.config.ts`
- [ ] Configurar `sentry.server.config.ts`
- [ ] Agregar Error Boundaries en componentes críticos
- [ ] Configurar alertas en dashboard de Sentry
- [ ] Probar captura de errores en staging
- [ ] Deploy a producción
- [ ] Monitorear errores en primeras 48 horas

---

## 📧 AWS SES - Email Service

### ¿Qué es AWS SES?

**Amazon Simple Email Service** es el servicio de emails de AWS, usado por empresas como Uber, Netflix, y Airbnb.

### Estado Actual

**Resend removido completamente** (Noviembre 2025):

- ❌ Email automático deshabilitado
- ✅ Sistema de invitaciones funcional (genera URLs)
- ✅ Admin copia link manualmente y comparte por WhatsApp/Slack

**Por qué removimos Resend:**

- ⚠️ Servicio intermitente (invitaciones no llegaban)
- 💰 Costo: $20/mes solo para emails
- 🔄 AWS SES es más confiable y económico

### Ventajas de AWS SES

| Aspecto            | Resend   | AWS SES                        |
| ------------------ | -------- | ------------------------------ |
| **Confiabilidad**  | 90-95%   | 99.9% SLA                      |
| **Costo**          | $20/mes  | $0/mes (primeros 62,000)       |
| **Deliverability** | Buena    | Excelente (reputación AWS)     |
| **Tracking**       | Básico   | Avanzado (bounces, complaints) |
| **Escalabilidad**  | Limitada | Ilimitada                      |
| **Soporte**        | Email    | AWS Support                    |

### Plan de Implementación

#### Fase 1: Setup de AWS SES (1 hora)

**1. Crear cuenta AWS (si no existe)**

```bash
# Ir a: https://aws.amazon.com
# Crear cuenta (tarjeta de crédito requerida)
# No se cobra hasta superar free tier
```

**2. Verificar dominio en SES**

```bash
# Ir a AWS Console → SES → Verified Identities
# Agregar dominio: curetcore.com
# Agregar registros DNS (TXT, CNAME, MX)
```

Registros DNS a agregar:

```
Tipo: TXT
Nombre: _amazonses.curetcore.com
Valor: [generado por AWS]

Tipo: CNAME
Nombre: xxxxx._domainkey.curetcore.com
Valor: [generado por AWS]

Tipo: MX
Nombre: curetcore.com
Valor: 10 feedback-smtp.us-east-1.amazonses.com
```

**3. Salir de Sandbox Mode**

AWS SES empieza en "sandbox" (solo puede enviar a emails verificados).

Para salir y enviar a cualquier email:

1. Ir a SES → Account Dashboard
2. Click "Request production access"
3. Llenar formulario (aprobar en 24-48 horas)

#### Fase 2: Implementar Servicio de Email (2 horas)

**1. Instalar AWS SDK**

```bash
npm install @aws-sdk/client-ses
```

**2. Crear servicio de SES**

```typescript
// lib/aws/ses-service.ts
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"

const ses = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

interface SendEmailParams {
  from: string
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export async function sendEmailWithSES(params: SendEmailParams) {
  const { from, to, subject, html, text } = params

  const command = new SendEmailCommand({
    Source: from,
    Destination: {
      ToAddresses: Array.isArray(to) ? to : [to],
    },
    Message: {
      Subject: { Data: subject },
      Body: {
        Html: { Data: html },
        Text: { Data: text || html.replace(/<[^>]*>/g, "") }, // Fallback text
      },
    },
  })

  try {
    const response = await ses.send(command)
    console.log("✅ Email enviado:", response.MessageId)
    return { success: true, messageId: response.MessageId }
  } catch (error) {
    console.error("❌ Error enviando email:", error)
    throw error
  }
}
```

**3. Template de invitación**

```typescript
// lib/email/templates/invitation.ts
export function getInvitationEmailHTML(params: {
  recipientName: string
  invitationUrl: string
  role: string
  invitedBy: string
}) {
  const { recipientName, invitationUrl, role, invitedBy } = params

  const roleNames = {
    limitado: "Usuario Limitado",
    admin: "Administrador",
    superadmin: "Super Administrador",
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #4F46E5;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CuretCore - Sistema de Importaciones</h1>
          </div>
          <div class="content">
            <h2>Hola ${recipientName || ""},</h2>
            <p>Has sido invitado a unirte al Sistema de Importaciones de CuretCore.</p>
            <p><strong>Rol asignado:</strong> ${roleNames[role as keyof typeof roleNames]}</p>
            <p><strong>Invitado por:</strong> ${invitedBy}</p>
            <p>Haz clic en el siguiente botón para completar tu registro:</p>
            <a href="${invitationUrl}" class="button">Aceptar Invitación</a>
            <p style="color: #6b7280; font-size: 14px;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <code>${invitationUrl}</code>
            </p>
            <p style="color: #6b7280; font-size: 12px;">
              Este enlace expirará en 7 días.
            </p>
          </div>
          <div class="footer">
            <p>© 2025 CuretCore. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `
}
```

#### Fase 3: Actualizar Invitation Service (30 min)

```typescript
// lib/email/invitation-service.ts
import { sendEmailWithSES } from "@/lib/aws/ses-service"
import { getInvitationEmailHTML } from "@/lib/email/templates/invitation"

// ... código existente ...

// Reemplazar la sección comentada de email:
const emailHtml = getInvitationEmailHTML({
  recipientName: input.email.split("@")[0], // O nombre si lo tenemos
  invitationUrl,
  role: input.role,
  invitedBy: input.invitedBy,
})

await sendEmailWithSES({
  from: process.env.SES_FROM_EMAIL || "noreply@curetcore.com",
  to: input.email,
  subject: "Invitación al Sistema de Importaciones - CuretCore",
  html: emailHtml,
})

console.log("✅ Email de invitación enviado correctamente")
```

#### Fase 4: Variables de Entorno (5 min)

```env
# .env.production
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
SES_FROM_EMAIL=noreply@curetcore.com
```

**⚠️ IMPORTANTE:** Usar IAM User con permisos mínimos:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ses:SendEmail", "ses:SendRawEmail"],
      "Resource": "*"
    }
  ]
}
```

### Costo

| Volumen                        | Costo AWS SES | Costo Resend |
| ------------------------------ | ------------- | ------------ |
| **Primeros 62,000 emails/mes** | **$0**        | $20/mes      |
| 100,000 emails/mes             | $10           | $50/mes      |
| 1 millón emails/mes            | $100          | $400/mes     |

**Conclusión:** AWS SES es **gratis** para volúmenes pequeños y **4x más barato** a escala.

### Funcionalidades Avanzadas (Futuro)

Una vez implementado SES básico, se puede agregar:

**1. Email Templates (plantillas reutilizables)**

```typescript
// Para emails recurrentes: reseteo de password, notificaciones, reportes
```

**2. Tracking de Bounces y Complaints**

```typescript
// Detectar emails inválidos, marcarlos en BD
```

**3. Emails transaccionales automáticos**

```typescript
// Notificar cuando una orden está lista, recordatorios de pagos, etc.
```

**4. Reportes por email**

```typescript
// Enviar reporte semanal/mensual automáticamente
```

### Checklist de Implementación

- [ ] Crear cuenta AWS
- [ ] Verificar dominio curetcore.com en SES
- [ ] Agregar registros DNS (TXT, CNAME, MX)
- [ ] Solicitar salir de Sandbox Mode
- [ ] Crear IAM User con permisos SES
- [ ] Instalar `@aws-sdk/client-ses`
- [ ] Implementar `lib/aws/ses-service.ts`
- [ ] Crear template de email de invitación
- [ ] Actualizar `invitation-service.ts`
- [ ] Agregar variables de entorno AWS
- [ ] Probar envío en desarrollo
- [ ] Probar envío en producción
- [ ] Validar deliverability (inbox, no spam)

---

## 📅 Priorización y Timeline

### Orden Recomendado

**1. AWS SES** (Prioridad Alta - 1 día)

- **Por qué primero:** Restaura funcionalidad crítica (invitaciones)
- **Impacto:** Alto - emails son esenciales para onboarding
- **Dificultad:** Media - setup de DNS + código
- **Dependencias:** Ninguna

**2. Sentry** (Prioridad Media - 2 horas)

- **Por qué después:** Mejora el debugging pero no bloquea funcionalidad
- **Impacto:** Medio - mejora visibilidad de errores
- **Dificultad:** Baja - wizard automático
- **Dependencias:** Ninguna

### Timeline Estimado

```
Semana 1:
└─ AWS SES
   ├─ Día 1-2: Setup de cuenta AWS + verificar dominio
   ├─ Día 3: Implementar servicio + templates
   └─ Día 4: Testing + deploy a producción

Semana 2:
└─ Sentry
   ├─ Hora 1: Setup + configuración básica
   ├─ Hora 2: Error boundaries + testing
   └─ Deploy a producción

Total: 5-7 días
```

### Métricas de Éxito

**AWS SES:**

- ✅ Invitaciones llegan a inbox (no spam)
- ✅ Deliverability rate >95%
- ✅ Tiempo de envío <5 segundos
- ✅ Costo mensual <$5

**Sentry:**

- ✅ Todos los errores de producción capturados
- ✅ Alertas configuradas en Slack
- ✅ Stack traces completos disponibles
- ✅ Tiempo de debugging reducido en 50%

---

## 📚 Recursos Adicionales

### AWS SES

- [Documentación oficial](https://docs.aws.amazon.com/ses/)
- [Guía de mejores prácticas](https://docs.aws.amazon.com/ses/latest/dg/best-practices.html)
- [Email templates](https://aws.amazon.com/blogs/messaging-and-targeting/introducing-email-templates-and-bulk-sending/)

### Sentry

- [Documentación Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Best practices](https://docs.sentry.io/platforms/javascript/best-practices/)
- [Performance monitoring](https://docs.sentry.io/product/performance/)

---

**Documento creado:** Noviembre 2025
**Próxima revisión:** Cuando se implemente AWS SES o Sentry
**Mantenido por:** CuretCore Team
