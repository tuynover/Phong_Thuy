const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Thư mục đệm tạm thời cho tệp âm thanh MP3 (Zero Node.js RAM footprint)
const CACHE_DIR = path.join(__dirname, '../../../../scratch/tts_cache');
if (!fs.existsSync(CACHE_DIR)) {
    try {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    } catch (e) {}
}

class TtsCacheService {
    static getCacheFilePath(key) {
        const safeHash = crypto.createHash('sha256').update(key).digest('hex');
        return path.join(CACHE_DIR, `${safeHash}.mp3`);
    }

    static hasDiskCache(key) {
        return fs.existsSync(TtsCacheService.getCacheFilePath(key));
    }

    static streamFromDiskCache(key, req, res) {
        const filePath = TtsCacheService.getCacheFilePath(key);
        if (!fs.existsSync(filePath)) return false;
        try {
            const stat = fs.statSync(filePath);
            const total = stat.size;
            const range = req.headers.range;

            // Cập nhật mtime để LRU/TTL nhận biết file vừa được nghe
            const now = new Date();
            fs.utimes(filePath, now, now, () => {});

            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
                const chunksize = (end - start) + 1;
                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${total}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'audio/mpeg',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=86400'
                });
                fs.createReadStream(filePath, { start, end }).pipe(res);
            } else {
                res.writeHead(200, {
                    'Content-Length': total,
                    'Content-Type': 'audio/mpeg',
                    'Accept-Ranges': 'bytes',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=86400'
                });
                fs.createReadStream(filePath).pipe(res);
            }
            return true;
        } catch (err) {
            return false;
        }
    }

    static async saveDiskCache(key, buffer) {
        if (!buffer || buffer.length === 0) return;
        const filePath = TtsCacheService.getCacheFilePath(key);
        try {
            await fs.promises.writeFile(filePath, buffer);
        } catch (e) {
            console.warn('[TtsCacheService] Warning saving disk cache:', e.message);
        }
    }

    // Hàm dọn dẹp định kỳ các file âm thanh tạm quá 24h
    static cleanupExpiredTtsFiles(maxAgeMs = 24 * 60 * 60 * 1000) {
        if (!fs.existsSync(CACHE_DIR)) return;
        fs.readdir(CACHE_DIR, (err, files) => {
            if (err || !files) return;
            const now = Date.now();
            for (const file of files) {
                if (!file.endsWith('.mp3')) continue;
                const fullPath = path.join(CACHE_DIR, file);
                fs.stat(fullPath, (statErr, stat) => {
                    if (!statErr && stat) {
                        if (now - stat.mtimeMs > maxAgeMs) {
                            fs.unlink(fullPath, () => {});
                        }
                    }
                });
            }
        });
    }
}

// Timer dọn dẹp chạy mỗi 30 phút, dùng .unref() để không giữ tiến trình
const sweepTimer = setInterval(() => {
    TtsCacheService.cleanupExpiredTtsFiles();
}, 30 * 60 * 1000);
if (sweepTimer.unref) sweepTimer.unref();

module.exports = TtsCacheService;
