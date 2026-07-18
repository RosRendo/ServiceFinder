#!/bin/bash
# ============================================================
# ServiceFinder — Automated PostgreSQL Backup Script
# ============================================================
# This script dumps the PostgreSQL database, compresses it,
# and retains only the last 7 days of backups to prevent
# the VPS disk from filling up.
#
# HOW TO SET UP (run these commands on your VPS via SSH):
#
#   1. Make this script executable:
#      chmod +x ~/Service_Finder/scripts/backup-db.sh
#
#   2. Test it runs correctly:
#      ~/Service_Finder/scripts/backup-db.sh
#
#   3. Schedule it to run daily at 2:00 AM (server time):
#      crontab -e
#      Add this line:
#      0 2 * * * /home/ubuntu/Service_Finder/scripts/backup-db.sh >> /home/ubuntu/Service_Finder/scripts/backup.log 2>&1
# ============================================================

set -e  # Exit immediately on any error

# --- Configuration ---
DB_CONTAINER="service-finder-db"       # Your Docker Postgres container name
DB_NAME="servicefinder"                # Your database name
DB_USER="root"                         # Your database user
BACKUP_DIR="$HOME/db-backups"          # Where to store backup files on the VPS
RETENTION_DAYS=7                       # How many days of backups to keep
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/servicefinder_${TIMESTAMP}.sql.gz"

# --- Create backup directory if it doesn't exist ---
mkdir -p "$BACKUP_DIR"

echo "============================================"
echo "🗄️  ServiceFinder DB Backup - $(date)"
echo "============================================"

# --- Check Docker container is running ---
if ! sudo docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "❌ ERROR: Docker container '${DB_CONTAINER}' is not running!"
  exit 1
fi

echo "✅ Database container is running."
echo "📦 Starting backup to: ${BACKUP_FILE}"

# --- Dump and compress the database ---
sudo docker exec "$DB_CONTAINER" \
  pg_dump -U "$DB_USER" -d "$DB_NAME" \
  | gzip > "$BACKUP_FILE"

# --- Verify the backup file was created ---
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ ERROR: Backup file was not created!"
  exit 1
fi

BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "✅ Backup created successfully: ${BACKUP_FILE} (${BACKUP_SIZE})"

# --- Delete backups older than RETENTION_DAYS ---
echo "🧹 Removing backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "servicefinder_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
echo "✅ Old backups cleaned up."

# --- List current backups ---
echo ""
echo "📂 Current backups in ${BACKUP_DIR}:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "  (none)"

echo ""
echo "✅ Backup complete at $(date)"
echo "============================================"
