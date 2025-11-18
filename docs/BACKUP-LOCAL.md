# 💾 Sistema de Backup Local - Base de Datos

## ⚠️ ADVERTENCIA IMPORTANTE

Este backup se guarda **en el mismo servidor** que la aplicación.

**Riesgos:**
- ❌ Si el servidor falla (disco, incendio, hack), pierdes servidor + backups
- ❌ Si borras algo en producción, tienes respaldo, pero...
- ❌ No protege contra falla catastrófica del servidor

**Recomendación:** Migrar a backup en la nube (Cloudflare R2, Backblaze, S3) cuando sea posible.

---

## ✅ Configuración Actual

### **Qué se respalda:**
- Base de datos PostgreSQL completa (apps)
- Todas las tablas, datos, índices, secuencias

### **Frecuencia:**
- **Automático:** Cada noche a las 3:00 AM (hora del servidor)
- **Manual:** Puedes ejecutar en cualquier momento

### **Retención:**
- Últimos **30 días** de backups
- Los backups más antiguos se eliminan automáticamente

### **Ubicación:**
```bash
Servidor: 147.93.177.156
Ruta: /root/backups/curet-importaciones/
Archivos: curet-backup-YYYY-MM-DD_HH-MM-SS.sql.gz
```

### **Compresión:**
- Original: ~160 KB
- Comprimido: ~28 KB (82% de compresión con gzip)

---

## 🔧 Comandos Útiles

### **1. Ejecutar Backup Manual**

```bash
# Desde tu computadora (usando SSH)
ssh root@147.93.177.156 "/root/scripts/backup-db-local.sh"

# Desde el servidor directamente
/root/scripts/backup-db-local.sh
```

### **2. Ver Backups Disponibles**

```bash
ssh root@147.93.177.156 "ls -lh /root/backups/curet-importaciones/"
```

**Ejemplo de salida:**
```
-rw-r--r-- 1 root root  28K Nov 17 23:23 curet-backup-2025-11-17_23-23-38.sql.gz
-rw-r--r-- 1 root root  29K Nov 18 03:00 curet-backup-2025-11-18_03-00-00.sql.gz
-rw-r--r-- 1 root root  30K Nov 19 03:00 curet-backup-2025-11-19_03-00-00.sql.gz
```

### **3. Descargar Backup a tu Computadora**

```bash
# Descargar el backup más reciente
scp root@147.93.177.156:/root/backups/curet-importaciones/curet-backup-*.sql.gz ~/Downloads/

# Descargar backup específico por fecha
scp root@147.93.177.156:/root/backups/curet-importaciones/curet-backup-2025-11-17*.sql.gz ~/Downloads/
```

### **4. Ver Log del Cron Job**

```bash
ssh root@147.93.177.156 "tail -f /var/log/backup-curet.log"
```

### **5. Verificar que Cron Job Está Activo**

```bash
ssh root@147.93.177.156 "crontab -l | grep backup"
```

**Debe mostrar:**
```
0 3 * * * /root/scripts/backup-db-local.sh >> /var/log/backup-curet.log 2>&1
```

---

## 🔄 Cómo Restaurar un Backup

### **Escenario: Borraste algo por accidente**

**Paso 1: Descargar el backup**
```bash
# Listar backups disponibles
ssh root@147.93.177.156 "ls -lh /root/backups/curet-importaciones/"

# Descargar el backup que necesitas (ej: del 17 de noviembre)
scp root@147.93.177.156:/root/backups/curet-importaciones/curet-backup-2025-11-17*.sql.gz .
```

**Paso 2: Descomprimir**
```bash
gunzip curet-backup-2025-11-17_23-23-38.sql.gz
# Ahora tienes: curet-backup-2025-11-17_23-23-38.sql
```

**Paso 3: Restaurar en PostgreSQL**

**⚠️ ESTO SOBRESCRIBIRÁ LA BASE DE DATOS ACTUAL**

```bash
# Opción A: Restaurar en el servidor (PELIGROSO - sobrescribe producción)
ssh root@147.93.177.156 "docker exec -i apps_postgres_sistemadechina.1.th7ehsk5t14e7439ay7391wm0 psql -U postgres apps" < curet-backup-2025-11-17_23-23-38.sql

# Opción B: Restaurar en base de datos LOCAL (para revisar primero)
# Necesitas PostgreSQL instalado localmente
createdb curet_restore
psql -d curet_restore < curet-backup-2025-11-17_23-23-38.sql

# Luego puedes explorar los datos y extraer lo que necesitas
psql -d curet_restore
SELECT * FROM "OCChina" WHERE id = 123;
```

