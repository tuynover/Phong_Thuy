#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
ENV_FILE="$PROJECT_DIR/backend/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Không tìm thấy backend/.env"
    exit 1
fi

MONGODB_URI=$(sed -n 's/^MONGODB_URI=//p' "$ENV_FILE")

if [ -z "$MONGODB_URI" ]; then
    echo "Không tìm thấy MONGODB_URI"
    exit 1
fi

if [ -z "$1" ]; then
    # Tìm bản backup mới nhất trong thư mục backups
    LATEST_BACKUP=$(ls -1t "$BACKUP_DIR"/mongodb_*.tar.gz 2>/dev/null | head -n 1)
    if [ -z "$LATEST_BACKUP" ]; then
        echo "Không tìm thấy bất kỳ file backup nào trong thư mục $BACKUP_DIR"
        exit 1
    fi
    BACKUP_FILE="$LATEST_BACKUP"
    echo "Tự động chọn bản backup mới nhất: $BACKUP_FILE"
else
    BACKUP_FILE="$1"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Không tìm thấy file backup: $BACKUP_FILE"
    exit 1
fi

TMP_DIR="$BACKUP_DIR/restore_tmp"

rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"

tar -xzf "$BACKUP_FILE" -C "$TMP_DIR"

echo "Khôi phục dữ liệu..."

docker run --rm \
    --user $(id -u):$(id -g) \
    -v "$TMP_DIR:/backup" \
    mongo:8 \
    bash -c "mongorestore --drop --uri=\"$MONGODB_URI\" /backup"

rm -rf "$TMP_DIR"

echo "Restore hoàn tất."