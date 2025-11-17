# 📊 Guía de Distribución Profesional de Costos

## 🎯 ¿Qué es la Distribución de Costos?

La distribución de costos es el proceso de asignar los gastos logísticos (flete, aduana, transporte) a cada producto de manera proporcional, basándose en características como peso, volumen o valor.

### ❌ **Problema Anterior**

El sistema distribuía los costos **igualmente** entre todos los productos, sin importar su peso, tamaño o valor. Esto causaba:

- Productos livianos sobrevalorados
- Productos pesados subvalorados
- Pérdidas de dinero por precios incorrectos

### ✅ **Solución Profesional**

Ahora el sistema distribuye los costos usando **métodos profesionales** como lo hacen las empresas grandes (Freightos, Flexport):

- **Por Peso:** Para fletes que cobran por kilogramo
- **Por Volumen:** Para fletes que cobran por metro cúbico (CBM)
- **Por Valor FOB:** Para aduanas, seguros y comisiones
- **Por Unidades:** Distribución igual (solo como respaldo)

---

## 📝 Guía Paso a Paso

### **Paso 1: Registrar Peso y Volumen en Órdenes de Compra**

Cuando crees o edites una Orden de Compra:

1. Ve a **Órdenes** → **Nueva Orden** (o edita una existente)
2. Al agregar productos, verás nuevos campos:
   - **Peso Unitario (kg):** Peso de UNA unidad en kilogramos
   - **Volumen Unitario (CBM):** Volumen de UNA unidad en metros cúbicos

**Ejemplo:**

```
Producto: Zapatos de Cuero
- Cantidad Total: 100 pares
- Peso Unitario: 0.850 kg (850 gramos por par)
- Volumen Unitario: 0.012 CBM
```

#### 🧮 **Calculadora de CBM**

Si conoces las dimensiones pero no el CBM:

1. Haz clic en el botón 🧮 (calculadora) junto al campo "Volumen Unitario"
2. Ingresa las dimensiones en **centímetros**:
   - Largo: 30 cm
   - Ancho: 20 cm
   - Alto: 15 cm
3. El sistema calcula automáticamente: **0.009 CBM**
4. Haz clic en "Usar este valor"

**Fórmula:** CBM = (Largo × Ancho × Alto) ÷ 1,000,000

---

### **Paso 2: Configurar Métodos de Distribución**

Configura una sola vez cómo quieres distribuir cada tipo de costo:

1. Ve a **Configuración** → Tab **"Distribución de Costos"**
2. Verás 5 tipos de costos:
   - **Pagos a Proveedor**
   - **Gastos de Flete**
   - **Gastos de Aduana**
   - **Transporte Local**
   - **Comisiones Bancarias**

3. Para cada uno, selecciona el método:
   - **Por Peso (kg)** → Ideal para fletes terrestres/marítimos
   - **Por Volumen (CBM)** → Ideal para fletes aéreos
   - **Por Valor FOB** → Ideal para aduanas, seguros, comisiones
   - **Por Unidades** → Distribución igual (no recomendado)

#### 📋 **Configuración Recomendada (Por Defecto)**

| Tipo de Costo     | Método Recomendado | ¿Por qué?                                  |
| ----------------- | ------------------ | ------------------------------------------ |
| Pagos a Proveedor | Por Valor FOB      | Los productos caros requieren más capital  |
| Gastos de Flete   | Por Peso           | El flete se cobra por kg transportado      |
| Gastos de Aduana  | Por Valor FOB      | Los aranceles se calculan sobre el valor   |
| Transporte Local  | Por Peso           | El transporte local cobra por kg           |
| Comisiones        | Por Valor FOB      | Las comisiones son % del valor transferido |

---

### **Paso 3: Ver Análisis de Costos**

Una vez que tengas:

- ✅ OC con productos (con peso/volumen)
- ✅ Pagos registrados
- ✅ Gastos logísticos registrados
- ✅ Inventario recibido

Ve a **Análisis de Costos** para ver el desglose completo:

1. Tabla con todos los productos
2. Columnas de costos:
   - **FOB (USD):** Costo original en China
   - **FOB (RD$):** Convertido a pesos dominicanos
   - **Pagos:** Distribución de pagos (con badge del método usado)
   - **Gastos:** Flete, aduana, transporte (con badge del método)
   - **Comisiones:** Comisiones bancarias (con badge del método)
   - **Costo Final:** Suma total por unidad

3. En la leyenda azul verás qué método se usó para cada tipo de costo

---

## 💡 Ejemplos Prácticos

### **Ejemplo 1: Flete Marítimo por Peso**

**Situación:**

- OC con 3 productos
- Flete total: RD$ 50,000

