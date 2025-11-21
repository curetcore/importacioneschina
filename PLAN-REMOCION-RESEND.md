# Plan de Remoción de Resend

**Fecha**: 21 de Noviembre 2025
**Objetivo**: Remover Resend completamente del proyecto para preparar migración a AWS SES
**Estado**: Listo para ejecutar

---

## 📋 Resumen Ejecutivo

**Por qué remover Resend:**

- ⚠️ Servicio intermitente - invitaciones no llegan consistentemente
- 💰 Costo: $20/mes solo para emails
- 🔄 AWS SES es más confiable (99.9% SLA) y económico ($0/mes inicialmente)

**Impacto:**

- ❌ Sistema de invitaciones dejará de funcionar temporalmente
- ✅ No afecta otras funcionalidades del sistema
- ✅ Los emails existentes en BD no se ven afectados

---

## 🔍 Análisis de Archivos Afectados

### Archivos de Código (3 archivos)

| Archivo                           | Descripción                           | Acción                                            |
| --------------------------------- | ------------------------------------- | ------------------------------------------------- |
| `lib/email/resend-client.ts`      | Cliente de Resend                     | **ELIMINAR** completamente                        |
| `lib/email/invitation-service.ts` | Servicio de invitaciones (usa Resend) | **MODIFICAR** - deshabilitar emails temporalmente |
| `package.json`                    | Dependencia npm `resend`              | **REMOVER** del proyecto                          |

### Archivos de Documentación (4 archivos)

| Archivo                           | Contiene                         | Acción                                               |
| --------------------------------- | -------------------------------- | ---------------------------------------------------- |
| `README.md`                       | Referencia a Resend API en stack | **ACTUALIZAR** - remover mención                     |
| `ANALISIS-AWS-INTEGRACION.md`     | Análisis de migración AWS        | **MANTENER** - es parte del plan                     |
| `SISTEMA-INVITACIONES-RESUMEN.md` | Documentación de invitaciones    | **ACTUALIZAR** - indicar temporalmente deshabilitado |
| `IMPLEMENTACION-COMPLETADA.md`    | Historial                        | **MANTENER** - registro histórico                    |

---

## 🚀 Plan de Ejecución (3 Pasos)

### PASO 1: Deshabilitar Emails de Invitación (5 min)

**Modificar:** `lib/email/invitation-service.ts`

**Acción:** Comentar la sección de envío de emails pero **mantener** la creación de invitación en BD.

**Código actual:**

```typescript
try {
  console.log("📧 [Invitation] Calling resend.emails.send()...")
  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: input.email,
    subject: "Invitación al Sistema de Importaciones",
    html: `...`,
  })
  // ...logs...
} catch (error) {
  // ...eliminar invitación si falla...
}
```

**Código modificado:**

```typescript
// TEMPORALMENTE DESHABILITADO - Esperando migración a AWS SES
console.log("⚠️ [Invitation] Email sending disabled - awaiting AWS SES migration")
console.log("📧 [Invitation] Invitation created in DB. URL:", invitationUrl)

// TODO: Implementar AWS SES aquí
// import { sendEmailWithSES } from "@/lib/aws/ses-service"
// await sendEmailWithSES({
//   from: FROM_EMAIL,
//   to: input.email,
//   subject: "Invitación al Sistema de Importaciones",
//   html: emailTemplate
// })
```

**Resultado:**

- ✅ La invitación se crea en la base de datos
- ✅ El link de invitación se genera correctamente
- ✅ El admin puede copiar el link manualmente
- ⚠️ No se envía email automáticamente

---

### PASO 2: Remover Cliente de Resend (2 min)

**Eliminar archivo completo:**

```bash
rm lib/email/resend-client.ts
```

**Este archivo ya no se usará y puede eliminarse completamente.**

---

### PASO 3: Desinstalar Paquete NPM (1 min)

**Remover dependencia:**

```bash
npm uninstall resend
```

**Esto:**

- Remueve `resend` de `package.json`
- Remueve entrada de `package-lock.json`
- Libera espacio en `node_modules/`

---

## 📝 Actualizaciones de Documentación

### README.md

**Sección actual:**

```markdown
### Integraciones

- **Shopify:** Shopify Admin API + Shopify POS (futuro)
- **Automation:** n8n (workflows Shopify ↔ CuretCore) (futuro)
```

**Actualizar a:**

```markdown
### Integraciones

- **Shopify:** Shopify Admin API + Shopify POS (futuro)
- **Automation:** n8n (workflows Shopify ↔ CuretCore) (futuro)
- **Email:** AWS SES (migración en proceso) ⚠️ Invitaciones temporalmente manuales
```

---

### SISTEMA-INVITACIONES-RESUMEN.md

**Agregar nota al inicio:**

