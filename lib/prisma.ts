import { PrismaClient, Prisma } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaDemo: PrismaClient | undefined
}

// Cliente Prisma principal (producción)
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// Cliente Prisma demo (base de datos separada)
// Usa DATABASE_URL como fallback durante build si DEMO_DATABASE_URL no está disponible
export const prismaDemo =
  globalForPrisma.prismaDemo ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DEMO_DATABASE_URL || process.env.DATABASE_URL,
      },
    },
  })

export { Prisma }

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
  globalForPrisma.prismaDemo = prismaDemo
}