**Productos:**
| Producto | Cantidad | Peso Unit. | Peso Total | % del Peso | Flete Asignado |
|----------|----------|------------|------------|------------|----------------|
| Bolígrafos | 1000 | 0.01 kg | 10 kg | 4.76% | RD$ 2,380 |
| Mochilas | 100 | 1.0 kg | 100 kg | 47.62% | RD$ 23,810 |
| Laptops | 100 | 2.0 kg | 200 kg | 47.62% | RD$ 23,810 |
| **TOTAL** | 1200 | - | **210 kg** | **100%** | **RD$ 50,000** |

**Costo unitario de flete:**

- Bolígrafo: RD$ 2,380 ÷ 1000 = **RD$ 2.38/u**
- Mochila: RD$ 23,810 ÷ 100 = **RD$ 238.10/u**
- Laptop: RD$ 23,810 ÷ 100 = **RD$ 238.10/u**

✅ **Correcto:** Los productos pesados pagan más flete

---

### **Ejemplo 2: Aduana por Valor FOB**

**Situación:**

- OC con 2 productos
- Gastos de aduana: RD$ 30,000

**Productos:**
| Producto | Cantidad | FOB Unit. | FOB Total USD | Tasa | FOB RD$ | % Valor | Aduana |
|----------|----------|-----------|---------------|------|---------|---------|--------|
| Pulseras | 500 | $2 | $1,000 | 58 | RD$ 58,000 | 16.67% | RD$ 5,000 |
| Relojes | 100 | $50 | $5,000 | 58 | RD$ 290,000 | 83.33% | RD$ 25,000 |
| **TOTAL** | 600 | - | **$6,000** | - | **RD$ 348,000** | **100%** | **RD$ 30,000** |

**Costo unitario de aduana:**

- Pulsera: RD$ 5,000 ÷ 500 = **RD$ 10/u**
- Reloj: RD$ 25,000 ÷ 100 = **RD$ 250/u**

✅ **Correcto:** Los productos caros pagan más aduana

---

## 🔧 Casos Especiales

### **¿Qué pasa si no tengo datos de peso/volumen?**

El sistema usa **distribución por unidades** automáticamente como respaldo:

- Divide el costo total entre el número de unidades
- Todos los productos pagan lo mismo por unidad
- ⚠️ No es ideal, pero funciona como último recurso

**Recomendación:** Siempre intenta agregar al menos el peso a tus productos.

---

### **¿Puedo cambiar el método después?**

Sí, puedes cambiar el método en cualquier momento:

1. Ve a **Configuración** → **Distribución de Costos**
2. Cambia el método
3. Ve a **Análisis de Costos** para ver los nuevos cálculos

⚠️ **Nota:** Los cambios afectan todos los cálculos, no solo los futuros.

---

### **¿Cómo sé qué método se usó?**

En la página de **Análisis de Costos**, la leyenda azul muestra:

- 🔵 **Pagos:** Por Valor FOB
- 🟠 **Gastos:** Por Peso
- 🟣 **Comisiones:** Por Valor FOB

Los badges indican el método activo para cada tipo de costo.

---

## 📊 Mejores Prácticas

### ✅ **Haz esto:**

1. **Registra peso y volumen** siempre que sea posible
2. **Usa dimensiones reales** del proveedor
3. **Verifica la calculadora CBM** con las medidas del embalaje
4. **Revisa el análisis de costos** antes de poner precios de venta
5. **Exporta a Excel** para análisis adicionales

### ❌ **Evita esto:**

1. No dejar peso/volumen vacío (usa respaldo de unidades)
2. No usar valores estimados muy diferentes de la realidad
3. No usar "Por Unidades" si tienes datos de peso/volumen
4. No cambiar métodos sin entender el impacto

---

## 🆘 Preguntas Frecuentes

**P: ¿Por qué mis costos cambiaron después de la actualización?**
R: Ahora los costos se distribuyen de forma profesional. Verifica que hayas configurado peso/volumen correctamente.

**P: ¿Qué hago con OCs viejas sin peso/volumen?**
R: Puedes editarlas y agregar peso/volumen, o dejarlas (usarán distribución por unidades).

**P: ¿Puedo tener diferentes métodos para diferentes OCs?**
R: No, el método se configura globalmente para cada tipo de costo.

**P: ¿Los precios de venta deben actualizarse?**
R: Sí, revisa tus precios porque los costos finales pueden haber cambiado.

**P: ¿Cómo consigo el peso y volumen de mis productos?**
R: Pídelo a tu proveedor en China. Es información estándar que deben tener.

---

## 📞 Soporte

Si tienes dudas o encuentras problemas:

1. Revisa esta guía completa
2. Verifica la configuración en **Configuración** → **Distribución de Costos**
3. Contacta a soporte con capturas de pantalla si es necesario

---

**Última actualización:** 2025-01-17
**Versión del sistema:** 1.0.0 con Distribución Profesional de Costos
