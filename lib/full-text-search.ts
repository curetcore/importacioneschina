/**
 * Full-Text Search Helpers
 * Sistema de Importaciones - Curet
 *
 * Helpers para usar PostgreSQL Full-Text Search en las queries.
 * Soporta búsqueda en español con ranking automático.
 */

import { Prisma } from "@prisma/client"

/**
 * Convierte un término de búsqueda en tsquery de PostgreSQL
 *
 * @param searchTerm - Término a buscar (ej: "zapato deportivo")
 * @returns SQL raw para usar en Prisma
 *
 * @example
 * const whereClause = fullTextSearch("zapato deportivo")
 * const results = await prisma.ocChina.findMany({
 *   where: whereClause,
 *   orderBy: [{ id: 'desc' }]
 * })
 */
export function fullTextSearch(searchTerm: string) {
  if (!searchTerm || searchTerm.trim() === "") {
    return {}
  }

  // Limpiar el término de búsqueda
  const cleanTerm = searchTerm
    .trim()
    .replace(/[^\w\sáéíóúñü]/gi, "") // Remover caracteres especiales excepto letras y espacios
    .replace(/\s+/g, " ") // Normalizar espacios

  if (cleanTerm === "") {
    return {}
  }

  // Usar plainto_tsquery para búsqueda fuzzy (acepta variaciones)
  return {
    searchVector: {
      not: null, // Filtrar registros sin search_vector
    },
    AND: [
      Prisma.sql`search_vector @@ plainto_tsquery('spanish', ${cleanTerm})`,
    ],
  } as any
}

/**
 * Full-text search con ranking (ordena por relevancia)
 *
 * @param searchTerm - Término a buscar
 * @returns WHERE clause + ORDER BY para Prisma
 *
 * @example
 * const { where, orderBy } = fullTextSearchWithRank("zapato")
 * const results = await prisma.ocChina.findMany({
 *   where,
 *   orderBy
 * })
 */
export function fullTextSearchWithRank(searchTerm: string) {
  if (!searchTerm || searchTerm.trim() === "") {
    return {
      where: {},
      orderBy: [{ createdAt: "desc" as const }],
    }
  }

  const cleanTerm = searchTerm.trim().replace(/[^\w\sáéíóúñü]/gi, "").replace(/\s+/g, " ")

  if (cleanTerm === "") {
    return {
      where: {},
      orderBy: [{ createdAt: "desc" as const }],
    }
  }

  return {
    where: {
      searchVector: {
        not: null,
      },
      AND: [Prisma.sql`search_vector @@ plainto_tsquery('spanish', ${cleanTerm})`] as any,
    },
    // Ordenar por ranking (más relevante primero)
    // Nota: Prisma no soporta ts_rank directamente, usar raw SQL si necesitas ranking preciso
    orderBy: [{ id: "desc" as const }],
  }
}

/**
 * Búsqueda con operadores AND/OR
 *
 * @param terms - Array de términos
 * @param operator - 'AND' o 'OR'
 * @returns WHERE clause
 *
 * @example
 * // Buscar "proveedor AND china"
 * const where = fullTextSearchAdvanced(['proveedor', 'china'], 'AND')
 *
 * // Buscar "zapato OR sandalia"
 * const where = fullTextSearchAdvanced(['zapato', 'sandalia'], 'OR')
 */
export function fullTextSearchAdvanced(terms: string[], operator: "AND" | "OR" = "AND") {
  if (!terms || terms.length === 0) {
    return {}
  }

  const cleanTerms = terms
    .map(t => t.trim().replace(/[^\w\sáéíóúñü]/gi, "").replace(/\s+/g, " "))
    .filter(t => t !== "")

  if (cleanTerms.length === 0) {
    return {}
  }

  // Construir tsquery con operador
  const tsquery = cleanTerms.join(` ${operator === "AND" ? "&" : "|"} `)

  return {
    searchVector: {
      not: null,
    },
    AND: [Prisma.sql`search_vector @@ to_tsquery('spanish', ${tsquery})`] as any,
  }
}

/**
 * Búsqueda por prefijo (útil para autocompletado)
 *
 * @param prefix - Prefijo a buscar (ej: "provee" para "proveedor")
 * @returns WHERE clause
 *
 * @example
 * const where = fullTextSearchPrefix("provee")
 * // Encuentra: proveedor, proveedora, proveedores, etc.
 */
export function fullTextSearchPrefix(prefix: string) {
  if (!prefix || prefix.trim() === "") {
    return {}
  }

  const cleanPrefix = prefix.trim().replace(/[^\w\sáéíóúñü]/gi, "").replace(/\s+/g, " ")

  if (cleanPrefix === "") {
    return {}
  }

  // Agregar :* para búsqueda por prefijo
  const tsquery = `${cleanPrefix}:*`

  return {
    searchVector: {
      not: null,
    },
    AND: [Prisma.sql`search_vector @@ to_tsquery('spanish', ${tsquery})`] as any,
  }
}

/**
 * Helper para agregar búsqueda full-text a queries existentes
 *
 * @param baseWhere - WHERE clause existente
 * @param searchTerm - Término de búsqueda (opcional)
 * @returns WHERE clause combinado
 *
 * @example
 * const where = combineWithFullTextSearch(
 *   { deletedAt: null },
 *   searchTerm
 * )
 */
export function combineWithFullTextSearch<T extends Record<string, any>>(
  baseWhere: T,
  searchTerm?: string
): T {
  if (!searchTerm || searchTerm.trim() === "") {
    return baseWhere
  }

  const ftsWhere = fullTextSearch(searchTerm)

  return {
    ...baseWhere,
    ...ftsWhere,
  } as T
}

/**
 * Sanitizar término de búsqueda para prevenir SQL injection
 *
 * @param term - Término a sanitizar
 * @returns Término sanitizado
 */
export function sanitizeSearchTerm(term: string): string {
  if (!term) return ""

  return term
    .trim()
    .replace(/[^\w\sáéíóúñü]/gi, "") // Solo letras, números, espacios, y acentos
    .replace(/\s+/g, " ") // Normalizar espacios
    .slice(0, 100) // Limitar longitud
}

/**
 * Verificar si un término de búsqueda es válido
 *
 * @param term - Término a validar
 * @returns true si es válido
 */
export function isValidSearchTerm(term: string): boolean {
  if (!term || typeof term !== "string") return false
  const sanitized = sanitizeSearchTerm(term)
  return sanitized.length >= 2 // Mínimo 2 caracteres
}
