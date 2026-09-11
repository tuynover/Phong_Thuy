const https = require('https');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

/**
 * Cấu hình hồ sơ giọng đọc AI Neural cao cấp (Studio 96kbps & SSML Prosody)
 */
const VOICE_PROFILES = {
    hoaimy: {
        model: 'vi-VN-HoaiMyNeural',
        rate: '-6%',
        pitch: '+0Hz',
        volume: '+0%',
        name: 'Hoài My',
        tone: 'Nữ - Truyền Cảm (Studio VTV)'
    },
    namminh: {
        model: 'vi-VN-NamMinhNeural',
        rate: '-8%',
        pitch: '-2Hz',
        volume: '+0%',
        name: 'Nam Minh',
        tone: 'Nam - Trầm Ấm (Studio VTV)'
    },
    huonggiang: {
        model: 'vi-VN-HoaiMyNeural',
        rate: '-12%',
        pitch: '-1Hz',
        volume: '+0%',
        name: 'Hương Giang',
        tone: 'Nữ - Sâu Lắng (Radio Thiền Định)'
    },
    ngocmai: {
        model: 'vi-VN-HoaiMyNeural',
        rate: '-5%',
        pitch: '+1Hz',
        volume: '+0%',
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

    // 3. Chuẩn hóa khoảng trắng
    t = t.replace(/\s+/g, ' ').trim();

    // 4. Escape XML trước khi chèn thẻ ngắt nhịp thở
    let safeText = escapeXml(t);

    // 5. Chèn nhịp nghỉ thở tự nhiên (Breath pauses) tại các dấu ngắt câu
    safeText = safeText
        .replace(/,\s+/g, ', <break time="180ms"/> ')
        .replace(/;\s+/g, '; <break time="220ms"/> ')
        .replace(/:\s+/g, ': <break time="240ms"/> ')
        .replace(/\s+-\s+|\s+–\s+/g, ' <break time="200ms"/> ')
        .replace(/\.{3}/g, ' <break time="300ms"/> ');

    return safeText;
}

class TtsController {
    // In-memory cache lưu các đoạn MP3 đã tải (tối đa 1.000 câu)
    static cache = new Map();

    /**
     * Tải âm thanh chất lượng cao 96kbps Studio từ Microsoft Edge Neural TTS có SSML Prosody
     */
    static async synthesizeEdgeSSML(voiceKey, text) {
        const profile = VOICE_PROFILES[voiceKey] || VOICE_PROFILES.hoaimy;
        const tts = new MsEdgeTTS();
        
        // 1. Đặt định dạng âm thanh Studio 96kbps (gấp đôi bitrate 48kbps cũ, triệt tiêu tiếng kim loại)
        await tts.setMetadata(profile.model, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

        // 2. Chuẩn bị nội dung kèm nhịp thở tự nhiên
        const naturalText = preprocessTextForNaturalSpeech(text);

        // 3. Xây dựng SSML chuẩn phong cách đàm đạo sâu lắng
        const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="vi-VN">
            <voice name="${profile.model}">
                <prosody rate="${profile.rate}" pitch="${profile.pitch}" volume="${profile.volume}">
                    ${naturalText}
                </prosody>
            </voice>
        </speak>`;

        const { audioStream } = tts.rawToStream(ssml);
        return new Promise((resolve, reject) => {
            const chunks = [];
            audioStream.on('data', chunk => chunks.push(chunk));
            audioStream.on('end', () => resolve(Buffer.concat(chunks)));
            audioStream.on('error', reject);
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

            // Giữ kích thước cache tối đa 1000 câu
            if (TtsController.cache.size > 1000) {
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
}

module.exports = TtsController;
