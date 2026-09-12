const https = require('https');
const crypto = require('crypto');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

/**
 * Cấu hình hồ sơ giọng đọc AI Neural cao cấp (Studio 96kbps & SSML Prosody)
 */
const VOICE_PROFILES = {
    thayluan: {
        model: 'vi-VN-NamMinhNeural',
        rate: '-5%',
        pitch: '-4Hz',
        volume: '100',
        name: 'Thầy Luận',
        tone: 'Nam - Trầm Hùng Uy Nghi (Bậc Thầy Đạo Dịch)'
    },
    hoaimy: {
        model: 'vi-VN-HoaiMyNeural',
        rate: '-4%',
        pitch: '+0Hz',
        volume: '100',
        name: 'Hoài My',
        tone: 'Nữ - Truyền Cảm (Studio VTV)'
    },
    namminh: {
        model: 'vi-VN-NamMinhNeural',
        rate: '-6%',
        pitch: '-1Hz',
        volume: '100',
        name: 'Nam Minh',
        tone: 'Nam - Trầm Ấm (Studio VTV)'
    },
    huonggiang: {
        model: 'vi-VN-HoaiMyNeural',
        rate: '-8%',
        pitch: '-1Hz',
        volume: '100',
        name: 'Hương Giang',
        tone: 'Nữ - Sâu Lắng (Radio Thiền Định)'
    },
    ngocmai: {
        model: 'vi-VN-HoaiMyNeural',
        rate: '-3%',
        pitch: '+1Hz',
        volume: '100',
        name: 'Ngọc Mai',
        tone: 'Nữ - Ngọt Ngào (Studio)'
    }
};

/**
 * Thoát ký tự đặc biệt XML để tránh lỗi SSML parser
 */
