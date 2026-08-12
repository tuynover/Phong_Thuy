#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
ENV_FILE="$PROJECT_DIR/backend/.env"

# Kiểm tra file .env
if [ ! -f "$ENV_FILE" ]; then
    echo "Không tìm thấy backend/.env"
    exit 1
fi

# Đọc biến môi trường
MONGODB_URI=$(grep -E '^MONGODB_URI=' "$ENV_FILE" | head -n 1 | cut -d '=' -f2-)
if [ -z "$MONGODB_URI" ]; then
    echo "Không tìm thấy MONGODB_URI trong backend/.env"
    exit 1
fi

DATE=$(date +"%Y-%m-%d_%H-%M-%S")
TMP_DIR="$BACKUP_DIR/tmp_$DATE"

mkdir -p "$TMP_DIR"

echo "Bắt đầu backup MongoDB..."

docker run --rm \
    --user $(id -u):$(id -g) \
    -v "$TMP_DIR:/backup" \
    mongo:8 \
    bash -c "mongodump --uri=\"$MONGODB_URI\" --out=/backup"

tar -czf "$BACKUP_DIR/mongodb_$DATE.tar.gz" -C "$TMP_DIR" .

rm -rf "$TMP_DIR"

# Giữ lại 9 bản backup mới nhất
ls -1t "$BACKUP_DIR"/mongodb_*.tar.gz 2>/dev/null | tail -n +10 | xargs -r rm
# Chỉ giữ lại 9 file backup mới nhất
find "$BACKUP_DIR" -name "*.tar.gz" -type f | sort | head -n -9 | xargs -r rm -f
echo "Backup hoàn tất:"
echo "$BACKUP_DIR/mongodb_$DATE.tar.gz"
"$PROJECT_DIR/scripts/upload_drive.sh"


"$PROJECT_DIR/scripts/cleanup_drive.sh"