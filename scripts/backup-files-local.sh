#!/bin/bash

#######################################
# Script de Backup Local de Archivos
# Sistema de Importaciones - Curet
#
# Respalda: PDFs, imágenes, y todos los uploads
# Ubicación: /app/public/uploads (dentro del contenedor)
#
# ADVERTENCIA: Backup local (mismo servidor).
# Recomendado: migrar a cloud storage en futuro.
#######################################

set -e

# Configuración
BACKUP_DIR="/root/backups/curet-importaciones-files"
RETENTION_DAYS=30
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="files-backup-${DATE}.tar.gz"
TEMP_DIR="/tmp/curet-uploads-${DATE}"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date +'%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date +'%Y-%m-%d %H:%M:%S') - $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $(date +'%Y-%m-%d %H:%M:%S') - $1"
}

# Crear directorios
mkdir -p "$BACKUP_DIR"
mkdir -p "$TEMP_DIR"

log_info "Iniciando backup de archivos..."

# Obtener contenedor activo
CONTAINER_NAME=$(docker ps --filter "name=sistema_de_importacion" --format "{{.Names}}" | head -n 1)

if [ -z "$CONTAINER_NAME" ]; then
    log_error "No se encontró el contenedor de la aplicación"
    exit 1
fi

log_info "Contenedor: $CONTAINER_NAME"

# Verificar si existe el directorio de uploads
if ! docker exec "$CONTAINER_NAME" test -d /app/public/uploads 2>/dev/null; then
    log_warning "No existe /app/public/uploads en el contenedor"
    log_info "Creando backup vacío..."
    echo "No files" > "$TEMP_DIR/empty.txt"
else
    # Copiar archivos del contenedor al servidor
    log_info "Copiando archivos desde el contenedor..."

    if docker cp "$CONTAINER_NAME:/app/public/uploads" "$TEMP_DIR/" 2>/dev/null; then
        FILE_COUNT=$(find "$TEMP_DIR/uploads" -type f 2>/dev/null | wc -l)
        log_info "Archivos copiados: $FILE_COUNT"
    else
        log_error "Error al copiar archivos del contenedor"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
fi

# Calcular tamaño antes de comprimir
ORIGINAL_SIZE=$(du -sh "$TEMP_DIR" | cut -f1)
log_info "Tamaño total: $ORIGINAL_SIZE"

# Crear archivo tar.gz
log_info "Comprimiendo archivos..."
cd "$TEMP_DIR"

if tar -czf "$BACKUP_DIR/$BACKUP_FILE" . 2>/dev/null; then
    log_info "Compresión completada: $BACKUP_FILE"
else
    log_error "Error al comprimir archivos"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Limpiar directorio temporal
rm -rf "$TEMP_DIR"

# Verificar que el archivo se creó
if [ ! -s "$BACKUP_DIR/$BACKUP_FILE" ]; then
    log_error "El archivo de backup está vacío"
    exit 1
fi

COMPRESSED_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
log_info "Tamaño comprimido: $COMPRESSED_SIZE"

# Limpiar backups antiguos (>N días)
log_info "Limpiando backups antiguos (>${RETENTION_DAYS} días)..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "files-backup-*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete -print | wc -l)

if [ "$DELETED_COUNT" -eq 0 ]; then
    log_info "No hay backups antiguos para eliminar"
else
    log_info "Eliminados $DELETED_COUNT backups antiguos"
fi

# Estadísticas
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "files-backup-*.tar.gz" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

log_info "Total de backups de archivos: $BACKUP_COUNT"
log_info "Espacio usado: $TOTAL_SIZE"

# Verificar espacio en disco
DISK_USAGE=$(df "$BACKUP_DIR" | tail -n 1 | awk '{print $5}' | sed 's/%//' || echo "0")
if [ "$DISK_USAGE" -gt 80 ]; then
    log_warning "⚠️  Espacio en disco al ${DISK_USAGE}%"
fi

log_info "✅ Backup de archivos completado: $BACKUP_FILE"

# Verificar integridad
log_info "Verificando integridad del archivo..."
if tar -tzf "$BACKUP_DIR/$BACKUP_FILE" >/dev/null 2>&1; then
    log_info "✅ Archivo tar.gz íntegro"
else
    log_error "❌ Archivo tar.gz corrupto"
    exit 1
fi

exit 0
