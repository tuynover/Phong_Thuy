#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

RCLONE_CONFIG="$PROJECT_DIR/config/rclone/rclone.conf"

REMOTE="ggdrive_cobatuoc@gmail.com:backup/mongo_atlas"

FILES=$(rclone lsf "$REMOTE" \
--config "$RCLONE_CONFIG" \
| grep ".tar.gz$" \
| sort)

COUNT=$(echo "$FILES" | wc -l)

KEEP=30

if [ "$COUNT" -gt "$KEEP" ]; then
    REMOVE=$((COUNT-KEEP))

    echo "$FILES" | head -n "$REMOVE" | while read FILE
    do
        echo "Deleting $FILE"
        rclone deletefile "$REMOTE/$FILE" \
        --config "$RCLONE_CONFIG"
    done
fi