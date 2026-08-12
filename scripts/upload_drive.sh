#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

BACKUP_DIR="$PROJECT_DIR/backups"

RCLONE_CONFIG="$PROJECT_DIR/config/rclone/rclone.conf"

REMOTE_NAME="ggdrive_cobatuoc@gmail.com"

REMOTE_FOLDER="backup/mongo_atlas"

echo "Uploading backups to Google Drive..."

rclone copy \
    "$BACKUP_DIR" \
    "$REMOTE_NAME:$REMOTE_FOLDER" \
    --config "$RCLONE_CONFIG" \
    --progress

echo "Cleaning old backups..."

rclone lsf \
"$REMOTE_NAME:$REMOTE_FOLDER" \
--config "$RCLONE_CONFIG" \
| sort \
| head -n -30 \
| while read file
do
    rclone deletefile \
    "$REMOTE_NAME:$REMOTE_FOLDER/$file" \
    --config "$RCLONE_CONFIG"
done

echo "Upload completed."