-- Seed de configuración del sistema
-- Ejecutar solo una vez después del primer deploy

-- Limpiar configuraciones existentes
TRUNCATE configuracion CASCADE;

-- Insertar proveedores
INSERT INTO configuracion (id, categoria, valor, orden, activo, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111001', 'proveedores', 'Nike China', 1, true, NOW(), NOW()),
('11111111-1111-1111-1111-111111111002', 'proveedores', 'Adidas Factory', 2, true, NOW(), NOW()),
('11111111-1111-1111-1111-111111111003', 'proveedores', 'Puma Manufacturing', 3, true, NOW(), NOW()),
('11111111-1111-1111-1111-111111111004', 'proveedores', 'Fábrica Guangzhou', 4, true, NOW(), NOW()),
('11111111-1111-1111-1111-111111111005', 'proveedores', 'Shenzhen Leather Co.', 5, true, NOW(), NOW());

-- Insertar categorías principales
INSERT INTO configuracion (id, categoria, valor, orden, activo, created_at, updated_at) VALUES
('22222222-2222-2222-2222-222222222001', 'categorias', 'Zapatos', 1, true, NOW(), NOW()),
('22222222-2222-2222-2222-222222222002', 'categorias', 'Carteras', 2, true, NOW(), NOW()),
('22222222-2222-2222-2222-222222222003', 'categorias', 'Cinturones', 3, true, NOW(), NOW()),
('22222222-2222-2222-2222-222222222004', 'categorias', 'Accesorios', 4, true, NOW(), NOW()),
('22222222-2222-2222-2222-222222222005', 'categorias', 'Ropa', 5, true, NOW(), NOW());

-- Insertar tipos de pago
INSERT INTO configuracion (id, categoria, valor, orden, activo, created_at, updated_at) VALUES
('33333333-3333-3333-3333-333333333001', 'tiposPago', 'Anticipo', 1, true, NOW(), NOW()),
('33333333-3333-3333-3333-333333333002', 'tiposPago', 'Pago final', 2, true, NOW(), NOW()),
('33333333-3333-3333-3333-333333333003', 'tiposPago', 'Pago parcial', 3, true, NOW(), NOW()),
('33333333-3333-3333-3333-333333333004', 'tiposPago', 'Pago completo', 4, true, NOW(), NOW());

-- Insertar métodos de pago
INSERT INTO configuracion (id, categoria, valor, orden, activo, created_at, updated_at) VALUES
('44444444-4444-4444-4444-444444444001', 'metodosPago', 'Transferencia bancaria', 1, true, NOW(), NOW()),
('44444444-4444-4444-4444-444444444002', 'metodosPago', 'Tarjeta de crédito', 2, true, NOW(), NOW()),
('44444444-4444-4444-4444-444444444003', 'metodosPago', 'Tarjeta de débito', 3, true, NOW(), NOW()),
('44444444-4444-4444-4444-444444444004', 'metodosPago', 'Efectivo', 4, true, NOW(), NOW()),
('44444444-4444-4444-4444-444444444005', 'metodosPago', 'Cheque', 5, true, NOW(), NOW()),
('44444444-4444-4444-4444-444444444006', 'metodosPago', 'PayPal', 6, true, NOW(), NOW()),
('44444444-4444-4444-4444-444444444007', 'metodosPago', 'Alipay', 7, true, NOW(), NOW());

-- Insertar bodegas
INSERT INTO configuracion (id, categoria, valor, orden, activo, created_at, updated_at) VALUES
('55555555-5555-5555-5555-555555555001', 'bodegas', 'Bóveda', 1, true, NOW(), NOW()),
('55555555-5555-5555-5555-555555555002', 'bodegas', 'Piantini', 2, true, NOW(), NOW()),
('55555555-5555-5555-5555-555555555003', 'bodegas', 'Villa Mella', 3, true, NOW(), NOW()),
('55555555-5555-5555-5555-555555555004', 'bodegas', 'Oficina Central', 4, true, NOW(), NOW()),
('55555555-5555-5555-5555-555555555005', 'bodegas', 'Almacén Norte', 5, true, NOW(), NOW());

-- Insertar tipos de gasto
INSERT INTO configuracion (id, categoria, valor, orden, activo, created_at, updated_at) VALUES
('66666666-6666-6666-6666-666666666001', 'tiposGasto', 'Flete internacional', 1, true, NOW(), NOW()),
('66666666-6666-6666-6666-666666666002', 'tiposGasto', 'Seguro de carga', 2, true, NOW(), NOW()),
('66666666-6666-6666-6666-666666666003', 'tiposGasto', 'Aduana / DGA', 3, true, NOW(), NOW()),
('66666666-6666-6666-6666-666666666004', 'tiposGasto', 'Impuestos', 4, true, NOW(), NOW()),
('66666666-6666-6666-6666-666666666005', 'tiposGasto', 'Broker aduanal', 5, true, NOW(), NOW()),
('66666666-6666-6666-6666-666666666006', 'tiposGasto', 'Almacenaje', 6, true, NOW(), NOW()),
('66666666-6666-6666-6666-666666666007', 'tiposGasto', 'Transporte local', 7, true, NOW(), NOW()),
('66666666-6666-6666-6666-666666666008', 'tiposGasto', 'Inspección', 8, true, NOW(), NOW()),
('66666666-6666-6666-6666-666666666009', 'tiposGasto', 'Otros gastos', 9, true, NOW(), NOW());

-- Verificar totales
SELECT categoria, COUNT(*) as total FROM configuracion GROUP BY categoria ORDER BY categoria;
