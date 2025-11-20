# Tests E2E

Tests End-to-End usando Playwright.

## Ejecución Rápida

```bash
# Interfaz visual (RECOMENDADO)
npm run test:e2e:ui

# Todos los tests (headless)
npm run test:e2e

# Con navegador visible
npm run test:e2e:headed

# Modo debug
npm run test:e2e:debug

# Ver reporte
npm run test:e2e:report
```

## Tests Disponibles

- `auth.spec.ts` - Autenticación y roles
- `ordenes.spec.ts` - Órdenes de compra
- `pagos.spec.ts` - Pagos, gastos e inventario
- `notificaciones.spec.ts` - Sistema de notificaciones

## Documentación Completa

Ver `docs/TESTS-E2E.md` para guía completa.
