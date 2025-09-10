#!/bin/bash

# Restore script for CCTV Streaming Service
# Restores PostgreSQL database and application data from backup

set -e

# Configuration
BACKUP_DIR="/backup/cctv"
RESTORE_CONFIRM=false

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
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Display usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS] BACKUP_FILE

Restore CCTV streaming service from backup

Options:
    -h, --help              Show this help message
    -y, --yes               Skip confirmation prompt
    -s, --from-s3 KEY       Download and restore from S3 backup
    -l, --list              List available backups
    -d, --database-only     Restore database only
    -r, --redis-only        Restore Redis only
    -f, --files-only        Restore application files only

Examples:
    $0 cctv_backup_20240101_120000.tar.gz
    $0 --from-s3 backups/cctv_backup_20240101_120000.tar.gz
    $0 --list
    $0 --yes --database-only cctv_backup_20240101_120000.tar.gz

EOF
    exit 0
}

# List available backups
list_backups() {
    log "Available local backups:"
    
    if [ -d "$BACKUP_DIR" ]; then
        ls -lh "$BACKUP_DIR"/cctv_backup_*.tar.gz 2>/dev/null | while read line; do
            echo "  $line"
        done || echo "  No local backups found"
    else
        echo "  Backup directory not found: $BACKUP_DIR"
    fi
    
    if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
        echo ""
        log "Available S3 backups:"
        aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" --human-readable | grep "cctv_backup" || echo "  No S3 backups found"
    fi
    
    exit 0
}

# Download backup from S3
download_from_s3() {
    local s3_key="$1"
    local local_file="${BACKUP_DIR}/$(basename $s3_key)"
    
    log "Downloading backup from S3..."
    info "S3 Location: s3://${S3_BUCKET}/${s3_key}"
    
    if ! command -v aws &> /dev/null; then
        error "AWS CLI not found. Please install AWS CLI to download from S3."
    fi
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Download from S3
    aws s3 cp "s3://${S3_BUCKET}/${s3_key}" "$local_file"
    
    if [ $? -eq 0 ]; then
        log "Download completed successfully"
        echo "$local_file"
    else
        error "Failed to download backup from S3"
    fi
}

# Extract backup archive
extract_backup() {
    local backup_file="$1"
    local temp_dir="${BACKUP_DIR}/restore_temp_$$"
    
    log "Extracting backup archive..."
    
    # Create temporary directory
    mkdir -p "$temp_dir"
    
    # Extract archive
    tar -xzf "$backup_file" -C "$temp_dir"
    
    if [ $? -eq 0 ]; then
        log "Backup extracted successfully"
        echo "$temp_dir"
    else
        error "Failed to extract backup archive"
    fi
}

# Restore database
restore_database() {
    local backup_dir="$1"
    local db_backup=$(find "$backup_dir" -name "*.sql.gz" -type f | head -1)
    
    if [ -z "$db_backup" ]; then
        warning "Database backup file not found in archive"
        return
    fi
    
    log "Restoring database from backup..."
    info "Backup file: $(basename $db_backup)"
    
    if [ -z "$DB_PASSWORD" ]; then
        error "Database password not set. Please set DB_PASSWORD environment variable."
    fi
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Drop existing connections to database
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" \
        2>/dev/null || true
    
    # Drop and recreate database
    log "  Dropping existing database..."
    dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || true
    
    log "  Creating new database..."
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
    
    # Restore database
    log "  Restoring database data..."
    pg_restore \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-password \
        --verbose \
        "$db_backup" \
        2>&1 | while read line; do
            log "    $line"
        done
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log "Database restored successfully"
    else
        error "Database restore failed"
    fi
    
    unset PGPASSWORD
}

# Restore Redis
restore_redis() {
    local backup_dir="$1"
    local redis_backup=$(find "$backup_dir" -name "*_redis.rdb" -type f | head -1)
    
    if [ -z "$redis_backup" ]; then
        warning "Redis backup file not found in archive"
        return
    fi
    
    log "Restoring Redis from backup..."
    info "Backup file: $(basename $redis_backup)"
    
    REDIS_HOST="${REDIS_HOST:-localhost}"
    REDIS_PORT="${REDIS_PORT:-6379}"
    REDIS_PASSWORD="${REDIS_PASSWORD}"
    
    if [ -n "$REDIS_PASSWORD" ]; then
        AUTH_CMD="-a $REDIS_PASSWORD"
    else
        AUTH_CMD=""
    fi
    
    # Stop Redis to restore data
    log "  Stopping Redis server..."
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" $AUTH_CMD SHUTDOWN SAVE || true
    
    # Wait for Redis to stop
    sleep 2
    
    # Copy backup file
    log "  Copying backup file..."
    cp "$redis_backup" "/var/lib/redis/dump.rdb"
    chown redis:redis "/var/lib/redis/dump.rdb"
    
    # Start Redis
    log "  Starting Redis server..."
    systemctl start redis || service redis start || redis-server --daemonize yes
    
    # Wait for Redis to start
    sleep 2
    
    # Verify restoration
    if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" $AUTH_CMD ping > /dev/null 2>&1; then
        log "Redis restored successfully"
    else
        error "Redis restore failed"
    fi
}

