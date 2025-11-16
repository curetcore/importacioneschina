# 📚 Guía de Configuración del Sistema

## Tabla de Contenidos
1. [Acceso a Configuración](#acceso-a-configuración)
2. [Gestión de Proveedores](#gestión-de-proveedores)
3. [Otras Configuraciones](#otras-configuraciones)
4. [Validaciones del Sistema](#validaciones-del-sistema)
5. [Casos de Uso](#casos-de-uso)

---

## 🚀 Acceso a Configuración

### Desde el menú principal:
1. Inicia sesión con tus credenciales
2. En el menú lateral, haz clic en **"Configuración"**
3. Verás 6 categorías de configuración:
   - **Proveedores** (5 por defecto)
   - **Categorías Principales** (5 por defecto)
   - **Tipos de Pago** (4 por defecto)
   - **Métodos de Pago** (7 por defecto)
   - **Bodegas** (5 por defecto)
   - **Tipos de Gasto** (9 por defecto)

### URL Directa:
```
https://importacion.curetcore.com/configuracion
```

---

## 👥 Gestión de Proveedores

### Ver Proveedores Actuales

En la tarjeta "Proveedores" verás la lista actual:
- ✅ Nike China
- ✅ Adidas Factory
- ✅ Puma Manufacturing
- ✅ Fábrica Guangzhou
- ✅ Shenzhen Leather Co.

Cada proveedor muestra:
- **Nombre del proveedor**
- **Botón Editar** (icono lápiz)
- **Botón Eliminar** (icono basura)

---

### ➕ Agregar Nuevo Proveedor

#### Paso 1: Abrir el formulario
1. En la tarjeta "Proveedores", haz clic en el botón **"+ Agregar"**
2. Se abrirá un diálogo modal

#### Paso 2: Llenar el formulario
- **Categoría**: `Proveedores` (ya seleccionado automáticamente)
- **Valor**: Nombre del proveedor (ej: "Alibaba China")
- **Orden**: Número para ordenar en listas (ej: 6)

#### Paso 3: Guardar
1. Haz clic en **"Crear"**
2. Verás un mensaje de éxito: ✅ "Configuración creada - Alibaba China creado exitosamente"
3. El nuevo proveedor aparecerá inmediatamente en la lista

#### Validaciones:
- ❌ **No se puede crear un proveedor con nombre duplicado**
  - Error: "Ya existe una configuración con ese valor en esta categoría"
- ❌ **El nombre no puede estar vacío**
  - Error: "El valor es requerido"

---

### ✏️ Editar Proveedor Existente

#### Paso 1: Seleccionar proveedor
1. En la lista de proveedores, haz clic en el icono de **lápiz** (editar)
2. Se abrirá el diálogo con los datos actuales

#### Paso 2: Modificar datos
- **Categoría**: No se puede cambiar (es fija como "Proveedores")
- **Valor**: Cambia el nombre (ej: "Nike China Factory")
- **Orden**: Cambia el orden si deseas (ej: 1)

#### Paso 3: Guardar cambios
1. Haz clic en **"Actualizar"**
2. Verás un mensaje: ✅ "Configuración actualizada - Nike China Factory actualizado exitosamente"
3. El cambio se refleja inmediatamente en la lista

#### Validaciones:
- ❌ **No se puede cambiar a un nombre que ya existe**
- ❌ **El nombre no puede quedar vacío**

---

### 🗑️ Eliminar Proveedor

#### Paso 1: Intentar eliminar
1. Haz clic en el icono de **basura** (eliminar)
2. Se abrirá un diálogo de confirmación

#### Paso 2: Confirmación
- **Título**: "Eliminar Configuración"
- **Mensaje**: "¿Estás seguro de eliminar 'Nike China'? Esta acción no se puede deshacer."
- **Opciones**:
  - **Cancelar**: Cierra el diálogo sin hacer nada
  - **Eliminar** (rojo): Procede con la eliminación

#### Paso 3: Validación del sistema

**✅ Si el proveedor NO está en uso:**
- Se elimina exitosamente (soft delete - se marca como `activo: false`)
- Mensaje: ✅ "Configuración eliminada - Nike China eliminado exitosamente"
- Desaparece de la lista inmediatamente

**❌ Si el proveedor ESTÁ en uso:**
- El sistema **NO permite** la eliminación
- Mensaje de error detallado:
  ```
  ❌ No se puede eliminar "Nike China" porque está en uso en:
  - 5 órdenes de compra
  ```
- El proveedor permanece en la lista
- **Acción requerida**: Primero debes cambiar el proveedor en todas las órdenes que lo usan

---

## 🔧 Otras Configuraciones

### Categorías Principales

Gestiona las categorías de productos:
- **Ejemplos por defecto**: Zapatos, Carteras, Cinturones, Accesorios, Ropa
- **Usado en**: Órdenes de Compra (campo `categoriaPrincipal`)
- **Agregar**: Haz clic en "+ Agregar" en la tarjeta "Categorías Principales"
- **Protección**: No se puede eliminar si hay órdenes usando esa categoría

### Tipos de Pago

Gestiona los tipos de pago disponibles:
- **Ejemplos por defecto**: Anticipo, Pago final, Pago parcial, Pago completo
- **Usado en**: Pagos a China (campo `tipoPago`)
- **Protección**: No se puede eliminar si hay pagos usando ese tipo

### Métodos de Pago

Gestiona los métodos de pago disponibles:
- **Ejemplos por defecto**: Transferencia bancaria, Tarjeta de crédito, Efectivo, Cheque, PayPal, Alipay
- **Usado en**:
  - Pagos a China (campo `metodoPago`)
  - Gastos Logísticos (campo `metodoPago`)
- **Protección**: No se puede eliminar si hay pagos o gastos usando ese método

### Bodegas

Gestiona las bodegas/almacenes disponibles:
- **Ejemplos por defecto**: Bóveda, Piantini, Villa Mella, Oficina Central, Almacén Norte
- **Usado en**: Inventario Recibido (campo `bodegaInicial`)
- **Protección**: No se puede eliminar si hay inventario en esa bodega

### Tipos de Gasto

Gestiona los tipos de gastos logísticos:
- **Ejemplos por defecto**: Flete internacional, Seguro de carga, Aduana/DGA, Impuestos, Broker aduanal, Almacenaje, Transporte local, Inspección, Otros gastos
- **Usado en**: Gastos Logísticos (campo `tipoGasto`)
- **Protección**: No se puede eliminar si hay gastos usando ese tipo

---

## ✅ Validaciones del Sistema

### 1. Validación de Duplicados

**Regla**: No pueden existir dos configuraciones con el mismo valor en la misma categoría

**Ejemplos**:
```
❌ INCORRECTO:
Categoría: proveedores
Valor: Nike China  <-- Ya existe
Error: "Ya existe una configuración con ese valor en esta categoría"

✅ CORRECTO:
Categoría: proveedores
Valor: Adidas China  <-- Nuevo y único
```

### 2. Validación de Campos Requeridos

**Campos obligatorios**:
- ✅ **Categoría**: Debe seleccionarse una
- ✅ **Valor**: No puede estar vacío

**Campos opcionales**:
- 📝 **Orden**: Si no se especifica, usa 0

### 3. Validación de Uso

**Regla**: No se puede eliminar una configuración que esté en uso

**Verificación por categoría**:

| Categoría | Se verifica en | Campo |
|-----------|---------------|-------|
| proveedores | OC China | `proveedor` |
| categorias | OC China | `categoriaPrincipal` |
| tiposPago | Pagos China | `tipoPago` |
| metodosPago | Pagos China, Gastos Logísticos | `metodoPago` |
| bodegas | Inventario Recibido | `bodegaInicial` |
| tiposGasto | Gastos Logísticos | `tipoGasto` |

**Ejemplo de error**:
```
❌ No se puede eliminar "Transferencia bancaria" porque está en uso en:
- 15 pagos
- 8 gastos logísticos
```

### 4. Soft Delete

**Importante**: Las configuraciones NO se eliminan físicamente de la base de datos

- Se marca como `activo: false`
- Deja de aparecer en las listas y formularios
- Preserva la integridad de datos históricos
- Puede ser reactivada manualmente desde la base de datos si es necesario

---

## 💼 Casos de Uso

### Caso 1: Agregar Nuevo Proveedor para Próxima Orden

**Situación**: Vas a importar de un nuevo proveedor "Alibaba Shoes Factory"

**Pasos**:
1. Ve a Configuración
2. En "Proveedores", haz clic en "+ Agregar"
3. Completa:
   - Valor: `Alibaba Shoes Factory`
   - Orden: `6`
4. Haz clic en "Crear"
5. ✅ Ahora aparecerá en el dropdown cuando crees una nueva orden

### Caso 2: Corregir Nombre de Proveedor

**Situación**: "Nike China" debería llamarse "Nike China Manufacturing"

**Pasos**:
1. Ve a Configuración
2. En "Proveedores", busca "Nike China"
3. Haz clic en el icono de lápiz (editar)
4. Cambia el valor a: `Nike China Manufacturing`
5. Haz clic en "Actualizar"
6. ✅ El cambio se refleja en todos los formularios inmediatamente
7. ⚠️ Las órdenes existentes MANTIENEN el valor antiguo (preserva historial)

### Caso 3: Reorganizar Orden de Proveedores

**Situación**: Quieres que "Shenzhen Leather Co." aparezca primero en las listas

**Pasos**:
1. Ve a Configuración
2. Edita "Shenzhen Leather Co."
3. Cambia Orden a: `0` (o número menor que los demás)
4. Haz clic en "Actualizar"
5. ✅ Ahora aparece primero en todos los dropdowns

### Caso 4: Intentar Eliminar Proveedor en Uso

**Situación**: Ya no trabajas con "Puma Manufacturing" pero tienes 3 órdenes históricas

**Pasos**:
1. Ve a Configuración
2. Intenta eliminar "Puma Manufacturing"
3. ❌ Sistema muestra error:
   ```
   No se puede eliminar "Puma Manufacturing" porque está en uso en:
   - 3 órdenes de compra
   ```

**Opciones**:
- **Opción A (Recomendada)**: Déjalo en la configuración para preservar historial
- **Opción B**: Cambia el proveedor en las 3 órdenes primero, luego elimina
- **Opción C**: Edita el nombre a "OBSOLETO - Puma Manufacturing" para marcarlo visualmente

### Caso 5: Agregar Nueva Bodega

**Situación**: Abriste un nuevo almacén en "Santiago"

**Pasos**:
1. Ve a Configuración
2. En "Bodegas", haz clic en "+ Agregar"
3. Completa:
   - Valor: `Santiago`
   - Orden: `6`
4. Haz clic en "Crear"
5. ✅ Ahora aparece en el dropdown al recibir inventario

---

## 🔄 Reflejo Inmediato de Cambios

**Importante**: Todos los cambios en configuración se reflejan **inmediatamente** en:

### Formularios que usan Proveedores:
- ✅ Crear Nueva Orden de Compra
- ✅ Editar Orden de Compra existente
- ✅ Filtros en lista de órdenes

### Formularios que usan Categorías:
- ✅ Crear Nueva Orden de Compra
- ✅ Editar Orden de Compra existente

### Formularios que usan Tipos/Métodos de Pago:
- ✅ Registrar Nuevo Pago
- ✅ Editar Pago existente
- ✅ Registrar Nuevo Gasto Logístico
- ✅ Editar Gasto Logístico existente

### Formularios que usan Bodegas:
- ✅ Recibir Inventario
- ✅ Editar Recepción de Inventario

### Formularios que usan Tipos de Gasto:
- ✅ Registrar Nuevo Gasto Logístico
- ✅ Editar Gasto Logístico existente

**No es necesario**:
- ❌ Recargar la página
- ❌ Cerrar sesión y volver a entrar
- ❌ Reiniciar el navegador

---

## 🎯 Mejores Prácticas

### ✅ DO (Hacer):
1. **Usa nombres descriptivos y claros**
   - ✅ "Nike China - Fabrica Guangzhou"
   - ❌ "Proveedor 1"

2. **Ordena por frecuencia de uso**
   - Los proveedores más usados con orden menor (0, 1, 2...)
   - Los menos usados con orden mayor

3. **Mantén el historial**
   - No elimines proveedores que tienen órdenes asociadas
   - Marca como "OBSOLETO -" si ya no los usas

4. **Sé consistente en nomenclatura**
   - ✅ "Transferencia bancaria", "Tarjeta de crédito", "Efectivo"
   - ❌ "Transferencia", "TARJETA", "efectivo"

### ❌ DON'T (No hacer):
1. **No uses caracteres especiales innecesarios**
   - ❌ "Nike@China#Factory!!"
   - ✅ "Nike China Factory"

2. **No crees duplicados con nombres similares**
   - ❌ "Nike China" y "nike china" y "NIKE CHINA"
   - ✅ Edita el existente

3. **No elimines configuraciones en uso**
   - Puede causar inconsistencias en reportes
   - Usa el botón editar para renombrar

4. **No uses abreviaturas poco claras**
   - ❌ "NCF", "ADFCT"
   - ✅ "Nike China Factory", "Adidas Factory"

---

## 🔗 Enlaces Relacionados

- [Guía de Órdenes de Compra](./GUIA-ORDENES.md)
- [Guía de Pagos](./GUIA-PAGOS.md)
- [Guía de Gastos Logísticos](./GUIA-GASTOS.md)
- [Guía de Inventario](./GUIA-INVENTARIO.md)
- [README Principal](../README.md)

---

## 🆘 Soporte

¿Problemas con la configuración?

1. Verifica que tienes permisos de **ADMIN**
2. Verifica tu conexión a internet
3. Revisa los logs en la consola del navegador (F12)
4. Contacta al administrador del sistema

---

**Última actualización**: Noviembre 2025
**Versión del sistema**: 2.5.0
