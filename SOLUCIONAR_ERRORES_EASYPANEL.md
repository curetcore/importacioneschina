# 🔧 Solucionar Errores de Base de Datos en Easypanel

## 🔴 Problema Detectado

La aplicación en Easypanel está usando un **schema de base de datos antiguo** que no coincide con el código actual.

### Errores que aparecen:
```
The table `public.oc_china_items` does not exist
The table `public.configuracion` does not exist
The column `inventario_recibido.item_id` does not exist
```

## ✅ Solución: Actualizar Schema en Easypanel

### Opción 1: Ejecutar desde el Terminal de Easypanel (Recomendado)

#### Paso 1: Abrir Terminal en Easypanel
1. Ve a tu aplicación en Easypanel
2. Busca la opción **"Console"**, **"Terminal"** o **"Shell"**
3. Abre una terminal dentro del contenedor

#### Paso 2: Ejecutar comandos de actualización

```bash
# 1. Regenerar el Prisma Client con el schema actual
npx prisma generate

# 2. Actualizar las tablas en la base de datos
npx prisma db push --accept-data-loss

# 3. Verificar que las tablas se crearon correctamente
npx prisma db pull

# 4. (Opcional) Insertar datos de prueba
npm run db:seed
```

#### Paso 3: Reiniciar la aplicación

Después de ejecutar los comandos, reinicia la aplicación en Easypanel para que los cambios surtan efecto.

---

### Opción 2: Usar el script automatizado

Si tienes el script `actualizar-schema-easypanel.sh`:

```bash
# Dentro del terminal de Easypanel
./actualizar-schema-easypanel.sh
```

---

## 🔍 Explicación de los comandos

### `npx prisma generate`
Regenera el Prisma Client usando el schema actual (`prisma/schema.prisma`). Esto asegura que el código use las tablas correctas.

### `npx prisma db push --accept-data-loss`
Sincroniza el schema de Prisma con la base de datos:
- Elimina tablas antiguas que ya no existen en el schema
- Crea las nuevas tablas definidas en `schema.prisma`
- **⚠️ ADVERTENCIA**: El flag `--accept-data-loss` eliminará datos de las tablas antiguas

### `npm run db:seed`
Inserta datos de prueba en la base de datos:
- 10 Órdenes de Compra
- 20 Pagos
- 20-30 Gastos Logísticos
- 10 Recepciones de Inventario

---

## 📋 Schema Actualizado

El schema nuevo tiene **4 tablas principales**:

1. **oc_china** - Órdenes de Compra
2. **pagos_china** - Pagos realizados
3. **gastos_logisticos** - Gastos de importación
4. **inventario_recibido** - Recepciones de inventario

---

## ⚠️ IMPORTANTE

**Antes de ejecutar `prisma db push --accept-data-loss`:**

1. **Haz un backup de la base de datos** si tienes datos importantes
2. Este comando **eliminará las tablas antiguas** (`oc_china_items`, `configuracion`, etc.)
3. Se perderán los datos de las tablas antiguas
4. Las nuevas tablas estarán vacías (usa `npm run db:seed` para datos de prueba)

---

## 🆘 Si tienes datos importantes

Si necesitas **conservar los datos** de las tablas antiguas:

### Opción A: Exportar datos antes de actualizar

```bash
# Exportar todas las tablas a un archivo SQL
pg_dump $DATABASE_URL > backup_antes_de_actualizar.sql
```

### Opción B: Crear migraciones personalizadas

Contacta al desarrollador para crear una migración que transfiera los datos de las tablas antiguas a las nuevas.

---

## ✨ Después de actualizar

Una vez ejecutados los comandos:

1. ✅ Los errores de "table does not exist" desaparecerán
2. ✅ La aplicación funcionará correctamente
3. ✅ Podrás crear OCs, Pagos, Gastos e Inventario
4. ✅ El dashboard mostrará datos correctamente

---

## 🔗 Links útiles

- [Prisma DB Push](https://www.prisma.io/docs/concepts/components/prisma-migrate/db-push)
- [Prisma Generate](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/generating-prisma-client)
- [Schema Prisma](prisma/schema.prisma)

---

## 📞 Soporte

Si tienes problemas ejecutando estos comandos, contacta al equipo de desarrollo.
