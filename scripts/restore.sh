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
    echo "Cách dùng:"
    echo "./scripts/restore.sh backups/mongodb_xxx.tar.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Không tìm thấy file backup."
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