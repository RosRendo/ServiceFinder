#!/bin/bash
# ==============================================================================
# Service Finder - Database Backup Script
# ==============================================================================
# This script extracts a complete SQL dump of the live database running inside 
# the Docker container and saves it to a backups folder with a timestamp.
# 
# Usage on VPS:
#   chmod +x vps_backup.sh
#   ./vps_backup.sh
# ==============================================================================

# 1. Configuration
BACKUP_DIR="/root/backups/servicefinder"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

# 2. Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "----------------------------------------------------"
echo "📦 Starting Database Backup: $TIMESTAMP"
echo "----------------------------------------------------"

# 3. Run pg_dump inside the postgres container
sudo docker-compose exec -T postgres-db pg_dump -U root -d servicefinder > "$BACKUP_FILE"

# 4. Verify the backup
if [ $? -eq 0 ]; then
    echo "✅ Backup successfully created at:"
    echo "   $BACKUP_FILE"
    
    # 5. Clean up old backups (keep last 7 days)
    echo "🧹 Cleaning up backups older than 7 days..."
    find "$BACKUP_DIR" -type f -name "*.sql" -mtime +7 -exec rm {} \;
    
    echo "🎉 Done!"
else
    echo "❌ ERROR: Database backup failed!"
    rm -f "$BACKUP_FILE"
    exit 1
fi
