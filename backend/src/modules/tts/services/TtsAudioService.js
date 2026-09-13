const https = require('https');
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

class TtsAudioService {
    static VOICE_PROFILES = VOICE_PROFILES;
    static cleanChapterMarkdown = cleanChapterMarkdown;
    static splitTextIntoSemanticChunks = splitTextIntoSemanticChunks;
    static preprocessTextForNaturalSpeech = preprocessTextForNaturalSpeech;

    /**
     * Tải âm thanh chất lượng cao 96kbps Studio từ Microsoft Edge Neural TTS
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
        
        await tts.setMetadata(profile.model, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
        const naturalText = preprocessTextForNaturalSpeech(text);
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
}

module.exports = TtsAudioService;
