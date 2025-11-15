FROM node:18-alpine

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copiar package files
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm ci

# Copiar todo el código
COPY . .

# Generar Prisma
RUN npx prisma generate

# Build de Next.js
RUN npm run build

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Ejecutar Next.js en modo producción
CMD ["npm", "run", "start"]
