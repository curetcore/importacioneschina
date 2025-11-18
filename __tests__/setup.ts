/**
 * Setup global para tests
 * Se ejecuta antes de todos los tests
 */

// Configurar variables de entorno para tests
// @ts-ignore - NODE_ENV es read-only pero necesitamos establecerlo para tests
process.env = { ...process.env, NODE_ENV: 'test' }
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/test_db'

// Timeout global
jest.setTimeout(30000)

// Limpiar mocks después de cada test
afterEach(() => {
  jest.clearAllMocks()
})
