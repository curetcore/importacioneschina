# Configuración de Distribución de Costos

## 📋 Resumen

Sistema de configuración flexible para distribución de gastos logísticos entre órdenes de compra (OCs).

**Estado Actual:** ✅ Implementado con feature flag OFF (comportamiento original)
**Riesgo:** 🟢 Muy bajo - Triple fallback + kill switch

---

## 🎯 ¿Qué Resuelve?

Permite configurar cómo se distribuyen los gastos cuando afectan múltiples OCs:

| Escenario         | Antes (Hardcode)  | Ahora (Configurable)         |
| ----------------- | ----------------- | ---------------------------- |
| Flete por mar     | Siempre por cajas | Por cajas (configurable)     |
| Flete por avión   | Siempre por cajas | Por peso (configurable)      |
| Flete por courier | Siempre por cajas | Por valor FOB (configurable) |

---

## 🚀 Cómo Habilitar (Paso a Paso)

### **PASO 1: Ejecutar Seed (Solo Primera Vez)**

Esto crea la configuración inicial que replica el comportamiento actual:

```bash
# Opción A: Usando script TypeScript
npx tsx scripts/seed-distribution-config.ts

# Opción B: Usando SQL directo
psql -h HOST -U USER -d DATABASE < prisma/seed-distribution-config.sql
```

**Verificar que se creó correctamente:**

```bash
# Deberías ver 4 registros:
# - gastos_flete → cajas
# - gastos_transporte_local → cajas
# - gastos_aduana → valor_fob
# - comisiones → valor_fob
```

---

### **PASO 2: Habilitar Feature Flag**

**EN PRODUCCIÓN:**

```bash
# Actualizar variable de entorno en EasyPanel
USE_CONFIG_DISTRIBUTION=true

# Reiniciar app
docker service update --force apps_sistema_de_importacion
```

**EN LOCAL:**

```bash
# Agregar a .env
USE_CONFIG_DISTRIBUTION=true

# Reiniciar servidor
npm run dev
```

---

### **PASO 3: Verificar que Funciona**

1. Ver logs del servidor:

```bash
# Deberías ver logs como:
✅ [Distribution] Usando configuración de BD: {
  tipoGasto: "Flete internacional",
  categoria: "gastos_flete",
  method: "cajas",
  fromConfig: true
}
```

2. Crear un gasto de prueba y verificar distribución

---

## ⚙️ Configurar Métodos de Distribución

### En la UI (Configuración > Distribución de Costos):

```
1. Ir a Configuración
2. Tab "Distribución de Costos"
3. Seleccionar método para cada tipo:
   - Flete: Por Cajas (o Peso, o Valor FOB según necesites)
   - Transporte Local: Por Cajas
   - Aduana: Por Valor FOB
   - Comisiones: Por Valor FOB
4. Guardar
```

### Desde la BD (Avanzado):

```sql
-- Cambiar flete a "por peso" (para importación aérea)
UPDATE configuracion_distribucion_costos
SET metodo_distribucion = 'peso'
WHERE tipo_costo = 'gastos_flete';

-- Cambiar transporte a "por valor FOB"
UPDATE configuracion_distribucion_costos
SET metodo_distribucion = 'valor_fob'
WHERE tipo_costo = 'gastos_transporte_local';
```

---

## 🛡️ Sistema de Seguridad

### Triple Fallback

Si algo falla, el sistema automáticamente usa el comportamiento hardcodeado original:

```typescript
1. Intenta leer configuración de BD
   ❌ Falla → Usa hardcode

2. No encuentra configuración
   ❌ No existe → Usa hardcode

3. Tipo de gasto no mapeado
   ❌ Sin mapeo → Usa hardcode
```

### Kill Switch (Rollback Instantáneo)

Si hay problemas, deshabilitar inmediatamente:

```bash
# Cambiar a false
USE_CONFIG_DISTRIBUTION=false

# Reiniciar
docker service update --force apps_sistema_de_importacion
```

**Resultado:** Comportamiento vuelve a ser idéntico al original

---

## 📊 Mapeo de Tipos de Gasto

| Tipo de Gasto (en BD) | Categoría Config        | Default   |
| --------------------- | ----------------------- | --------- |
| Flete internacional   | gastos_flete            | cajas     |
| Transporte local      | gastos_transporte_local | cajas     |
| Almacenaje            | gastos_transporte_local | cajas     |
| Aduana / DGA          | gastos_aduana           | valor_fob |
| Impuestos             | gastos_aduana           | valor_fob |
| Broker                | gastos_aduana           | valor_fob |
| Seguro                | gastos_aduana           | valor_fob |
| Otros                 | gastos_transporte_local | cajas     |

