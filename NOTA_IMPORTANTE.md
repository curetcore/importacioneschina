# ⚠️ IMPORTANTE - Conexión a PostgreSQL de Easypanel

## El problema

El host interno `apps_postgres_sistemadechina` **solo funciona dentro de Easypanel**, no desde tu máquina local.

## ✅ Solución: Necesitas el HOST EXTERNO

En Easypanel, ve a tu base de datos PostgreSQL y busca:

### Opción 1: Host Externo
Normalmente Easypanel muestra algo como:
- **Host externo**: `1.2.3.4` (una IP)
- O un dominio: `postgres.tu-proyecto.easypanel.host`

Entonces tu DATABASE_URL sería:
```env
DATABASE_URL="postgresql://postgres:Pitagora1844@IP_O_DOMINIO_EXTERNO:5432/apps?sslmode=disable"
```

### Opción 2: URL de conexión externa
Algunas instalaciones de Easypanel muestran directamente la "URL de conexión externa".

---

## 🎯 Pasos para obtener el host externo:

1. Ve a Easypanel
2. Selecciona tu base de datos PostgreSQL
3. Busca en la pestaña de "Connection" o "Settings"
4. Copia el **host externo** o la **URL externa**
5. Actualiza `.env` con esa información

---

## 📝 Una vez que tengas el host externo:

```bash
# Actualiza .env con el host externo
# DATABASE_URL="postgresql://postgres:Pitagora1844@TU_HOST_EXTERNO:5432/apps?sslmode=disable"

# Luego ejecuta:
npm run prisma:generate
npm run db:push
npm run db:seed
```

---

## 🔐 Alternativa: Túnel SSH

Si Easypanel no expone PostgreSQL públicamente, puedes crear un túnel SSH:

```bash
ssh -L 5432:apps_postgres_sistemadechina:5432 tu-servidor-easypanel
```

Luego usa:
```env
DATABASE_URL="postgresql://postgres:Pitagora1844@localhost:5432/apps?sslmode=disable"
```

---

## 🆘 ¿No encuentras el host externo?

Si Easypanel no expone PostgreSQL al exterior:

1. Puedes ejecutar los comandos **dentro de Easypanel**
2. O usar un servicio como **Tailscale** para conectarte a la red interna
3. O pregunta en el soporte de Easypanel cómo acceder a la BD desde fuera