**Paso 4: Verificar**
```bash
# Conectar a la base de datos y verificar
ssh root@147.93.177.156 "docker exec -it apps_postgres_sistemadechina.1.th7ehsk5t14e7439ay7391wm0 psql -U postgres apps"

# Ejecutar queries para verificar datos
SELECT COUNT(*) FROM "OCChina";
SELECT * FROM "OCChina" ORDER BY id DESC LIMIT 5;
```

---

## 📊 Monitoreo

### **Verificar Último Backup**

```bash
ssh root@147.93.177.156 "ls -lht /root/backups/curet-importaciones/ | head -n 2"
```

**Debe mostrar un backup reciente (menos de 24 horas).**

Si no hay backup de hoy:
1. Verificar que el cron job está activo
2. Revisar el log: `tail /var/log/backup-curet.log`
3. Ejecutar backup manual para debugging

### **Verificar Espacio en Disco**

```bash
ssh root@147.93.177.156 "df -h /root/backups"
```

**Alerta si el disco está >80% lleno.**

---

## 🛠️ Mantenimiento

### **Cambiar Frecuencia del Backup**

```bash
# Editar cron job
ssh root@147.93.177.156 "crontab -e"

# Ejemplos:
# Cada 12 horas:  0 */12 * * * /root/scripts/backup-db-local.sh
# Cada 6 horas:   0 */6 * * * /root/scripts/backup-db-local.sh
# Cada hora:      0 * * * * /root/scripts/backup-db-local.sh
# Diario a 3 AM:  0 3 * * * /root/scripts/backup-db-local.sh (actual)
```

### **Cambiar Retención de Backups**

```bash
# Editar el script
ssh root@147.93.177.156 "nano /root/scripts/backup-db-local.sh"

# Cambiar esta línea:
RETENTION_DAYS=30   # Cambiar a 7, 14, 60, etc.
```

### **Deshabilitar Backups Automáticos**

```bash
# Eliminar cron job
ssh root@147.93.177.156 "crontab -l | grep -v backup-db-local | crontab -"
```

---

## 🚀 Migrar a Backup en la Nube (Recomendado)

Cuando estés listo para mejorar la seguridad:

### **Opción 1: Cloudflare R2 (Gratis hasta 10GB)**
1. Crear cuenta en Cloudflare
2. Activar R2 Object Storage
3. Crear bucket "curet-backups"
4. Configurar acceso con API keys
5. Actualizar script para subir a R2

### **Opción 2: Backblaze B2 ($0.005/GB)**
1. Crear cuenta en Backblaze
2. Crear bucket
3. Generar API keys
4. Configurar en el script

### **Ventajas:**
- ✅ Backups sobreviven aunque el servidor explote
- ✅ Geografía separada (backup en USA, servidor en Europa)
- ✅ Versionado automático
- ✅ Durabilidad 99.999999999%

---

## ❓ FAQ

**P: ¿Cuánto espacio ocupan los backups?**
R: ~28 KB por backup comprimido. 30 días = ~840 KB (~1 MB). Casi nada.

**P: ¿Puedo descargar todos los backups?**
R: Sí: `scp -r root@147.93.177.156:/root/backups/curet-importaciones/ ~/backups-curet/`

**P: ¿Qué pasa si el backup falla?**
R: Se guarda un error en `/var/log/backup-curet.log`. Revisa ese archivo.

**P: ¿Cómo pruebo que un backup funciona?**
R: Descárgalo, descomprímelo, y restáuralo en una base de datos local para verificar.

**P: ¿Los backups incluyen los archivos (PDFs, imágenes)?**
R: No, solo la base de datos. Los archivos requieren un backup separado.

---

## 📞 Soporte

**Archivo de Script:** `/root/scripts/backup-db-local.sh`
**Directorio de Backups:** `/root/backups/curet-importaciones/`
**Log:** `/var/log/backup-curet.log`
**Cron Job:** `crontab -l`

**Última actualización:** 2025-11-18
