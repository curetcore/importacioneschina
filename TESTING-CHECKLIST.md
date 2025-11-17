# 📋 Checklist de Testing - Sistema de Importaciones

## 🧪 Tests Automáticos

### Ejecutar Tests
```bash
# Instalar dependencias de testing
npm install --save-dev jest ts-jest @types/jest @jest/globals

# Ejecutar todos los tests
npm test

# Ejecutar tests específicos
npm test -- gastos-multiple-ocs

# Ejecutar con coverage
npm test -- --coverage

# Ejecutar en modo watch
npm test -- --watch
```

### Cobertura Esperada
- ✅ Funciones de base de datos: 80%+
- ✅ APIs críticas: 90%+
- ✅ Lógica de negocio: 85%+

---

## 🎯 Testing Manual - Feature: Gastos con Múltiples OCs

### Preparación
- [ ] Sistema desplegado en producción
- [ ] Base de datos migrada
- [ ] Al menos 3 OCs de prueba creadas
- [ ] Usuario con permisos admin logueado

### 1. Crear Gasto con Múltiples OCs

**Pasos:**
1. Navegar a Gastos Logísticos → Nuevo Gasto
2. Seleccionar 3 órdenes de compra diferentes
3. Llenar formulario:
   - Tipo: "Flete Marítimo"
   - Monto: RD$30,000
   - Método Pago: "Transferencia"
   - Proveedor: "Test Freight Co."
   - Notas: "Contenedor compartido - 3 OCs"

**Resultados Esperados:**
- [ ] El multi-select permite seleccionar múltiples OCs
- [ ] Las OCs seleccionadas aparecen como tags
- [ ] El formulario se puede enviar exitosamente
- [ ] Aparece mensaje de éxito
- [ ] El gasto aparece en el listado

**Cálculo de Distribución:**
- Monto total: RD$30,000
- 3 OCs → RD$10,000 por OC
- [ ] Verificar en análisis de costos que cada OC recibe RD$10,000

---

### 2. Visualizar Gasto en Listado

**Pasos:**
1. Navegar a Gastos Logísticos
2. Buscar el gasto creado
3. Observar la columna "OCs / Proveedores"

**Resultados Esperados:**
- [ ] Aparecen las 3 OCs como badges individuales
- [ ] Cada badge muestra: número OC + proveedor
- [ ] Los badges se ajustan visualmente (wrapping)
- [ ] El diseño no se rompe con múltiples OCs

---

### 3. Ver Detalles desde Orden

**Pasos:**
1. Navegar a Órdenes → Seleccionar una de las 3 OCs
2. Scroll hasta sección "Gastos Logísticos"
3. Observar el gasto compartido

**Resultados Esperados:**
- [ ] El gasto aparece en la lista
- [ ] La OC actual tiene borde azul (highlighted)
- [ ] Las otras OCs aparecen en badges grises
- [ ] Hay un badge "Compartido (3 OCs)"
- [ ] Al hacer hover sobre badges, muestra info de proveedor

---

### 4. Editar Gasto - Cambiar OCs

**Pasos:**
1. Navegar a Gastos Logísticos
2. Editar el gasto creado
3. Eliminar una OC (dejar solo 2)
4. Guardar cambios

**Resultados Esperados:**
- [ ] El multi-select muestra las OCs actuales seleccionadas
- [ ] Puedo agregar/quitar OCs fácilmente
- [ ] Los cambios se guardan correctamente
- [ ] El gasto ahora muestra solo 2 OCs
- [ ] La distribución se recalcula: RD$30,000 / 2 = RD$15,000 por OC

**Verificar:**
- [ ] La OC eliminada ya NO muestra este gasto
- [ ] Las 2 OCs restantes SÍ lo muestran

---

### 5. Análisis de Costos

**Pasos:**
1. Navegar a Dashboard o Análisis de Costos
2. Seleccionar una de las OCs del gasto compartido
3. Ver el desglose de costos

**Resultados Esperados:**
- [ ] El gasto aparece en "Gastos Logísticos"
- [ ] El monto asignado es proporcional (RD$15,000 si hay 2 OCs)
- [ ] El costo se distribuye correctamente entre productos
- [ ] Los cálculos de costo unitario son correctos

---

### 6. Filtros y Búsqueda

**Pasos:**
1. En listado de Gastos Logísticos
2. Filtrar por una OC específica
3. Buscar por número de gasto

