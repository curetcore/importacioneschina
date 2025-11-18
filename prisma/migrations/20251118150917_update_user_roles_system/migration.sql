-- UpdateUserRolesSystem
-- Actualización del sistema de roles de 2 niveles a 3 niveles
-- Roles anteriores: "admin" | "user"
-- Roles nuevos: "limitado" | "admin" | "superadmin"

-- Nota: No se requieren cambios en la estructura de la tabla porque
-- el campo 'role' ya es de tipo VARCHAR/TEXT y acepta cualquier valor.
-- Los cambios son a nivel de aplicación (valores permitidos y defaults).

-- Esta migración es principalmente declarativa para tracking en Prisma.
-- Los datos existentes se migrarán con el script scripts/migrate-roles.ts

-- No hay cambios SQL necesarios en esta migración.
