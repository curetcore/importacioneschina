# 🚀 Configurar Redis en Easypanel

Guía paso a paso para configurar Redis cache en tu servidor Easypanel.

## 📋 Pre-requisitos

- Acceso a Easypanel Dashboard
- Aplicación Next.js ya desplegada
- 5 minutos de tiempo

## 🎯 Paso 1: Crear Servicio Redis

### 1.1 Dashboard

1. Ingresa a Easypanel: https://TU_SERVIDOR.com
2. Selecciona tu **Project** (ej: "curet-importaciones")

### 1.2 Crear Redis

1. Click en **"Create Service"**
2. Selecciona **"Database"**
3. Selecciona **"Redis"**

### 1.3 Configuración

```yaml
Name: redis
Version: 7-alpine (recomendado)
Memory Limit: 256 MB (suficiente para empezar)
```

**Password** (opcional pero recomendado):

- Genera uno automático: Click "Generate"
- O usa uno personalizado
- **Guarda este password**, lo necesitarás después

### 1.4 Deploy

Click **"Deploy"** y espera 30-60 segundos.

## ⚙️ Paso 2: Conectar App a Redis

### 2.1 Obtener Connection String

Tu connection string depende si configuraste password o no:

#### Sin Password:

```
redis://redis:6379
```

#### Con Password:

```
redis://:TU_PASSWORD_AQUI@redis:6379
```

**Nota**: El hostname es `redis` (el nombre del servicio), no `localhost`.

### 2.2 Agregar Variable de Entorno

1. Ve a tu aplicación Next.js en Easypanel
2. Click en **"Environment"** o **"Settings"**
3. Agrega nueva variable:

```env
REDIS_URL=redis://:TU_PASSWORD@redis:6379
```

O sin password:

```env
REDIS_URL=redis://redis:6379
```

### 2.3 Redeploy

1. Guarda los cambios
2. Click **"Redeploy"** en tu aplicación
3. Espera que termine el deployment (~2-3 min)

## ✅ Paso 3: Verificar Funcionamiento

### 3.1 Revisar Logs

En Easypanel, ve a **Logs** de tu app y busca:

```
✅ Redis conectado exitosamente
```

O si falla:

```
⚠️ Redis no disponible: <error>. Usando cache en memoria.
```

### 3.2 Probar Cache

1. Abre tu app: https://TU_APP.com/dashboard
2. Recarga la página 2 veces
3. La segunda carga debe ser **mucho más rápida** (50-100ms vs 2-5s)

### 3.3 Verificar en Redis (Opcional)

Si quieres ver las claves cacheadas:

```bash
# Conectarse al contenedor Redis
docker exec -it redis_container redis-cli

# Autenticarse (si tiene password)
AUTH tu_password

# Ver todas las claves
KEYS *

# Ver una clave específica
GET "dashboard:stats:all"

# Ver TTL de una clave
TTL "dashboard:stats:all"
```

## 🔧 Configuración Avanzada

### Memory Limit

Para producción con muchos datos:

```yaml
Memory Limit: 512 MB  # Aplicaciones medianas
Memory Limit: 1 GB    # Aplicaciones grandes
Memory Limit: 2 GB    # Alto tráfico
```

**Cómo ajustar**:

1. Easypanel → Redis Service → Settings
2. Cambiar Memory Limit
3. Redeploy

### Persistence (Opcional)

Por defecto Redis guarda en memoria. Para persistir datos:

1. Easypanel → Redis Service → Volumes
2. Add Volume:
   ```
   Path: /data
   Size: 5 GB
   ```
3. Redeploy

**Nota**: Para cache no es crítico, pero útil si usas Redis para sessions.

### Multiple Databases

Redis soporta 16 DBs por defecto (0-15):

```env
# App principal usa DB 0 (default)
REDIS_URL=redis://:password@redis:6379/0

# Sessions en DB 1
REDIS_SESSION_URL=redis://:password@redis:6379/1

# Queue/Jobs en DB 2
REDIS_QUEUE_URL=redis://:password@redis:6379/2
```

## 📊 Monitoring

### Ver Stats en Redis