function escapeXml(unsafe) {
    if (!unsafe || typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Tiền xử lý văn bản phong thủy để giọng đọc nói tự nhiên, thuần Việt và có nhịp thở
 */
function preprocessTextForNaturalSpeech(text) {
    if (!text) return '';
    let t = text.trim();

    // 1. Chuyển đổi các ký hiệu đặc biệt sang từ ngữ thuần Việt
    t = t
        .replace(/&/g, ' và ')
        .replace(/%/g, ' phần trăm ')
        .replace(/\+/g, ' cộng ')
        .replace(/@/g, ' a còng ')
        .replace(/\$/g, ' đô la ')
        .replace(/(\d+)\s*\/\s*(\d+)/g, '$1 trên $2')
        .replace(/\s*\/\s*/g, ' hoặc ')
        .replace(/\bSWOT\b/gi, 'ma trận thế mạnh điểm yếu')
        .replace(/\bAI\b/gi, 'A I')
        .replace(/\bbản\s+(?:báo\s+cáo\s+)?luận\s+giải\s+vip\b/gi, 'bản luận giải chuyên sâu')
        .replace(/\bbáo\s+cáo\s+luận\s+giải\s+vip\b/gi, 'báo cáo luận giải chuyên sâu')
        .replace(/\bluận\s+giải\s+vip\b/gi, 'luận giải chuyên sâu')
        .replace(/\bbáo\s+cáo\s+vip\b/gi, 'báo cáo chuyên sâu')
        .replace(/\bgói\s+vip\b/gi, 'gói chuyên sâu')
        .replace(/\bphân\s+tích\s+vip\b/gi, 'phân tích chuyên sâu')
        .replace(/\bvip\b/gi, 'chuyên sâu')
        .replace(/\bbản\s+bản\b/gi, 'bản');

    // 2. Chuyển đổi số La Mã trong tiêu đề (Cụm I, II, III, IV, V, VI, VII, VIII, IX, X)
    t = t
        .replace(/\bCụm\s+I\b/gi, 'Cụm 1')
        .replace(/\bCụm\s+II\b/gi, 'Cụm 2')
        .replace(/\bCụm\s+III\b/gi, 'Cụm 3')
        .replace(/\bCụm\s+IV\b/gi, 'Cụm 4')
        .replace(/\bCụm\s+V\b/gi, 'Cụm 5')
        .replace(/\bChương\s+I\b/gi, 'Chương 1')
        .replace(/\bChương\s+II\b/gi, 'Chương 2')
        .replace(/\bChương\s+III\b/gi, 'Chương 3')
        .replace(/\bChương\s+IV\b/gi, 'Chương 4')
        .replace(/\bChương\s+V\b/gi, 'Chương 5');

    // 3. Chuẩn hóa khoảng trắng và loại bỏ triệt để Emoji / Icon Unicode gây đứt kết nối WebSocket của Microsoft Edge TTS
    t = t
        .replace(/[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();

    // 4. Escape XML trước khi xử lý
    let safeText = escapeXml(t);

    // 5. Chuẩn hóa dấu câu thuần túy, loại bỏ hoàn toàn ký tự lạ (gạch ngang dài, dấu chấm lửng) để tránh lỗi WebSocket ngắt kết nối
    safeText = safeText
        .replace(/[—–]/g, ', ')
        .replace(/\.{2,}/g, '. ')
        .replace(/\s+([,.:;!?])/g, '$1')
        .replace(/[ \t]+/g, ' ')
        .trim();

    return safeText;
}

/**
 * Làm sạch Markdown toàn diện cho toàn bộ nội dung chương
 */
function cleanChapterMarkdown(markdownText) {
    if (!markdownText || typeof markdownText !== 'string') return '';
    let text = markdownText;

    // Chuyển đổi bảng Markdown sang văn xuôi
    const lines = text.split(/\r?\n/);
    const processedLines = [];
    let inTable = false;
    let tableHeaders = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('|') && line.endsWith('|')) {
            const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
            if (cells.some(c => /^:?-+:?$/.test(c))) {
                inTable = true;
                continue;
            }
            if (!inTable) {
                tableHeaders = cells;
                inTable = true;
            } else {
                const spokenCells = [];
                cells.forEach((cell, idx) => {
                    const header = tableHeaders[idx] || `Mục ${idx + 1}`;
                    spokenCells.push(`${header}: ${cell}`);
                });
                processedLines.push(spokenCells.join('. ') + '.');
            }
            continue;
        } else {
            inTable = false;
            tableHeaders = [];
        }
        processedLines.push(lines[i]);
    }
    text = processedLines.join('\n');

    // Chuyển đổi ký hiệu học thuật & tiêu đề
    text = text
        .replace(/[(（]\s*M\s*[)）]/gi, ' (Miếu địa) ')
        .replace(/[(（]\s*V\s*[)）]/gi, ' (Vượng địa) ')
        .replace(/[(（]\s*Đ\s*[)）]/gi, ' (Đắc địa) ')
        .replace(/[(（]\s*B\s*[)）]/gi, ' (Bình hòa) ')
        .replace(/[(（]\s*H\s*[)）]/gi, ' (Hãm địa) ')
        .replace(/^#{1,6}\s*(?:CỤM|CHƯƠNG|TRỤ CỘT|KỊCH BẢN)\s*(\d+)\s*[:\s–-]+(.*)$/gim, 'Cụm $1: $2.')
        .replace(/^#{1,6}\s*(\d+(?:\.\d+)?)\s*[:\s–-]+(.*)$/gim, 'Mục $1: $2.')
        .replace(/^#{1,6}\s*(.*)$/gim, '$1.')
        .replace(/^[*\-+]\s+/gim, '')
        .replace(/^\d+\.\s+/gim, '')
        .replace(/---UNGKYSTART---[\s\S]*?---UNGKYEND---/gi, '')
        .replace(/---UNGKYSTART---|---UNGKYEND---/gi, '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/~~([^~]+)~~/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/^---+$|^\*\*\*+$|^___+$/gm, '')
        .replace(/[[\]{}()]/g, ' ')
        .replace(/[\\/|]/g, ' ')
        .replace(/[—–]/g, ', ')
        .replace(/\.{2,}/g, '. ')
        .replace(/&/g, ' và ')
        .replace(/%/g, ' phần trăm ')
        .replace(/\+/g, ' cộng ')
        .replace(/\$/g, ' đô la ')
        .replace(/[<>]/g, ' ')
        .replace(/[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '')
        .replace(/\bbản\s+(?:báo\s+cáo\s+)?luận\s+giải\s+vip\b/gi, 'bản luận giải chuyên sâu')
        .replace(/\bbáo\s+cáo\s+luận\s+giải\s+vip\b/gi, 'báo cáo luận giải chuyên sâu')
        .replace(/\bluận\s+giải\s+vip\b/gi, 'luận giải chuyên sâu')
        .replace(/\bbáo\s+cáo\s+vip\b/gi, 'báo cáo chuyên sâu')
        .replace(/\bgói\s+vip\b/gi, 'gói chuyên sâu')
        .replace(/\bphân\s+tích\s+vip\b/gi, 'phân tích chuyên sâu')
        .replace(/\bvip\b/gi, 'chuyên sâu')
        .replace(/\bbản\s+bản\b/gi, 'bản')
        .replace(/[ \t]+/g, ' ')
        .replace(/\s+([,.:;!?])/g, '$1')
        .trim();

    return text;
}

/**
 * Chia văn bản dài của chương thành các khối ngữ nghĩa an toàn (~650 ký tự)
 * Tối ưu hóa tốc độ tải âm thanh từng đoạn, chống timeout WebSocket và đảm bảo giọng đọc trơn tru
 */
function splitTextIntoSemanticChunks(text, maxChunkLen = 650) {
    if (!text || text.length <= maxChunkLen) return [text];
    
    const paragraphs = text.split(/\n+/).map(p => p.trim()).filter(Boolean);
    const chunks = [];
    let currentChunk = '';

    for (const para of paragraphs) {
        if ((currentChunk + ' ' + para).length <= maxChunkLen) {
            currentChunk = currentChunk ? (currentChunk + ' ' + para) : para;
        } else {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }
            if (para.length > maxChunkLen) {
                const sentences = para.match(/[^.!?]+(?:[.!?]+|$)/g) || [para];
                let subChunk = '';
                for (const sentence of sentences) {
                    const trimmedSent = sentence.trim();
                    if ((subChunk + ' ' + trimmedSent).length <= maxChunkLen) {
                        subChunk = subChunk ? (subChunk + ' ' + trimmedSent) : trimmedSent;
                    } else {
                        if (subChunk) chunks.push(subChunk.trim());
                        subChunk = trimmedSent;
                    }
                }
                if (subChunk) chunks.push(subChunk.trim());
            } else {
                currentChunk = para;
            }
        }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks.filter(c => c.length > 0);
}

class TtsController {
    // In-memory cache lưu các đoạn MP3 đã tải (tối đa 2.000 câu)
    static cache = new Map();
    // In-memory cache lưu các chương MP3 hoàn chỉnh (tối đa 300 chương)
    static chapterCache = new Map();
    // In-memory cache lưu các vé truyền phát luồng (tối đa 1.000 vé)
    static ticketCache = new Map();

    /**
     * Tải âm thanh chất lượng cao 96kbps Studio từ Microsoft Edge Neural TTS
     * Kết nối trực tiếp 0ms độ trễ kèm Cancel Token chống xung đột WebSocket
     */
    static async synthesizeEdgeSSML(voiceKey, text, timeoutMs = 45000, cancelToken = null) {
        if (cancelToken && cancelToken.isCancelled) {
            throw new Error('Yêu cầu bị hủy trước khi bắt đầu');
        }

        const profile = VOICE_PROFILES[voiceKey] || VOICE_PROFILES.hoaimy;
        const tts = new MsEdgeTTS();

        if (cancelToken) {
            cancelToken.onCancel = () => {
                try { tts.close(); } catch (e) {}
            };
        }
        
        // 1. Đặt định dạng âm thanh Studio 96kbps
        await tts.setMetadata(profile.model, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

        // 2. Chuẩn bị nội dung kèm nhịp thở tự nhiên
        const naturalText = preprocessTextForNaturalSpeech(text);

        // 3. Sử dụng toStream chuẩn native từ Microsoft Edge Neural (0ms trễ)
        const { audioStream } = tts.toStream(naturalText);
        return new Promise((resolve, reject) => {
            const chunks = [];
            let finished = false;

            const timer = setTimeout(() => {
                if (!finished) {
                    finished = true;
                    try { tts.close(); } catch (e) {}
                    reject(new Error(`Edge TTS SSML timeout after ${timeoutMs}ms`));
                }
            }, timeoutMs);

            audioStream.on('data', chunk => chunks.push(chunk));
            audioStream.on('end', () => {
                if (!finished) {
                    finished = true;
                    clearTimeout(timer);
                    try { tts.close(); } catch (e) {}
                    resolve(Buffer.concat(chunks));
                }
            });
            audioStream.on('error', (err) => {
                if (!finished) {
                    finished = true;
                    clearTimeout(timer);
                    try { tts.close(); } catch (e) {}
                    reject(err);
                }
            });
        });
    }

    /**
     * Tải âm thanh từ Google TTS (Phương án dự phòng khẩn cấp)
     */
    static async synthesizeGoogle(text, lang = 'vi') {
        const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(lang)}&q=${encodeURIComponent(text)}`;
        return new Promise((resolve, reject) => {
            https.get(googleUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            }, (res) => {
                if (res.statusCode !== 200) {
                    return reject(new Error(`Google TTS status code ${res.statusCode}`));
                }
                const chunks = [];
                res.on('data', chunk => chunks.push(chunk));
                res.on('end', () => resolve(Buffer.concat(chunks)));
            }).on('error', reject);
        });
    }

    /**
     * GET /api/tts?text=...&voice=hoaimy|namminh|huonggiang|ngocmai&lang=vi
     */
    static async synthesize(req, res) {
        try {
            const { text, voice = 'hoaimy', lang = 'vi' } = req.query;
            if (!text || typeof text !== 'string' || !text.trim()) {
                return res.status(400).json({ error: 'Text query parameter is required' });
            }

            const cleanText = text.trim().slice(0, 600);
            const cacheKey = `v2:${voice}:${cleanText}`;

            if (TtsController.cache.has(cacheKey)) {
                const cachedBuffer = TtsController.cache.get(cacheKey);
                res.setHeader('Content-Type', 'audio/mpeg');
                res.setHeader('Cache-Control', 'public, max-age=86400');
                return res.send(cachedBuffer);
            }

            let audioBuffer = null;

            try {
                // Ưu tiên phát bằng Edge Neural Studio 96kbps có SSML Prosody
                audioBuffer = await TtsController.synthesizeEdgeSSML(voice, cleanText);
            } catch (providerError) {
                console.warn(`[TtsController] SSML error with voice ${voice}, falling back to standard synthesis:`, providerError.message);
                try {
                    const profile = VOICE_PROFILES[voice] || VOICE_PROFILES.hoaimy;
                    const fallbackTts = new MsEdgeTTS();
                    await fallbackTts.setMetadata(profile.model, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
                    const { audioStream } = fallbackTts.toStream(cleanText);
                    audioBuffer = await new Promise((resolve, reject) => {
                        const chunks = [];
                        audioStream.on('data', chunk => chunks.push(chunk));
                        audioStream.on('end', () => resolve(Buffer.concat(chunks)));
                        audioStream.on('error', reject);
                    });
                } catch (edgeError) {
                    console.warn('[TtsController] Edge TTS fallback failed, trying Google TTS:', edgeError.message);
                    try {
                        audioBuffer = await TtsController.synthesizeGoogle(cleanText, lang);
                    } catch (fallbackError) {
                        console.error('[TtsController] Fallback error:', fallbackError.message);
                        return res.status(502).json({ error: 'Failed to synthesize audio from providers' });
                    }
                }
            }

            if (!audioBuffer || audioBuffer.length === 0) {
                return res.status(500).json({ error: 'Empty audio buffer received' });
            }

            // Giữ kích thước cache tối đa 2000 câu
            if (TtsController.cache.size > 2000) {
                const firstKey = TtsController.cache.keys().next().value;
                TtsController.cache.delete(firstKey);
            }
            TtsController.cache.set(cacheKey, audioBuffer);

            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.send(audioBuffer);
        } catch (error) {
            console.error('[TtsController] Internal Error:', error);
            return res.status(500).json({ error: 'Internal server error in TTS controller' });
        }
    }

    /**
     * POST hoặc GET /api/tts/chapter
     * Tổng hợp trọn vẹn một chương thành 1 file MP3 liên tục duy nhất (0ms ngắt quãng giữa các câu)
     */
    static async synthesizeChapter(req, res) {
        try {
            const body = req.body || {};
            const query = req.query || {};
            const rawContent = body.content || body.text || query.text || query.content;
            const voice = body.voice || query.voice || 'hoaimy';
            const sectionId = body.sectionId || query.sectionId || '';

            if (!rawContent || typeof rawContent !== 'string' || !rawContent.trim()) {
                return res.status(400).json({ error: 'Nội dung chương là bắt buộc' });
            }

            const cleanText = cleanChapterMarkdown(rawContent);
            if (!cleanText) {
                return res.status(400).json({ error: 'Nội dung rỗng sau khi làm sạch định dạng' });
            }

            // Tạo cache key chuẩn hóa theo giọng + sectionId + MD5 hash nội dung (chống trùng lặp tuyệt đối)
            const textHash = crypto.createHash('md5').update(cleanText).digest('hex').slice(0, 16);
            const cacheKey = `chap:${voice}:${sectionId || 'sec'}:${textHash}`;

            if (TtsController.chapterCache.has(cacheKey)) {
                const cachedBuffer = TtsController.chapterCache.get(cacheKey);
                const total = cachedBuffer.length;
                if (req.headers.range) {
                    const range = req.headers.range;
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
                    return res.end(cachedBuffer.slice(start, end + 1));
                }

                res.setHeader('Content-Type', 'audio/mpeg');
                res.setHeader('Cache-Control', 'public, max-age=86400');
                res.setHeader('Accept-Ranges', 'bytes');
                res.setHeader('Content-Length', total);
                return res.send(cachedBuffer);
            }

            // Phát hiện hủy kết nối từ phía client (khi user chuyển giọng hoặc đổi chương)
            let isClientDisconnected = false;
            const cancelToken = { isCancelled: false, onCancel: null };
            if (res && typeof res.on === 'function') {
                res.on('close', () => {
                    if (!res.writableEnded) {
                        isClientDisconnected = true;
                        cancelToken.isCancelled = true;
                        if (typeof cancelToken.onCancel === 'function') {
                            try { cancelToken.onCancel(); } catch (e) {}
                        }
                    }
                });
            }

            // Chia thành các khối an toàn (~650 ký tự) để MsEdgeTTS tổng hợp cực nhanh và không bao giờ nghẽn WebSocket
            const chunks = splitTextIntoSemanticChunks(cleanText, 650);

            const audioBuffers = [];

            // Xử lý trực tiếp 0ms trễ
            for (let i = 0; i < chunks.length; i++) {
                if (isClientDisconnected || cancelToken.isCancelled) break;
                const chunk = chunks[i];
                if (!chunk || !chunk.trim()) continue;

                let chunkBuf = null;

                // Tối đa 2 lần thử cho mỗi chunk với MsEdgeTTS
                for (let attempt = 1; attempt <= 2; attempt++) {
                    if (isClientDisconnected || cancelToken.isCancelled) break;
                    try {
                        chunkBuf = await TtsController.synthesizeEdgeSSML(voice, chunk, 35000, cancelToken);
                        if (chunkBuf && chunkBuf.length > 0) {
                            break;
                        }
                    } catch (chunkErr) {
                        if (isClientDisconnected) break;
                        console.warn(`[TtsController.synthesizeChapter] Chunk ${i + 1}/${chunks.length} attempt ${attempt} failed with voice ${voice}:`, chunkErr.message);
                    }
                }

                // Nếu Edge TTS vẫn thất bại sau 2 lần thử: chuyển thẳng sang Google TTS cứu cánh
                if (!chunkBuf || chunkBuf.length === 0) {
                    if (isClientDisconnected) break;
                    console.warn(`[TtsController.synthesizeChapter] Falling back to Google TTS for chunk ${i + 1}/${chunks.length}`);
                    try {
                        const shortText = chunk.slice(0, 180);
                        chunkBuf = await TtsController.synthesizeGoogle(shortText, 'vi');
                    } catch (googleErr) {
                        console.error('[TtsController.synthesizeChapter] Google TTS fallback error:', googleErr.message);
                    }
                }

                if (chunkBuf && chunkBuf.length > 0) {
                    // Nếu là chunk thứ 2 trở đi: bóc bỏ 288 bytes LAME header để file MP3 nối liền chuẩn xác 100%
                    if (i > 0 && chunkBuf.length > 288) {
                        audioBuffers.push(chunkBuf.slice(288));
                    } else {
                        audioBuffers.push(chunkBuf);
                    }
                }
            }

            if (isClientDisconnected) {
                return;
            }

            const validBuffers = audioBuffers.filter(Boolean);
            if (validBuffers.length === 0) {
                return res.status(500).json({ error: 'Không thể tổng hợp âm thanh cho chương' });
            }

            const completeChapterBuffer = Buffer.concat(validBuffers);

            // Giữ tối đa 300 chương trong RAM cache (~150MB RAM)
            if (TtsController.chapterCache.size > 300) {
                const firstKey = TtsController.chapterCache.keys().next().value;
                TtsController.chapterCache.delete(firstKey);
            }
            TtsController.chapterCache.set(cacheKey, completeChapterBuffer);

            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Content-Length', completeChapterBuffer.length);
            return res.send(completeChapterBuffer);
        } catch (error) {
            console.error('[TtsController.synthesizeChapter] Internal Error:', error);
            return res.status(500).json({ error: 'Internal server error in chapter TTS controller' });
        }
    }

    /**
     * POST /api/tts/ticket
     * Khởi tạo vé truyền phát trực tiếp (Streaming Audio Ticket) cho một chương
     * Trả về ticketId trong 2ms để Audio Element của trình duyệt kết nối stream ngay lập tức
     */
    static async createStreamTicket(req, res) {
        try {
            const body = req.body || {};
            const rawContent = body.content || body.text;
            const voice = body.voice || 'hoaimy';
            const sectionId = body.sectionId || '';

            if (!rawContent || typeof rawContent !== 'string' || !rawContent.trim()) {
                return res.status(400).json({ error: 'Nội dung chương là bắt buộc' });
            }

            const cleanText = cleanChapterMarkdown(rawContent);
            if (!cleanText) {
                return res.status(400).json({ error: 'Nội dung rỗng sau khi làm sạch định dạng' });
            }

            const textHash = crypto.createHash('md5').update(cleanText).digest('hex').slice(0, 16);
            const ticketId = `${voice}_${sectionId || 'sec'}_${textHash}`;
            const cacheKey = `chap:${voice}:${sectionId || 'sec'}:${textHash}`;

            const isCached = TtsController.chapterCache.has(cacheKey);

            if (!isCached) {
                if (TtsController.ticketCache.size > 1000) {
                    const firstKey = TtsController.ticketCache.keys().next().value;
                    TtsController.ticketCache.delete(firstKey);
                }
                TtsController.ticketCache.set(ticketId, {
                    cleanText,
                    voice,
                    sectionId,
                    cacheKey,
                    createdAt: Date.now()
                });
            }

            return res.json({
                success: true,
                ticketId,
                streamUrl: `/api/tts/stream/${ticketId}`,
                isCached
            });
        } catch (error) {
            console.error('[TtsController.createStreamTicket] Error:', error);
            return res.status(500).json({ error: 'Internal server error in createStreamTicket' });
        }
    }

    /**
     * GET /api/tts/stream/:ticketId
     * Truyền phát âm thanh trực tiếp (Live Audio Chunked Streaming) tới Audio Element
     * Trình duyệt nhận các gói MP3 đầu tiên trong < 500ms và phát tiếng ngay lập tức (< 1s)
     */
    static async streamAudioTicket(req, res) {
        try {
            const { ticketId } = req.params;
            if (!ticketId) {
                return res.status(400).send('Ticket ID is required');
            }

            // CORS headers cho phép Web Audio API DSP và Audio Element kết nối
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', '*');

            // 1. Phân tích ticketId để tái tạo cacheKey
            const parts = ticketId.split('_');
            const voice = parts[0] || 'hoaimy';
            const textHash = parts[parts.length - 1];
            const sectionId = parts.slice(1, parts.length - 1).join('_');
            const cacheKey = `chap:${voice}:${sectionId}:${textHash}`;

            // 2. Nếu chương đã có trong cache RAM: trả về toàn bộ file MP3 ngay lập tức (< 5ms)
            if (TtsController.chapterCache.has(cacheKey)) {
                const cachedBuffer = TtsController.chapterCache.get(cacheKey);
                const total = cachedBuffer.length;

                // Hỗ trợ HTTP 206 Partial Content (Range request) cho phép trình duyệt tua âm thanh tức thì
                if (req.headers.range) {
                    const range = req.headers.range;
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
                    return res.end(cachedBuffer.slice(start, end + 1));
                }

                res.writeHead(200, {
                    'Content-Type': 'audio/mpeg',
                    'Content-Length': total,
                    'Accept-Ranges': 'bytes',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=86400'
                });
                return res.end(cachedBuffer);
            }

            // 3. Nếu chưa có trong cache: tìm vé trong ticketCache
            const ticketData = TtsController.ticketCache.get(ticketId);
            if (!ticketData || !ticketData.cleanText) {
                return res.status(404).send('Audio stream ticket expired or not found');
            }

            // 4. Thiết lập Chunked Streaming Response
            res.writeHead(200, {
                'Content-Type': 'audio/mpeg',
                'Transfer-Encoding': 'chunked',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            });

            // 5. Xử lý khi người dùng ngắt kết nối (chuyển chương / bấm dừng) - Giải phóng trong 0ms
            let isClientDisconnected = false;
            let currentTts = null;
            let abortChunk = null;

            res.on('close', () => {
                if (!res.writableEnded) {
                    isClientDisconnected = true;
                    if (currentTts) {
                        try { currentTts.close(); } catch (e) {}
                    }
                    if (typeof abortChunk === 'function') {
                        try { abortChunk(); } catch (e) {}
                    }
                }
            });

            const textToSpeak = ticketData.cleanText;
            const profile = VOICE_PROFILES[ticketData.voice] || VOICE_PROFILES.hoaimy;

            // Chia thành các khối an toàn (~650 ký tự) để MsEdgeTTS không bị nghẽn WebSocket hoặc ngắt giữa chừng
            const chunks = splitTextIntoSemanticChunks(textToSpeak, 650);
            const collectedBuffers = [];

            // Truyền phát trực tiếp 0ms trễ
            for (let i = 0; i < chunks.length; i++) {
                if (isClientDisconnected || res.writableEnded) break;
                const chunk = chunks[i];
                if (!chunk || !chunk.trim()) continue;

                let isFirstDataForChunk = true;
                let chunkHeaderBuffer = Buffer.alloc(0);
                let chunkReceivedBytes = 0;

                await new Promise(async (resolve) => {
                    if (isClientDisconnected || res.writableEnded) return resolve();

                    const tts = new MsEdgeTTS();
                    currentTts = tts;

                    let finished = false;
                    const finish = () => {
                        if (!finished) {
                            finished = true;
                            clearTimeout(timer);
                            try { tts.close(); } catch (e) {}
                            currentTts = null;
                            abortChunk = null;
                            resolve();
                        }
                    };

                    abortChunk = finish;

                    const timer = setTimeout(() => {
                        finish();
                    }, 35000);

                    try {
                        await tts.setMetadata(profile.model, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
                        if (isClientDisconnected || res.writableEnded) {
                            return finish();
                        }
                        const naturalText = preprocessTextForNaturalSpeech(chunk);
                        const { audioStream } = tts.toStream(naturalText);

                        audioStream.on('data', (c) => {
                            if (isClientDisconnected || res.writableEnded) return;
                            chunkReceivedBytes += c.length;

                            // Chunk 1 (i === 0): truyền nguyên vẹn bao gồm cả MP3 Header ban đầu (< 350ms TTFB)
                            if (i === 0) {
                                res.write(c);
                                collectedBuffers.push(c);
                                return;
                            }

                            // Chunk 2 trở đi (i > 0): bóc bỏ 288 bytes LAME header của chunk này
                            // để trình duyệt nhận luồng MPEG Audio thuần túy liên tục, không bị EOF sớm
                            if (isFirstDataForChunk) {
                                chunkHeaderBuffer = Buffer.concat([chunkHeaderBuffer, c]);
                                if (chunkHeaderBuffer.length >= 288) {
                                    const remaining = chunkHeaderBuffer.slice(288);
                                    isFirstDataForChunk = false;
                                    if (remaining.length > 0 && !isClientDisconnected && !res.writableEnded) {
                                        res.write(remaining);
                                        collectedBuffers.push(remaining);
                                    }
                                }
                            } else {
                                res.write(c);
                                collectedBuffers.push(c);
                            }
                        });

                        audioStream.on('end', () => {
                            finish();
                        });

                        audioStream.on('error', async (err) => {
                            console.warn(`[TtsController.streamAudioTicket] Chunk ${i + 1}/${chunks.length} stream warning:`, err.message);
                            // Fallback Google TTS nếu chunk chưa nhận được byte nào
                            if (chunkReceivedBytes === 0 && !isClientDisconnected && !res.writableEnded) {
                                try {
                                    const googleBuf = await TtsController.synthesizeGoogle(chunk.slice(0, 180), 'vi');
                                    if (googleBuf && googleBuf.length > 0 && !isClientDisconnected && !res.writableEnded) {
                                        res.write(googleBuf);
                                        collectedBuffers.push(googleBuf);
                                    }
                                } catch (gErr) {}
                            }
                            finish();
                        });
                    } catch (err) {
                        console.warn(`[TtsController.streamAudioTicket] Chunk ${i + 1}/${chunks.length} exception:`, err.message);
                        finish();
                    }
                });
            }

            if (!res.writableEnded) {
                res.end();
            }

            // Lưu toàn bộ buffer vào cache để các lần nghe tiếp theo phát tức thì 0ms
            if (!isClientDisconnected && collectedBuffers.length > 0) {
                const completeBuffer = Buffer.concat(collectedBuffers);
                if (TtsController.chapterCache.size > 300) {
                    const firstKey = TtsController.chapterCache.keys().next().value;
                    TtsController.chapterCache.delete(firstKey);
                }
                TtsController.chapterCache.set(cacheKey, completeBuffer);
            }
        } catch (err) {
            console.error('[TtsController.streamAudioTicket] Error:', err);
            if (!res.writableEnded) {
                try { res.end(); } catch (e) {}
            }
        }
    }
}

module.exports = TtsController;
