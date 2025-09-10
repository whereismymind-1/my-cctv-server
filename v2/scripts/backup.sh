#!/bin/bash

# Backup script for CCTV Streaming Service
# Backs up PostgreSQL database and application data

set -e

# Configuration
BACKUP_DIR="/backup/cctv"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="cctv_backup_${TIMESTAMP}"
RETENTION_DAYS=30

# Database configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-cctv_db}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD}"

# S3 configuration (optional)
S3_BUCKET="${S3_BUCKET}"
S3_PREFIX="${S3_PREFIX:-backups}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log "Created backup directory: $BACKUP_DIR"
    fi
}

# Backup PostgreSQL database
backup_database() {
    log "Starting database backup..."
    
    if [ -z "$DB_PASSWORD" ]; then
        error "Database password not set. Please set DB_PASSWORD environment variable."
    fi
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Create database backup
    pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --format=custom \
        --verbose \
        --no-password \
        --file="${BACKUP_DIR}/${BACKUP_NAME}.sql.gz" \
        2>&1 | while read line; do
            log "  $line"
        done
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log "Database backup completed successfully"
    else
        error "Database backup failed"
    fi
    
    unset PGPASSWORD
}

# Backup Redis data
backup_redis() {
    log "Starting Redis backup..."
    
    REDIS_HOST="${REDIS_HOST:-localhost}"
    REDIS_PORT="${REDIS_PORT:-6379}"
    REDIS_PASSWORD="${REDIS_PASSWORD}"
    
    if [ -n "$REDIS_PASSWORD" ]; then
        AUTH_CMD="AUTH $REDIS_PASSWORD"
    else
        AUTH_CMD=""
    fi
    
    # Trigger Redis BGSAVE
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" $AUTH_CMD BGSAVE
    
    # Wait for backup to complete
    while [ $(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" $AUTH_CMD LASTSAVE) -eq $(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" $AUTH_CMD LASTSAVE) ]; do
        sleep 1
    done
    
    # Copy dump.rdb
    if [ -f "/var/lib/redis/dump.rdb" ]; then
        cp /var/lib/redis/dump.rdb "${BACKUP_DIR}/${BACKUP_NAME}_redis.rdb"
        log "Redis backup completed successfully"
    else
        warning "Redis dump file not found, skipping Redis backup"
    fi
}

# Backup application files
backup_application_files() {
    log "Starting application files backup..."
    
    # List of directories to backup
    APP_DIRS=(
        "/app/uploads"
        "/app/config"
        "/app/logs"
    )
    
    for dir in "${APP_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            dir_name=$(basename "$dir")
            tar -czf "${BACKUP_DIR}/${BACKUP_NAME}_${dir_name}.tar.gz" "$dir" 2>/dev/null
            log "  Backed up $dir"
        else
            warning "  Directory $dir not found, skipping"
        fi
    done
    
    log "Application files backup completed"
}

# Create consolidated backup archive
create_archive() {
    log "Creating consolidated backup archive..."
    
    cd "$BACKUP_DIR"
    tar -czf "${BACKUP_NAME}.tar.gz" \
        "${BACKUP_NAME}.sql.gz" \
        "${BACKUP_NAME}_redis.rdb" \
        "${BACKUP_NAME}_"*.tar.gz 2>/dev/null || true
    
    # Remove individual backup files
    rm -f "${BACKUP_NAME}.sql.gz" \
          "${BACKUP_NAME}_redis.rdb" \
          "${BACKUP_NAME}_"*.tar.gz 2>/dev/null || true
    
    # Calculate backup size
    BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
    log "Backup archive created: ${BACKUP_NAME}.tar.gz (Size: $BACKUP_SIZE)"
}

# Upload to S3 (optional)
upload_to_s3() {
    if [ -n "$S3_BUCKET" ]; then
        log "Uploading backup to S3..."
        
        if command -v aws &> /dev/null; then
            aws s3 cp \
                "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" \
                "s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_NAME}.tar.gz" \
                --storage-class STANDARD_IA
            
            if [ $? -eq 0 ]; then
                log "Backup uploaded to S3 successfully"
                # Optionally remove local backup after successful upload
                # rm -f "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
            else
                error "Failed to upload backup to S3"
            fi
        else
            warning "AWS CLI not found, skipping S3 upload"
        fi
    fi
}

# Clean up old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Remove local backups older than retention period
    find "$BACKUP_DIR" -name "cctv_backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    REMAINING_BACKUPS=$(ls -1 "$BACKUP_DIR"/cctv_backup_*.tar.gz 2>/dev/null | wc -l)
    log "Cleanup completed. $REMAINING_BACKUPS backups remaining"
    
    # Clean up S3 backups if configured
    if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
        log "Cleaning up old S3 backups..."
        
        # List and delete old S3 objects
        aws s3api list-objects-v2 \
            --bucket "$S3_BUCKET" \
            --prefix "${S3_PREFIX}/" \
            --query "Contents[?LastModified<=\`$(date -d "$RETENTION_DAYS days ago" --iso-8601)\`].Key" \
            --output text | while read -r key; do
                if [ -n "$key" ]; then
                    aws s3 rm "s3://${S3_BUCKET}/${key}"
                    log "  Deleted old S3 backup: $key"
                fi
            done
    fi
}

# Send notification (optional)
send_notification() {
    # Implement notification logic here (email, Slack, etc.)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"Backup completed successfully: ${BACKUP_NAME}.tar.gz (Size: $BACKUP_SIZE)\"}" \
            2>/dev/null || warning "Failed to send Slack notification"
    fi
}

# Main execution
main() {
    log "Starting CCTV backup process..."
    
    create_backup_dir
    backup_database
    backup_redis
    backup_application_files
    create_archive
    upload_to_s3
    cleanup_old_backups
    send_notification
    
    log "Backup process completed successfully!"
    log "Backup location: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
}

# Run main function
main "$@"