# Restore application files
restore_application_files() {
    local backup_dir="$1"
    
    log "Restoring application files..."
    
    # Find and restore application file backups
    for archive in "$backup_dir"/*_*.tar.gz; do
        if [ -f "$archive" ]; then
            filename=$(basename "$archive")
            
            # Skip the main backup archive and database backup
            if [[ ! "$filename" =~ ^cctv_backup_[0-9]+_[0-9]+\.tar\.gz$ ]] && \
               [[ ! "$filename" =~ \.sql\.gz$ ]]; then
                log "  Extracting $filename..."
                tar -xzf "$archive" -C / 2>/dev/null || warning "    Failed to extract $filename"
            fi
        fi
    done
    
    log "Application files restored"
}

# Cleanup temporary files
cleanup() {
    local temp_dir="$1"
    
    if [ -n "$temp_dir" ] && [ -d "$temp_dir" ]; then
        log "Cleaning up temporary files..."
        rm -rf "$temp_dir"
    fi
}

# Confirmation prompt
confirm_restore() {
    if [ "$RESTORE_CONFIRM" = true ]; then
        return 0
    fi
    
    echo ""
    warning "This will OVERWRITE existing data!"
    echo -n "Are you sure you want to proceed with the restore? (yes/no): "
    read -r response
    
    case "$response" in
        yes|YES|y|Y)
            return 0
            ;;
        *)
            log "Restore cancelled by user"
            exit 0
            ;;
    esac
}

# Main restore function
perform_restore() {
    local backup_file="$1"
    local database_only="$2"
    local redis_only="$3"
    local files_only="$4"
    
    # Verify backup file exists
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    log "Starting restore process..."
    info "Backup file: $backup_file"
    
    # Get confirmation
    confirm_restore
    
    # Extract backup
    temp_dir=$(extract_backup "$backup_file")
    
    # Perform restore based on options
    if [ "$database_only" = true ]; then
        restore_database "$temp_dir"
    elif [ "$redis_only" = true ]; then
        restore_redis "$temp_dir"
    elif [ "$files_only" = true ]; then
        restore_application_files "$temp_dir"
    else
        # Restore everything
        restore_database "$temp_dir"
        restore_redis "$temp_dir"
        restore_application_files "$temp_dir"
    fi
    
    # Cleanup
    cleanup "$temp_dir"
    
    log "Restore process completed successfully!"
}

# Parse command line arguments
DATABASE_ONLY=false
REDIS_ONLY=false
FILES_ONLY=false
FROM_S3=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -y|--yes)
            RESTORE_CONFIRM=true
            shift
            ;;
        -l|--list)
            list_backups
            ;;
        -d|--database-only)
            DATABASE_ONLY=true
            shift
            ;;
        -r|--redis-only)
            REDIS_ONLY=true
            shift
            ;;
        -f|--files-only)
            FILES_ONLY=true
            shift
            ;;
        -s|--from-s3)
            FROM_S3="$2"
            shift 2
            ;;
        *)
            BACKUP_FILE="$1"
            shift
            ;;
    esac
done

# Main execution
if [ -n "$FROM_S3" ]; then
    # Download from S3 and restore
    BACKUP_FILE=$(download_from_s3 "$FROM_S3")
    perform_restore "$BACKUP_FILE" "$DATABASE_ONLY" "$REDIS_ONLY" "$FILES_ONLY"
elif [ -n "$BACKUP_FILE" ]; then
    # Check if it's a full path or just filename
    if [[ "$BACKUP_FILE" != /* ]]; then
        BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
    fi
    perform_restore "$BACKUP_FILE" "$DATABASE_ONLY" "$REDIS_ONLY" "$FILES_ONLY"
else
    error "No backup file specified. Use -h for help."
fi