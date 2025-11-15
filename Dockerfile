# ==========================================
# CURET - Sistema de Importaciones China
# Dockerfile optimizado multi-stage
# ==========================================

# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalar SOLO dependencias de producción
RUN npm ci --only=production && \
    npm cache clean --force

# ==========================================
# Stage 2: Builder
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos para build
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalar TODAS las dependencias (incluyendo devDependencies para Tailwind)
RUN npm ci

# Copiar código fuente
COPY . .

# Configurar variables de entorno para build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Generar cliente Prisma
RUN npx prisma generate

# Build de Next.js (ahora con Tailwind disponible)
RUN npm run build

# ==========================================
# Stage 3: Runner (Producci�n)
# ==========================================
FROM node:18-alpine AS production

WORKDIR /app

# Configurar usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar archivos necesarios
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copiar build de Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar Prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Variables de entorno
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Cambiar a usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
CMD ["node", "server.js"]

# ==========================================
# Stage 4: Development (Opcional)
# ==========================================
FROM node:18-alpine AS development

WORKDIR /app

# Instalar dependencias de desarrollo
RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Generar Prisma
RUN npx prisma generate

ENV NODE_ENV development
ENV PORT 3000

EXPOSE 3000

CMD ["npm", "run", "dev"]