```bash
# Conectarse
docker exec -it redis_container redis-cli -a TU_PASSWORD

# Stats generales
INFO stats

# Memoria usada
INFO memory

# Claves totales
DBSIZE

# Hits y misses de cache
INFO stats | grep keyspace
```

### Limpiar Cache

```bash
# Limpiar TODO (¡cuidado!)
FLUSHALL

# Limpiar DB actual solamente
FLUSHDB

# Eliminar clave específica
DEL "dashboard:stats:all"

# Eliminar por patrón
KEYS "oc-china:*" | xargs redis-cli DEL
```

## 🚨 Troubleshooting

### Error: "Can't reach database server"

**Problema**: App no puede conectarse a Redis

**Solución**:

1. Verifica que Redis esté **Running** en Easypanel
2. Verifica el nombre del servicio es `redis` (lowercase)
3. Verifica la variable `REDIS_URL` está correcta
4. Redeploy la app

### Error: "NOAUTH Authentication required"

**Problema**: Redis tiene password pero no lo enviaste

**Solución**:

```env
# Formato correcto con password
REDIS_URL=redis://:TU_PASSWORD@redis:6379
#                ↑ Nota los dos puntos antes del password
```

### Cache no funciona (sin errores)

**Problema**: Todo conecta pero cache no mejora performance

**Debugging**:

1. Ve a logs de tu app
2. Busca: `Cache hit:` o `Cache miss:`
3. Si no ves logs, el cache no está implementado en ese endpoint

### Redis usa mucha memoria

**Problema**: Redis crece sin control

**Solución**:

```bash
# Ver memoria usada
docker exec redis_container redis-cli INFO memory

# Configurar eviction policy
docker exec redis_container redis-cli CONFIG SET maxmemory 256mb
docker exec redis_container redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

O en Easypanel:

1. Redis Service → Settings
2. Advanced → Redis Config:
   ```
   maxmemory 256mb
   maxmemory-policy allkeys-lru
   ```

## 🎯 Checklist de Deployment

Antes de ir a producción:

- [ ] Redis service creado y running
- [ ] Password configurado (recomendado)
- [ ] Variable `REDIS_URL` agregada a la app
- [ ] App redeployed exitosamente
- [ ] Logs muestran: "Redis conectado exitosamente"
- [ ] Dashboard carga rápido (< 200ms segunda vez)
- [ ] Memory limit apropiado (mínimo 256MB)
- [ ] (Opcional) Volumes configurados para persistencia
- [ ] (Opcional) Monitoring configurado

## 📈 Resultados Esperados

**Antes de Redis**:

```
GET /api/dashboard → 2-5 segundos
GET /api/oc-china → 500-800ms
GET /api/proveedores → 100-300ms
```

**Después de Redis** (segunda carga):

```
GET /api/dashboard → 50-100ms  (50x más rápido)
GET /api/oc-china → 20-50ms    (15x más rápido)
GET /api/proveedores → 10-20ms (15x más rápido)
```

## 💡 Consejos Pro

### 1. Warm up cache

Después de deployment, visita las páginas principales para llenar el cache:

```bash
curl https://tu-app.com/api/dashboard
curl https://tu-app.com/api/oc-china
curl https://tu-app.com/api/proveedores
```

### 2. Invalidación automática

El cache se invalida automáticamente al crear/editar datos:

```
POST /api/oc-china → Invalida cache de OCs y Dashboard
PUT /api/pagos-china/[id] → Invalida cache de Pagos y Dashboard
```

### 3. Purge manual

Si necesitas limpiar todo:

```bash
# Desde tu app
curl -X POST https://tu-app.com/api/cache/flush

# O desde Redis CLI
docker exec redis_container redis-cli -a PASSWORD FLUSHALL
```

## 🔗 Recursos

- [Redis Oficial](https://redis.io/docs/)
- [Easypanel Docs](https://easypanel.io/docs)
- [ioredis (cliente usado)](https://github.com/redis/ioredis)
- [Guía de uso interno](../lib/REDIS-CACHE-USAGE.md)

---

**Creado**: 2025-01-18
**Última actualización**: 2025-01-18
**Servidor**: 147.93.177.156