```markdown
> ⚠️ **NOTA IMPORTANTE (Nov 2025)**: El envío automático de emails está temporalmente
> deshabilitado mientras migramos de Resend a AWS SES. Las invitaciones se crean
> correctamente en la base de datos y el admin puede copiar el link manualmente para
> enviarlo por WhatsApp, Slack, etc. El email automático se restaurará una vez
> completada la migración a AWS SES.
```

---

## ⚠️ Consideraciones Importantes

### ¿Qué funciona después de remover Resend?

| Funcionalidad                 | Estado           | Notas                                    |
| ----------------------------- | ---------------- | ---------------------------------------- |
| **Crear invitación en BD**    | ✅ Funciona      | El registro se crea correctamente        |
| **Generar link único**        | ✅ Funciona      | El token y URL se generan                |
| **Copiar link manualmente**   | ✅ Funciona      | El admin puede copiar y compartir        |
| **Validar invitación**        | ✅ Funciona      | El usuario puede registrarse con el link |
| **Completar registro**        | ✅ Funciona      | Todo el flujo de registro funciona       |
| **Envío automático de email** | ❌ Deshabilitado | Temporalmente hasta AWS SES              |

### ¿Qué NO se ve afectado?

- ✅ Login/Logout
- ✅ Gestión de usuarios existentes
- ✅ Órdenes de compra
- ✅ Pagos y gastos
- ✅ Inventario
- ✅ Notificaciones en tiempo real (Pusher)
- ✅ Todo lo demás del sistema

### Workflow Manual Temporal

**Mientras no hay AWS SES:**

1. Admin crea invitación en el sistema
2. Sistema muestra el link en pantalla (ya implementado)
3. Admin copia el link
4. Admin envía por WhatsApp/Telegram/Slack
5. Usuario recibe el link y completa registro
6. ✅ Todo funciona igual

---

## 🔄 Próximos Pasos (Después de Remover Resend)

### Implementar AWS SES

**Orden recomendado:**

1. **Crear servicio de AWS SES** (1 día)

   ```typescript
   // lib/aws/ses-service.ts
   export async function sendEmailWithSES(params: EmailParams) {
     // Implementación con AWS SDK
   }
   ```

2. **Reemplazar en invitation-service.ts** (30 min)

   ```typescript
   // Reemplazar sección comentada con:
   import { sendEmailWithSES } from "@/lib/aws/ses-service"

   await sendEmailWithSES({
     from: FROM_EMAIL,
     to: input.email,
     subject: "Invitación al Sistema de Importaciones",
     html: emailTemplate,
   })
   ```

3. **Validar funcionamiento** (15 min)
   - Enviar invitación de prueba
   - Verificar que el email llega
   - Verificar que el link funciona

---

## 📊 Checklist de Ejecución

### Pre-Remoción

- [ ] Backup completo de la base de datos
- [ ] Verificar que no hay invitaciones pendientes críticas
- [ ] Avisar al equipo que emails estarán temporalmente deshabilitados

### Ejecución

- [ ] **PASO 1**: Modificar `invitation-service.ts` (comentar emails)
- [ ] **PASO 2**: Eliminar `lib/email/resend-client.ts`
- [ ] **PASO 3**: Desinstalar paquete `npm uninstall resend`
- [ ] Actualizar `README.md` con nota temporal
- [ ] Actualizar `SISTEMA-INVITACIONES-RESUMEN.md` con nota
- [ ] Commit y push cambios

### Post-Remoción

- [ ] Probar crear una invitación (debe funcionar sin email)
- [ ] Probar copiar link manualmente
- [ ] Probar que el link funciona para registrarse
- [ ] Verificar que el build de producción funciona
- [ ] Documentar workflow manual temporal para el equipo

### Cuando AWS SES esté listo

- [ ] Implementar `lib/aws/ses-service.ts`
- [ ] Descomentar y adaptar código en `invitation-service.ts`
- [ ] Remover notas temporales de documentación
- [ ] Actualizar README con AWS SES como servicio activo
- [ ] Celebrar emails funcionando mejor que nunca 🎉

---

## 💡 Recomendación Final

**¿Cuándo ejecutar este plan?**

**Opción 1: Ahora mismo** ✅ RECOMENDADO

- Resend no es confiable de todas formas
- El workflow manual es funcional
- Preparamos el terreno para AWS SES
- **Tiempo total: 10 minutos**

**Opción 2: Esperar a tener AWS SES listo**

- Menos disrupción
- Pero seguimos con servicio poco confiable
- **Tiempo total: Cuando AWS SES esté implementado**

**Veredicto:** Ejecutar ahora. Resend no es confiable, y el workflow manual es perfectamente viable hasta que AWS SES esté listo.

---

**Documento preparado por**: Claude (AI Assistant)
**Para**: CuretCore - Sistema de Importaciones
**Fecha**: Noviembre 21, 2025
**Próxima actualización**: Después de migración a AWS SES
