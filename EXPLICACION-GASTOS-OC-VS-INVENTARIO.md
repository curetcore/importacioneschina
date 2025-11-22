# 📊 Explicación: Gastos en OC vs Inventario Recibido

## ¿Por qué la Orden de Compra no muestra todos los gastos?

Esta es una pregunta común y la respuesta es: **SÍ muestra todos los gastos**, pero **DISTRIBUIDOS PROPORCIONALMENTE**.

---

## 🔍 Cómo Funcionan los Gastos Compartidos

### Escenario Real:

Imagina que tienes 4 órdenes de compra que viajaron en el mismo contenedor:

```
OC-001: 50 cajas, FOB $10,000
OC-002: 25 cajas, FOB $5,000
OC-003: 15 cajas, FOB $3,000
OC-004: 10 cajas, FOB $2,000
─────────────────────────────
TOTAL:  100 cajas, FOB $20,000
```

Y tienes un gasto de **Flete Internacional: RD$ 100,000** que está asociado a las 4 órdenes.

---

## ❌ Lo que NO se hace (División Igual)

```
Flete ÷ 4 órdenes = RD$ 100,000 ÷ 4 = RD$ 25,000 por orden
```

Esto sería **INJUSTO** porque:

- OC-001 (50 cajas) pagaría RD$ 25,000
- OC-004 (10 cajas) pagaría RD$ 25,000
- Ambas pagan lo mismo a pesar de que una tiene 5 veces más cajas 😱

---

## ✅ Lo que SÍ se hace (Distribución Proporcional)

### Por Cajas (para Flete/Transporte):

```
Costo por caja = RD$ 100,000 ÷ 100 cajas = RD$ 1,000/caja

OC-001: 50 cajas × RD$ 1,000 = RD$ 50,000 (50%)
OC-002: 25 cajas × RD$ 1,000 = RD$ 25,000 (25%)
OC-003: 15 cajas × RD$ 1,000 = RD$ 15,000 (15%)
OC-004: 10 cajas × RD$ 1,000 = RD$ 10,000 (10%)
───────────────────────────────────────────
TOTAL:                       RD$ 100,000 ✓
```

✅ **Justo:** Cada OC paga según el espacio que ocupó.

---

## 🧮 En la Interfaz: ¿Dónde Ves Qué?

### 1️⃣ **En la Tabla de Gastos Logísticos**

Cuando ves la lista de gastos, verás:

```
┌────────────────────────────────────────────────────────┐
│ Tipo de Gasto         │ Monto (RD$) │ # OCs Asociadas │
├────────────────────────────────────────────────────────┤
│ Flete Internacional   │ 100,000.00  │ 4 órdenes       │
└────────────────────────────────────────────────────────┘
```

**Esto es el MONTO TOTAL** que se pagó por el gasto (cash outflow real).

---

### 2️⃣ **En el Detalle de una Orden de Compra (ej: OC-001)**

Cuando abres OC-001, verás:

```
┌─────────────────────────────────────────────────┐
│ Gastos Logísticos                               │
├─────────────────────────────────────────────────┤
│ Flete Internacional    RD$ 50,000.00 (de 4 OCs)│
│ Aduana/DGA            RD$ 30,000.00 (de 4 OCs)│
│ Transporte Local      RD$  5,000.00 (de 4 OCs)│
├─────────────────────────────────────────────────┤
│ Total Gastos:         RD$ 85,000.00            │
└─────────────────────────────────────────────────┘

Total Inversión = Pagos + Gastos
Total Inversión = RD$ 150,000 + RD$ 85,000 = RD$ 235,000
```

**Esto es la PARTE PROPORCIONAL** que le corresponde a OC-001.

---

### 3️⃣ **En el Inventario Recibido**

Cuando recibes mercancía y la registras, el costo unitario final se calcula:

```
Inversión Total de la OC: RD$ 235,000
Unidades recibidas: 980 zapatos

Costo unitario = RD$ 235,000 ÷ 980 = RD$ 239.80 por zapato
```

Este costo **SÍ incluye todos los gastos** (la parte proporcional que le corresponde).

---

## 📊 Ejemplo Numérico Completo

### Gastos Totales Registrados en el Sistema:

| Gasto               | Monto Total     | OCs Asociadas                  |
| ------------------- | --------------- | ------------------------------ |
| Flete Internacional | RD$ 100,000     | OC-001, OC-002, OC-003, OC-004 |
| Aduana/DGA          | RD$ 60,000      | OC-001, OC-002, OC-003, OC-004 |
| Transporte Local    | RD$ 20,000      | OC-001, OC-002, OC-003, OC-004 |
| **TOTAL**           | **RD$ 180,000** |                                |

### Distribución por OC (Por Cajas):

| OC        | Cajas   | %        | Flete           | Aduana (FOB)   | Transporte     | Total Gastos      |
| --------- | ------- | -------- | --------------- | -------------- | -------------- | ----------------- |
| OC-001    | 50      | 50%      | RD$ 50,000      | RD$ 30,000     | RD$ 10,000     | **RD$ 90,000**    |
| OC-002    | 25      | 25%      | RD$ 25,000      | RD$ 15,000     | RD$ 5,000      | **RD$ 45,000**    |
| OC-003    | 15      | 15%      | RD$ 15,000      | RD$ 9,000      | RD$ 3,000      | **RD$ 27,000**    |
| OC-004    | 10      | 10%      | RD$ 10,000      | RD$ 6,000      | RD$ 2,000      | **RD$ 18,000**    |
| **TOTAL** | **100** | **100%** | **RD$ 100,000** | **RD$ 60,000** | **RD$ 20,000** | **RD$ 180,000** ✓ |

### Verificación:

```
Suma de gastos en OCs: RD$ 90,000 + RD$ 45,000 + RD$ 27,000 + RD$ 18,000 = RD$ 180,000 ✓
Gastos totales registrados: RD$ 180,000 ✓

✅ Los números cuadran perfectamente.
```

---

## 🎯 Respuesta Directa a tu Pregunta

> **"¿Por qué en la orden de compra no incluye todos los gastos?"**

**SÍ los incluye**, pero incluye **LA PARTE QUE LE CORRESPONDE** según la distribución proporcional.

### Lo que VES en cada lugar:

1. **Tabla de Gastos** → Monto TOTAL del gasto (cash outflow real)
2. **Detalle de OC** → Monto DISTRIBUIDO (parte proporcional de esa OC)
3. **Inventario** → Costo FINAL por unidad (incluye gastos distribuidos)

### Fórmulas:

```
Gasto Total = RD$ 100,000 (lo que aparece en la tabla de gastos)

Gasto de OC-001 = RD$ 100,000 × (50 cajas ÷ 100 cajas) = RD$ 50,000
Gasto de OC-002 = RD$ 100,000 × (25 cajas ÷ 100 cajas) = RD$ 25,000
Gasto de OC-003 = RD$ 100,000 × (15 cajas ÷ 100 cajas) = RD$ 15,000
Gasto de OC-004 = RD$ 100,000 × (10 cajas ÷ 100 cajas) = RD$ 10,000

Suma: RD$ 50,000 + RD$ 25,000 + RD$ 15,000 + RD$ 10,000 = RD$ 100,000 ✓
```

---

## ✅ Conclusión

No falta nada por sumar. El sistema está calculando correctamente:

- ✅ Los gastos totales se registran con su monto completo
- ✅ Cada OC muestra su parte proporcional
- ✅ El costo final por unidad incluye todos los gastos distribuidos
- ✅ La suma de todos los gastos distribuidos = Total de gastos registrados

**El sistema está funcionando como debe.** 🎯
