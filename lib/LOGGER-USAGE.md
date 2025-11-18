# Guía de Uso del Logger

## 📋 Descripción

Sistema de logging estructurado con Winston para debugging profesional en producción.

## 🚀 Uso Básico

```typescript
import { logger, loggers, logError, logWarning, logInfo } from '@/lib/logger'

// Logging simple
logger.info('Mensaje informativo')
logger.error('Error crítico')
logger.warn('Advertencia')
logger.debug('Debug info') // Solo en desarrollo

// Con contexto
logInfo('Orden creada', { ordenId: 123, usuario: 'admin' })
logError(new Error('Pago falló'), { ordenId: 123, monto: 1000 })
logWarning('Stock bajo', { productoId: 456, cantidad: 5 })
```

## 🎯 Loggers Específicos por Dominio

### 1. **Business Logic**
```typescript
import { loggers } from '@/lib/logger'

// Operaciones de negocio
loggers.business.ordenCreada(123, { proveedor: 'ABC', total: 5000 })
loggers.business.pagoRegistrado(456, 1000, { metodoPago: 'transferencia' })
loggers.business.inventarioRecibido(789, { bodega: 'principal' })
loggers.business.gastoRegistrado(101, 'flete', 500, { aduana: 'AILA' })
```

### 2. **API Requests**
```typescript
// Automático con middleware
import { withRequestLogging } from '@/lib/logger'

export const GET = withRequestLogging(async (req) => {
  // tu código - logs automáticos de request/response/errores
})

// Manual
loggers.api.request('GET', '/api/ordenes')
loggers.api.response('GET', '/api/ordenes', 200, 145) // 145ms
loggers.api.error('POST', '/api/pagos', new Error('Validación falló'))
```

### 3. **Database Operations**
```typescript
loggers.db.query('findMany', 'OCChina', { limit: 20 })
loggers.db.error('create', 'PagosChina', new Error('FK violation'), { pagoId: 123 })
```

### 4. **Security & Auth**
```typescript
loggers.security.login('user@email.com', { ip: '192.168.1.1' })
loggers.security.loginFailed('user@email.com', 'contraseña incorrecta')
loggers.security.unauthorized('/api/admin', { userId: 'guest' })
loggers.security.rateLimitExceeded('192.168.1.1', '/api/ordenes')
```

### 5. **Performance**
```typescript
const start = Date.now()
// ... operación lenta
const duration = Date.now() - start

if (duration > 1000) {
  loggers.performance.slow('Análisis de costos', duration, 1000)
}
```

## 🔧 Configuración

### Niveles de Log
- `error`: Errores críticos (siempre guardados)
- `warn`: Advertencias (siempre guardados)
- `info`: Información general (producción)
- `http`: Requests HTTP (producción)
- `debug`: Debugging detallado (solo desarrollo)

### Archivos de Log
```
logs/
├── error-2025-01-17.log       # Solo errores (30 días)
├── combined-2025-01-17.log    # Todos los niveles (14 días)
└── ...                        # Rotación automática diaria
```

### Rotación Automática
- **Diaria**: Nuevo archivo cada día
- **Tamaño**: Máximo 20MB por archivo
- **Retención**:
  - Errores: 30 días
  - Combinados: 14 días

## 📦 Migración desde console.*

### Antes
```typescript
console.log('Orden creada:', { ordenId: 123 })
console.error('Error al procesar pago:', error)
console.warn('Stock bajo:', productoId)
```

### Después
```typescript
import { logInfo, logError, logWarning } from '@/lib/logger'

logInfo('Orden creada', { ordenId: 123 })
logError(error, { context: 'procesar pago' })
logWarning('Stock bajo', { productoId })
```

## 🎯 Best Practices

1. **Siempre incluir contexto**
   ```typescript
   // ❌ Malo
   logger.error('Error al guardar')

   // ✅ Bueno
   logError(error, { operation: 'guardar orden', ordenId: 123 })
   ```

2. **Usar loggers específicos**
   ```typescript
   // ❌ Evitar
   logger.info('Orden creada con ID 123')

   // ✅ Preferir
   loggers.business.ordenCreada(123, { proveedor: 'ABC' })
   ```

3. **Niveles apropiados**
   - `error`: Afecta funcionalidad
   - `warn`: Potencial problema
   - `info`: Operación importante
   - `debug`: Información detallada

4. **No loggear información sensible**
   ```typescript
   // ❌ NUNCA
   logger.info('Login', { password: '123456' })

   // ✅ Correcto
   loggers.security.login(userId, { ip: req.ip })
   ```

## 📊 Visualización de Logs

### Desarrollo
Logs con colores en consola automáticamente.

### Producción
```bash
# Ver logs en tiempo real
tail -f logs/combined-2025-01-17.log | jq '.'

# Ver solo errores
tail -f logs/error-2025-01-17.log | jq '.'

# Buscar por ordenId
cat logs/combined-*.log | jq 'select(.ordenId == 123)'

# Filtrar operaciones lentas
cat logs/combined-*.log | jq 'select(.duration and (.duration | tonumber > 2000))'
```

## ✅ Status

- [x] Winston instalado y configurado
- [x] Loggers específicos por dominio
- [x] Middleware de requests
- [x] Rotación automática
- [x] Formato JSON en producción
- [x] Ejemplo en oc-china/route.ts
- [ ] Migración completa de todos los console.* (opcional)

## 🔗 Ver También

- `lib/logger.ts` - Configuración completa
- `lib/audit-logger.ts` - Audit logs para cambios en BD
- `lib/api-error-handler.ts` - Manejo de errores estructurado
