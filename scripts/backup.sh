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
set -a
source "$ENV_FILE"
set +a

if [ -z "$MONGODB_URI" ]; then
    echo "MONGODB_URI chưa được cấu hình trong backend/.env"
    exit 1
fi

DATE=$(date +"%Y-%m-%d_%H-%M-%S")
TMP_DIR="$BACKUP_DIR/tmp_$DATE"

mkdir -p "$TMP_DIR"

echo "Bắt đầu backup MongoDB..."

docker run --rm \
    -v "$TMP_DIR:/backup" \
    mongo:8 \
    bash -c "mongodump --uri=\"$MONGODB_URI\" --out=/backup"

tar -czf "$BACKUP_DIR/mongodb_$DATE.tar.gz" -C "$TMP_DIR" .

rm -rf "$TMP_DIR"

# Giữ lại 7 bản backup mới nhất
ls -1t "$BACKUP_DIR"/mongodb_*.tar.gz 2>/dev/null | tail -n +8 | xargs -r rm

echo "Backup hoàn tất:"
echo "$BACKUP_DIR/mongodb_$DATE.tar.gz"