---

## 🧪 Testing Recomendado

### Antes de Habilitar en Producción:

1. **Verificar Seed:**

   ```bash
   npx tsx scripts/seed-distribution-config.ts
   ```

2. **Habilitar en Local:**

   ```bash
   USE_CONFIG_DISTRIBUTION=true npm run dev
   ```

3. **Crear Gasto de Prueba:**
   - Tipo: Flete internacional
   - Asociar a 3 OCs con diferentes cantidades de cajas
   - Verificar que se distribuye por cajas

4. **Cambiar Configuración:**
   - Ir a Configuración > Distribución
   - Cambiar Flete a "Por Peso"
   - Crear otro gasto
   - Verificar que ahora se distribuye por peso

5. **Comparar con Datos Reales:**
   - Tomar un gasto existente
   - Calcular manualmente cómo debería distribuirse
   - Verificar que los resultados coinciden

---

## 📈 Monitoreo

### Logs a Revisar:

```bash
# Ver distribuciones aplicadas
docker logs apps_sistema_de_importacion.1.xxx 2>&1 | grep "\[Distribution\]"

# Ver si hay fallbacks usados
docker logs apps_sistema_de_importacion.1.xxx 2>&1 | grep "⚠️\|❌"

# Ver configuración usada
docker logs apps_sistema_de_importacion.1.xxx 2>&1 | grep "fromConfig: true"
```

### Métricas a Monitorear:

- ✅ Cálculos son correctos (comparar con manual)
- ✅ No hay errores en logs
- ✅ Performance no degradó
- ✅ Configuración se aplica correctamente

---

## 🔄 Rollback Plan

Si algo sale mal:

```bash
# PASO 1: Kill switch inmediato
USE_CONFIG_DISTRIBUTION=false
docker service update --force apps_sistema_de_importacion

# PASO 2: Verificar que volvió a funcionar
# (debe usar comportamiento hardcodeado original)

# PASO 3: Investigar logs
docker logs apps_sistema_de_importacion.1.xxx 2>&1 | grep "ERROR\|❌"

# PASO 4: Reportar issue con logs
```

---

## ❓ FAQ

**P: ¿Esto afecta cálculos existentes?**
R: No. Los gastos ya creados usan los valores que se calcularon en su momento.

**P: ¿Qué pasa si borro la configuración de la BD?**
R: El sistema automáticamente usa el comportamiento hardcodeado (no rompe).

**P: ¿Puedo volver a usar cajas después de cambiar a peso?**
R: Sí, es 100% reversible desde la UI.

**P: ¿Esto afecta la distribución DENTRO de una OC (entre productos)?**
R: No. Esto solo afecta distribución ENTRE OCs. Dentro de cada OC se distribuye por unidades.

**P: ¿Qué pasa si el feature flag está ON pero no hay configuración?**
R: Usa automáticamente el comportamiento hardcodeado (triple fallback).

---

## 🎓 Conceptos

### Nivel 1: Distribución Entre OCs

Cuando un gasto afecta múltiples órdenes (ej: flete para OC1, OC2, OC3):

```
Gasto RD$10,000 para 3 OCs:
- OC1: 10 cajas → RD$2,000 (20%)
- OC2: 30 cajas → RD$6,000 (60%)
- OC3: 10 cajas → RD$2,000 (20%)
```

### Nivel 2: Distribución Dentro de OC

Los gastos asignados a una OC se reparten entre sus productos (siempre por unidades):

```
OC2 recibió RD$6,000:
- Producto A: 100 unidades → RD$1,500 (25%)
- Producto B: 200 unidades → RD$3,000 (50%)
- Producto C: 100 unidades → RD$1,500 (25%)
```

---

## 👨‍💻 Para Desarrolladores

### Archivos Clave:

- `lib/distribution-config-helper.ts` - Lógica principal con fallbacks
- `app/api/oc-china/[id]/route.ts` - Uso en endpoint de OC
- `app/api/dashboard/route.ts` - Uso en dashboard
- `scripts/seed-distribution-config.ts` - Script de seed
- `prisma/seed-distribution-config.sql` - SQL de seed

### Testing:

```typescript
import {
  getHardcodedDistributionMethod,
  getDistributionMethodForExpense,
} from "@/lib/distribution-config-helper"

// Comparar comportamiento antes/después
const hardcoded = getHardcodedDistributionMethod("Flete internacional") // "cajas"
const fromConfig = await getDistributionMethodForExpense("Flete internacional") // "cajas" (o lo que esté configurado)
```

---

**Última actualización:** 2025-01-22
**Versión:** 1.0.0
**Status:** ✅ Implementado y listo para habilitar
