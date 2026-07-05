#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"

DATE=$(date +"%Y-%m-%d_%H-%M-%S")
TMP_DIR="$BACKUP_DIR/tmp_$DATE"

mkdir -p "$TMP_DIR"

docker run --rm \
  -v "$TMP_DIR:/backup" \
  mongo:8 \
  bash -c "mongodump --uri=\"$MONGODB_URI\" --out=/backup"

tar -czf "$BACKUP_DIR/mongodb_$DATE.tar.gz" -C "$TMP_DIR" .

rm -rf "$TMP_DIR"

find "$BACKUP_DIR" -name "mongodb_*.tar.gz" -type f | sort | head -n -7 | xargs -r rm

echo "Backup completed."