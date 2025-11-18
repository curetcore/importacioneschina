#!/bin/bash

#######################################
# Script de Backup Local de PostgreSQL
# Sistema de Importaciones - Curet
#
# ADVERTENCIA: Este backup se guarda en el mismo servidor.
# Si el servidor falla, pierdes servidor + backups.
# Recomendado: migrar a cloud (Cloudflare R2, Backblaze, S3)
#######################################

set -e  # Salir si hay error

# Configuración
BACKUP_DIR="/root/backups/curet-importaciones"
RETENTION_DAYS=30
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="curet-backup-${DATE}.sql"
BACKUP_COMPRESSED="${BACKUP_FILE}.gz"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

log_info "Iniciando backup de base de datos..."

# Identificar el contenedor de PostgreSQL
CONTAINER_NAME=$(docker ps --filter "name=postgres_sistemadechina" --format "{{.Names}}" | head -n 1)

if [ -z "$CONTAINER_NAME" ]; then
    log_error "No se encontró el contenedor de PostgreSQL"
    exit 1
fi

log_info "Contenedor encontrado: $CONTAINER_NAME"

# Obtener nombre de la base de datos del .env del proyecto
# Puedes cambiar estos valores manualmente si es necesario
DB_NAME="${DATABASE_NAME:-importaciones}"
DB_USER="${DATABASE_USER:-postgres}"

log_info "Base de datos: $DB_NAME"

# Hacer backup usando docker exec
log_info "Ejecutando pg_dump..."

if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/$BACKUP_FILE" 2>/dev/null; then
    log_info "Dump completado: $BACKUP_FILE"
else
    log_error "Error al ejecutar pg_dump"
    exit 1
fi

# Verificar que el archivo se creó y no está vacío
if [ ! -s "$BACKUP_DIR/$BACKUP_FILE" ]; then
    log_error "El archivo de backup está vacío"
    exit 1
fi

FILE_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
log_info "Tamaño del backup: $FILE_SIZE"

# Comprimir backup
log_info "Comprimiendo backup..."
gzip -f "$BACKUP_DIR/$BACKUP_FILE"

COMPRESSED_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_COMPRESSED" | cut -f1)
log_info "Tamaño comprimido: $COMPRESSED_SIZE"

# Calcular ratio de compresión
ORIGINAL_BYTES=$(stat -f%z "$BACKUP_DIR/$BACKUP_COMPRESSED.temp" 2>/dev/null || echo "0")
COMPRESSED_BYTES=$(stat -f%z "$BACKUP_DIR/$BACKUP_COMPRESSED" 2>/dev/null || stat -c%s "$BACKUP_DIR/$BACKUP_COMPRESSED" 2>/dev/null || echo "0")

if [ "$ORIGINAL_BYTES" != "0" ] && [ "$COMPRESSED_BYTES" != "0" ]; then
    RATIO=$(echo "scale=1; ($ORIGINAL_BYTES - $COMPRESSED_BYTES) * 100 / $ORIGINAL_BYTES" | bc)
    log_info "Ratio de compresión: ${RATIO}%"
fi

# Limpiar backups antiguos (mantener últimos N días)
log_info "Limpiando backups antiguos (>${RETENTION_DAYS} días)..."

DELETED_COUNT=0
while IFS= read -r old_backup; do
    rm -f "$old_backup"
    DELETED_COUNT=$((DELETED_COUNT + 1))
    log_info "Eliminado: $(basename "$old_backup")"
done < <(find "$BACKUP_DIR" -name "curet-backup-*.sql.gz" -type f -mtime +${RETENTION_DAYS})

if [ "$DELETED_COUNT" -eq 0 ]; then
    log_info "No hay backups antiguos para eliminar"
else
    log_info "Eliminados $DELETED_COUNT backups antiguos"
fi

# Listar backups existentes
log_info "Backups disponibles:"
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "curet-backup-*.sql.gz" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

echo "----------------------------------------"
find "$BACKUP_DIR" -name "curet-backup-*.sql.gz" -type f -exec ls -lh {} \; | awk '{print $9, "-", $5}' | tail -n 10
echo "----------------------------------------"
log_info "Total de backups: $BACKUP_COUNT"
log_info "Espacio usado: $TOTAL_SIZE"

# Verificar espacio en disco
DISK_USAGE=$(df -h "$BACKUP_DIR" | tail -n 1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    log_warning "⚠️  Espacio en disco al ${DISK_USAGE}%"
    log_warning "Considera reducir RETENTION_DAYS o mover backups a cloud"
fi

log_info "✅ Backup completado exitosamente: $BACKUP_COMPRESSED"

# Opcional: Verificar integridad del backup
log_info "Verificando integridad del backup..."
if gunzip -t "$BACKUP_DIR/$BACKUP_COMPRESSED" 2>/dev/null; then
    log_info "✅ Archivo comprimido íntegro"
else
    log_error "❌ Archivo comprimido corrupto"
    exit 1
fi

exit 0