**Resultados Esperados:**
- [ ] El filtro por OC muestra todos los gastos asociados a esa OC
- [ ] Esto incluye gastos compartidos con otras OCs
- [ ] La búsqueda por texto funciona en OCs, proveedores y notas

---

### 7. Eliminación

**Pasos:**
1. Eliminar el gasto de prueba
2. Verificar en las 2 OCs que tenía

**Resultados Esperados:**
- [ ] El gasto se elimina correctamente
- [ ] Ya no aparece en ninguna de las OCs
- [ ] Las relaciones en `gastos_logisticos_oc` se eliminaron (verificar en BD)
- [ ] El análisis de costos se actualiza automáticamente

---

### 8. Validaciones y Casos Edge

#### Test A: Sin OCs seleccionadas
**Pasos:** Intentar crear gasto sin seleccionar ninguna OC

**Esperado:**
- [ ] El formulario muestra error de validación
- [ ] No permite enviar el formulario
- [ ] Mensaje: "Debe seleccionar al menos una OC"

#### Test B: OC duplicada
**Pasos:** En el multi-select, verificar que no se puede seleccionar la misma OC dos veces

**Esperado:**
- [ ] Una vez seleccionada, la OC se marca como "ya seleccionada"
- [ ] No aparece en la lista de opciones disponibles

#### Test C: Gasto con 10+ OCs
**Pasos:** Crear un gasto con muchas OCs (si existen suficientes)

**Esperado:**
- [ ] El formulario soporta múltiples selecciones
- [ ] La visualización es legible (wrapping de badges)
- [ ] Los cálculos son correctos

---

## 🔍 Tests de Regresión

### Funcionalidad Existente (No Debe Romperse)

- [ ] **Crear OC**: Sigue funcionando normalmente
- [ ] **Crear Pago**: No se ve afectado
- [ ] **Inventario Recibido**: No se ve afectado
- [ ] **Dashboard**: KPIs se calculan correctamente
- [ ] **Exportar a Excel/PDF**: Incluye las nuevas columnas de OCs múltiples
- [ ] **Notificaciones**: Se crean para gastos compartidos

---

## 📊 Tests de Performance

### Carga de Datos
- [ ] Listado de gastos con 100+ registros carga en < 2s
- [ ] Detalles de OC con 20+ gastos carga en < 1s
- [ ] Análisis de costos con múltiples OCs calcula en < 3s

### Base de Datos
- [ ] Queries usan índices correctamente
- [ ] No hay N+1 queries
- [ ] Las transacciones completan exitosamente

---

## 🚨 Tests de Casos Críticos

### Escenario Real 1: Contenedor con 5 OCs
**Setup:**
- 5 OCs diferentes con productos variados
- 1 gasto de flete de RD$50,000
- Distribuir por peso

**Verificar:**
- [ ] Cada OC recibe RD$10,000
- [ ] Dentro de cada OC, se distribuye por peso de productos
- [ ] Los costos unitarios finales son correctos

### Escenario Real 2: Múltiples Gastos Compartidos
**Setup:**
- 3 OCs
- Gasto 1: Flete (3 OCs) - RD$45,000
- Gasto 2: Aduana (2 OCs) - RD$20,000
- Gasto 3: Transporte Local (1 OC) - RD$5,000

**Verificar:**
- [ ] OC-1 recibe: RD$15,000 + RD$10,000 + RD$5,000 = RD$30,000
- [ ] OC-2 recibe: RD$15,000 + RD$10,000 = RD$25,000
- [ ] OC-3 recibe: RD$15,000
- [ ] Los totales son correctos en cada orden

---

## ✅ Checklist de Aceptación Final

Antes de considerar la feature completamente probada:

- [ ] Todos los tests automáticos pasan
- [ ] Todos los tests manuales completados
- [ ] Tests de regresión OK
- [ ] Performance aceptable
- [ ] Documentación actualizada
- [ ] Usuario final ha probado y aprobado
- [ ] No hay bugs críticos pendientes
- [ ] Se puede revertir en caso de problemas (rollback plan)

---

## 🐛 Registro de Bugs Encontrados

| ID | Descripción | Severidad | Estado | Fecha |
|----|-------------|-----------|---------|-------|
| - | - | - | - | - |

---

## 📝 Notas Adicionales

- Tests deben ejecutarse antes de cada deploy
- Mantener este checklist actualizado con nuevos casos
- Documentar cualquier caso edge descubierto
- Revisar logs de producción después del deploy
