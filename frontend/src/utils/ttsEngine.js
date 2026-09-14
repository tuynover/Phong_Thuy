/**
 * 🎙️ ttsEngine.js - Động cơ Text-to-Speech phong thủy chuẩn học thuật
 * Tối ưu hóa cho văn bản luận giải dài (4.000 - 7.000 từ)
 * Chạy 100% Native Web Speech API: 0đ chi phí, 0ms độ trễ, 0 băng thông server.
 */

/**
 * 1. Làm sạch định dạng Markdown và phiên âm thuật ngữ cổ học
 */
export function cleanMarkdownForSpeech(markdownText) {
    if (!markdownText || typeof markdownText !== 'string') return "";

    let text = markdownText;

    // 1.1 Chuyển đổi bảng Markdown sang câu văn xuôi tự nhiên
    // Bảng dạng: | Cột 1 | Cột 2 | Cột 3 |
    const lines = text.split(/\r?\n/);
    const processedLines = [];
    let inTable = false;
    let tableHeaders = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Kiểm tra dòng bảng
        if (line.startsWith('|') && line.endsWith('|')) {
            const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0);

            // Bỏ qua dòng phân cách |:---|:---|
            if (cells.some(c => /^:?-+:?$/.test(c))) {
                inTable = true;
                continue;
            }

            if (!inTable) {
                // Hàng tiêu đề bảng
                tableHeaders = cells;
                inTable = true;
            } else {
                // Hàng dữ liệu bảng: Chuyển thành văn xuôi
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

    // 1.2 Phiên âm ký hiệu đắc hãm Tử Vi & Bát Tự cổ học
    text = text
        .replace(/[(（]\s*M\s*[)）]/gi, ' (Miếu địa) ')
        .replace(/[(（]\s*V\s*[)）]/gi, ' (Vượng địa) ')
        .replace(/[(（]\s*Đ\s*[)）]/gi, ' (Đắc địa) ')
        .replace(/[(（]\s*B\s*[)）]/gi, ' (Bình hòa) ')
        .replace(/[(（]\s*H\s*[)）]/gi, ' (Hãm địa) ')
        .replace(/[(（]\s*KHOA\s*[)）]/gi, ' (Hóa Khoa) ')
        .replace(/[(（]\s*QUYỀN\s*[)）]/gi, ' (Hóa Quyền) ')
        .replace(/[(（]\s*LỘC\s*[)）]/gi, ' (Hóa Lộc) ')
        .replace(/[(（]\s*KỴ\s*[)）]/gi, ' (Hóa Kỵ) ');

    // 1.3 Chuẩn hóa tiêu đề Markdown sang lời nói
    text = text
        .replace(/^#{1,6}\s*(?:CỤM|CHƯƠNG|TRỤ CỘT|KỊCH BẢN)\s*(\d+)\s*[:\s–-]+(.*)$/gim, 'Cụm $1: $2.')
        .replace(/^#{1,6}\s*(\d+(?:\.\d+)?)\s*[:\s–-]+(.*)$/gim, 'Mục $1: $2.')
        .replace(/^#{1,6}\s*(.*)$/gim, '$1.')
        .replace(/^[*\-+]\s+/gim, '')
        .replace(/^\d+\.\s+/gim, '')
        .replace(/^>\s*/gim, 'Lời khuyên: ');

    // 1.35 Tuyệt đối không để từ VIP trong bài đọc, chuyển sang chuyên sâu
    text = text
        .replace(/\bbản\s+(?:báo\s+cáo\s+)?luận\s+giải\s+vip\b/gi, 'bản luận giải chuyên sâu')
        .replace(/\bbáo\s+cáo\s+luận\s+giải\s+vip\b/gi, 'báo cáo luận giải chuyên sâu')
        .replace(/\bluận\s+giải\s+vip\b/gi, 'luận giải chuyên sâu')
        .replace(/\bbáo\s+cáo\s+vip\b/gi, 'báo cáo chuyên sâu')
        .replace(/\bgói\s+vip\b/gi, 'gói chuyên sâu')
        .replace(/\bphân\s+tích\s+vip\b/gi, 'phân tích chuyên sâu')
        .replace(/\bvip\b/gi, 'chuyên sâu')
        .replace(/\bbản\s+bản\b/gi, 'bản');

    // 1.4 Loại bỏ các khối metadata máy đọc (Ứng Kỳ, Code blocks, v.v.)
    text = text
        .replace(/---UNGKYSTART---[\s\S]*?---UNGKYEND---/gi, '')
        .replace(/---UNGKYSTART---|---UNGKYEND---/gi, '')
        .replace(/```[\s\S]*?```/g, '') // code block
        .replace(/`([^`]+)`/g, '$1')     // inline code
        .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
        .replace(/\*([^*]+)\*/g, '$1')   // italic
        .replace(/__([^_]+)__/g, '$1')   // bold
        .replace(/_([^_]+)_/g, '$1')     // italic
        .replace(/~~([^~]+)~~/g, '$1')   // strikethrough
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // link
        .replace(/^---+$|^\*\*\*+$|^___+$/gm, '') // horizontal rule
        .replace(/[[\]{}()]/g, ' ')
        .replace(/[\\/|]/g, ' ')
        .replace(/["“”«»]/g, ' ')
        .replace(/[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '');

    // 1.5 Chuẩn hóa khoảng trắng
    text = text
        .replace(/[ \t]+/g, ' ')
        .replace(/\s+([,.:;!?])/g, '$1')
        .replace(/\bbản\s+bản\b/gi, 'bản')
        .trim();

    return text;
}

/**
 * 2. Cắt lát văn bản thành mảng các câu hoàn chỉnh (Sentence Chunks)
 * Tối ưu thời lượng đọc từng câu (~40 - 150 ký tự) để giọng đọc thở nhịp nhàng
 */
export function splitIntoSpeechSentences(cleanedText) {
    if (!cleanedText) return [];

    // Tách theo các dấu kết thúc câu tiếng Việt: ., !, ?, :\n, ;\n, hoặc \n
    const rawParagraphs = cleanedText.split(/\n+/);
    const sentences = [];
    let idCounter = 0;

    rawParagraphs.forEach(para => {
        const trimmed = para.trim();
        if (!trimmed) return;

        // Regex tách câu thông minh: chỉ tách tại dấu chấm, hỏi, cảm thán, hoặc hai chấm xuống dòng
        const parts = trimmed.match(/[^.!?\n]+(?:[.!?]+|\n|$)/g) || [trimmed];

        parts.forEach(part => {
            let sentence = part.trim();
            // Bỏ dấu câu đơn lẻ hoặc chuỗi quá ngắn
            if (sentence.length < 3 || /^[-.,;:!? ]+$/.test(sentence)) return;

            // Nếu câu quá dài (> 180 ký tự), tách thêm theo dấu phẩy hoặc liên từ để tránh hụt hơi
            if (sentence.length > 180) {
                const subParts = sentence.split(/,\s+|\s+và\s+|\s+nhưng\s+/);
                let buffer = "";
                subParts.forEach(sub => {
                    if ((buffer + sub).length < 160) {
                        buffer += (buffer ? ", " : "") + sub;
                    } else {
                        if (buffer.trim()) {
                            sentences.push({ id: idCounter++, text: buffer.trim() });
                        }
                        buffer = sub;
                    }
                });
                if (buffer.trim()) {
                    sentences.push({ id: idCounter++, text: buffer.trim() });
                }
            } else {
                sentences.push({ id: idCounter++, text: sentence });
            }
        });
    });

    return sentences;
}

/**
 * 3. Tìm kiếm và phân loại danh sách giọng đọc tiếng Việt của hệ điều hành
 */
export function getAvailableVietnameseVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
        return { female: [], male: [], all: [], defaultVoice: null };
    }

    const voices = window.speechSynthesis.getVoices();
    const viVoices = voices.filter(v => {
        const lang = (v.lang || '').toLowerCase();
        const name = (v.name || '').toLowerCase();
        return lang.startsWith('vi') || lang.includes('vn') || name.includes('vietnam') || name.includes('vietnamese');
    });

    // Phân loại Nam / Nữ dựa trên tên đặc trưng của Microsoft / Google / Apple
    const female = [];
    const male = [];

    viVoices.forEach(v => {
        const n = v.name.toLowerCase();
        // Microsoft An: Voice nữ mặc định trên Windows OneCore
        // Microsoft HoaiMy: Voice nữ Online
        // Apple Linh, Mai: Voice nữ iOS/macOS
        // Google tiếng Việt: Voice nữ mặc định Chrome
        if (n.includes('hoaimy') || n.includes('linh') || n.includes('mai') || n.includes(' an ') || n.includes('an -') || n.includes('female') || n.includes('nu') || n.includes('nữ') || n.includes('google')) {
            female.push(v);
        } else if (n.includes('namminh') || n.includes('minh') || n.includes('male') || n.includes('nam') || n.includes('khoi') || n.includes('quang')) {
            male.push(v);
        } else {
            // Mặc định
            female.push(v);
        }
    });

    // Ưu tiên chọn giọng Microsoft Natural (HoaiMy/NamMinh) nếu có
    const priorityVoice = viVoices.find(v => v.name.includes('Natural') || v.name.includes('Online')) ||
                          female[0] ||
                          viVoices[0] || 
                          voices.find(v => v.lang.startsWith('vi')) || 
                          null;

    return {
        female,
        male,
        all: viVoices,
        defaultVoice: priorityVoice
    };
}

export function getApiBase() {
    if (typeof window !== 'undefined' && window.__API_URL__) return window.__API_URL__;
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    if (typeof window !== 'undefined') {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return `http://${window.location.hostname}:3001/api`;
        }
        return `${window.location.origin}/api`;
    }
    return 'http://localhost:3001/api';
}

export const VOICES = [
    { id: 'hoaimy', name: 'Hoài My', gender: 'female', tone: 'Nữ - Truyền Cảm (Studio VTV)', provider: 'neural', icon: '🌸' },
    { id: 'namminh', name: 'Nam Minh', gender: 'male', tone: 'Nam - Trầm Ấm (Studio VTV)', provider: 'neural', icon: '🎙️' },
    { id: 'huonggiang', name: 'Hương Giang', gender: 'female', tone: 'Nữ - Sâu Lắng (Radio Thiền Định)', provider: 'neural', icon: '🪷' },
    { id: 'thayluan', name: 'Thầy Luận', gender: 'male', tone: 'Nam - Thiết Bị Bản Địa', provider: 'device', icon: '📿' },
    { id: 'ngocmai', name: 'Ngọc Mai', gender: 'female', tone: 'Nữ - Ngọt Ngào (Studio)', provider: 'neural', icon: '✨' },
];

/**
 * 4. Chuỗi xử lý âm thanh chuẩn phòng thu (Web Audio API Studio Mastering Chain)
/**
 * Tạo đường cong chuyển giao bão hòa sóng phi tuyến (Soft-Saturation WaveShaper Curve)
 * Giúp sinh ra các hài âm bậc chẵn (2nd harmonic) và bậc lẻ (3rd harmonic) ấm áp
 */
function makeHarmonicExciterCurve(samples = 256) {
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        // Soft saturation tạo chất âm đèn điện tử (Analog Tape / Tube warmth)
        curve[i] = Math.tanh(1.6 * x) / Math.tanh(1.6);
    }
    return curve;
}

/**
 * 4. Chuỗi xử lý âm thanh chuẩn phòng thu (Web Audio API Audiophile Mastering Chain)
 * - Tầng 1 (High-pass filter): Cắt sạch tần số ù rền dưới 80Hz (12dB/oct)
 * - Tầng 2 (Low-shelf filter): Bù đắp độ ấm, độ dày giọng lồng ngực (140Hz, +3.0dB)
 * - Tầng 3 (Peaking presence filter): Tách bạch rõ nét âm tiết khẩu hình (2.8kHz, +2.0dB, Q=1.2)
 * - Tầng 4 (De-Esser anti-harshness filter): Triệt tiêu tiếng xuýt gắt của âm gió AI (6.8kHz, -1.8dB, Q=2.0)
 * - Tầng 5 (High-shelf air filter): Mở rộng dải âm cao thoáng đãng chuẩn studio (11kHz, +1.2dB)
 * - Tầng 6 (Psychoacoustic Harmonic Exciter): Tái tạo hài âm tinh tế 8kHz - 14kHz chuẩn micro màng lớn
 * - Tầng 7 (Subtle Studio Ambience): Tạo chiều sâu không gian thiền phòng đàm đạo (20ms early reflection)
 * - Tầng 8 (Broadcast Dynamics Compressor): Cân bằng âm lượng, nén mượt chuẩn radio/podcast
 */
class WebAudioMaster {
    constructor() {
        this.ctx = null;
        this.source = null;
        this.highPass = null;
        this.lowShelf = null;
        this.peakingPresence = null;
        this.deEsser = null;
        this.highShelfAir = null;
        this.exciterBandpass = null;
        this.exciterShaper = null;
        this.exciterHighPass = null;
        this.exciterGain = null;
        this.ambienceDelay = null;
        this.ambienceFilter = null;
        this.ambienceGain = null;
        this.compressor = null;
        this.gainNode = null;
        this.isInitialized = false;
    }

    init(audioElementA, audioElementB = null) {
        if (this.isInitialized || typeof window === 'undefined' || !audioElementA) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            this.ctx = new AudioContextClass();

            // 1. High-pass filter (Cắt tiếng ù rền dưới 80Hz)
            this.highPass = this.ctx.createBiquadFilter();
            this.highPass.type = 'highpass';
            this.highPass.frequency.value = 80;
            this.highPass.Q.value = 0.7;

            // 2. Low-shelf filter (Độ ấm & đầy đặn lồng ngực)
            this.lowShelf = this.ctx.createBiquadFilter();
            this.lowShelf.type = 'lowshelf';
            this.lowShelf.frequency.value = 140;
            this.lowShelf.gain.value = 3.0;

            // 3. Peaking presence filter (Độ trong & rõ nét khẩu hình)
            this.peakingPresence = this.ctx.createBiquadFilter();
            this.peakingPresence.type = 'peaking';
            this.peakingPresence.frequency.value = 2800;
            this.peakingPresence.Q.value = 1.2;
            this.peakingPresence.gain.value = 2.0;

            // 4. De-Esser filter (Triệt tiêu chói gắt phụ âm gió s/x/ch)
            this.deEsser = this.ctx.createBiquadFilter();
            this.deEsser.type = 'peaking';
            this.deEsser.frequency.value = 6800;
            this.deEsser.Q.value = 2.0;
            this.deEsser.gain.value = -1.8;

            // 5. High-shelf air filter (Mở rộng dải âm cao thoáng đãng)
            this.highShelfAir = this.ctx.createBiquadFilter();
            this.highShelfAir.type = 'highshelf';
            this.highShelfAir.frequency.value = 11000;
            this.highShelfAir.gain.value = 1.2;

            // 6. Psychoacoustic Harmonic Exciter (Kích thích hài âm tri giác 8kHz - 14kHz)
            this.exciterBandpass = this.ctx.createBiquadFilter();
            this.exciterBandpass.type = 'bandpass';
            this.exciterBandpass.frequency.value = 3200;
            this.exciterBandpass.Q.value = 1.0;

            this.exciterShaper = this.ctx.createWaveShaper();
            this.exciterShaper.curve = makeHarmonicExciterCurve();
            this.exciterShaper.oversample = '2x';

            this.exciterHighPass = this.ctx.createBiquadFilter();
            this.exciterHighPass.type = 'highpass';
            this.exciterHighPass.frequency.value = 6500;
            this.exciterHighPass.Q.value = 0.7;

            this.exciterGain = this.ctx.createGain();
            this.exciterGain.gain.value = 0.045; // Trộn hài âm vi mô (~4.5%), tạo lớp sheen óng ả

            // 7. Subtle Studio Ambience (Không gian Thiền phòng Đàm đạo vi mô)
            this.ambienceDelay = this.ctx.createDelay(0.1);
            this.ambienceDelay.delayTime.value = 0.020; // 20ms thuộc vùng hiệu ứng Haas (không gây tiếng vọng echo)

            this.ambienceFilter = this.ctx.createBiquadFilter();
            this.ambienceFilter.type = 'lowpass';
            this.ambienceFilter.frequency.value = 3200; // Tán xạ âm học tự nhiên của tường gỗ phòng trà

            this.ambienceGain = this.ctx.createGain();
            this.ambienceGain.gain.value = 0.035; // Âm vang vi mô 3.5% tạo độ sâu 3D

            // 8. Dynamics Compressor (Chuẩn phát thanh studio)
            this.compressor = this.ctx.createDynamicsCompressor();
            this.compressor.threshold.value = -20;
            this.compressor.knee.value = 12;
            this.compressor.ratio.value = 3.5;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.14;

            // 9. Master Gain node
            this.gainNode = this.ctx.createGain();
            this.gainNode.gain.value = 1.0;

            // Nối chuỗi âm thanh DSP đa tầng:
            // Tích hợp cả hai audio element A và B vào chuỗi mastering duy nhất
            this.source = this.ctx.createMediaElementSource(audioElementA);
            this.source.connect(this.highPass);

            if (audioElementB) {
                try {
                    this.sourceB = this.ctx.createMediaElementSource(audioElementB);
                    this.sourceB.connect(this.highPass);
                } catch (eB) {
                    console.warn("[TTS WebAudioMaster] sourceB notice:", eB.message);
                }
            }

            this.highPass.connect(this.lowShelf);
            this.lowShelf.connect(this.peakingPresence);
            this.peakingPresence.connect(this.deEsser);
            this.deEsser.connect(this.highShelfAir);

            // Nhánh 1: Tín hiệu chính (Core EQ) vào Compressor
            this.highShelfAir.connect(this.compressor);

            // Nhánh 2: Harmonic Exciter -> Compressor
            this.highShelfAir.connect(this.exciterBandpass);
            this.exciterBandpass.connect(this.exciterShaper);
            this.exciterShaper.connect(this.exciterHighPass);
            this.exciterHighPass.connect(this.exciterGain);
            this.exciterGain.connect(this.compressor);

            // Nhánh 3: Studio Ambience -> Compressor
            this.highShelfAir.connect(this.ambienceDelay);
            this.ambienceDelay.connect(this.ambienceFilter);
            this.ambienceFilter.connect(this.ambienceGain);
            this.ambienceGain.connect(this.compressor);

            // Đầu ra từ Compressor qua Master Gain tới Loa / Tai nghe
            this.compressor.connect(this.gainNode);
            this.gainNode.connect(this.ctx.destination);

            this.isInitialized = true;
        } catch (e) {
            console.warn("[TTS WebAudioMaster] Web Audio API init notice:", e.message);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    setGain(val) {
        if (this.gainNode) {
            this.gainNode.gain.value = Math.max(0, Math.min(1, val));
        }
    }
}

/**
 * Định dạng số giây sang dạng mm:ss
 */
export function formatAudioTime(seconds) {
    if (!seconds || !Number.isFinite(seconds) || isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * 5. Lớp điều khiển Audio Engine toàn cục theo từng Chương (Chapter-Level Audio)
 * - Toàn bộ một chương phát dưới dạng 1 file MP3 liên tục (0ms khoảng lặng kỹ thuật)
 * - Ngữ điệu liền mạch, truyền cảm tự nhiên chuẩn Podcast / VTV
 * - Tự động nạp trước Chương kế tiếp vào RAM Blob Cache
 * - Hỗ trợ thanh tua thời gian thực (Interactive Timeline Scrubber)
 * - Tích hợp Web Audio Mastering Chain (Studio EQ + Dynamics Compressor)
 */
class TtsAudioEngine {
    constructor() {
        this.isPlaying = false;
        this.isPaused = false;
        this.isLoading = false; // Đang tổng hợp / tải file âm thanh của chương
        this.currentSectionId = null;
        this.currentSectionTitle = "";
        this.currentExcerpt = "";
        this.currentTime = 0;
        this.duration = 0;
        this.rate = 1.0; // 1.0 | 1.25 | 1.5
        this.volume = 1.0; // 0.0 - 1.0
        this.isMuted = false;
        this.currentVoiceId = 'hoaimy';
        this.gender = 'female';
        this.playlist = [];
        this.currentPlaylistIndex = 0;
        this.isContinuousPlayAll = false; // Phân định: Nghe toàn bài (true) vs Nghe từng chương lẻ (false)
        this.estimatedDuration = 0; // Thời lượng ước tính chuẩn xác (được khóa cố định)
        this._isDurationFinal = false; // Đã nhận diện thời lượng thực tế cuối cùng
        this.listeners = new Set();

        // 100% CÀI ĐẶT GỐC CHO THẦY LUẬN (NATIVE WEB SPEECH API)
        this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
        this.pitch = 0.78; // Cao độ Thầy Luận (giảm thêm 5% từ 0.82 -> 0.78 tạo chất giọng trầm ấm, uy nghiêm)
        this.selectedVoice = null;
        this.keepAliveTimer = null;
        this.currentUtterance = null;
        this.sentences = [];
        this.currentIndex = 0;

        // DUAL-AUDIO GAPLESS ENGINE & STUDIO MASTERING CHO CÁC GIỌNG NEURAL STUDIO
        this._audioA = null;
        this._audioB = null;
        this._activeAudio = null;
        this._standbyAudio = null;
        this._standbyChapterIndex = -1;
        this._masterAudio = null; // Luôn trỏ tới _activeAudio để tương thích ngược 100%
        this.webAudio = new WebAudioMaster();

        // SESSION CONTROL & RAM CHAPTER BLOB CACHE
        this._sessionToken = 0;
        this._abortController = null;
        this._prefetchTimer = null;
        this._isTransitioning = false;
        this._ticketCache = new Map(); // key -> ticketData
        this._chapterBlobCache = new Map(); // key: `${voiceId}:${sectionId}` -> blobUrl
        this._fetchPromises = new Map(); // key -> Promise<blobUrl>

        this._initAudioElements();

        // Tự động tải danh sách giọng native của thiết bị
        if (this.synth) {
            this.synth.onvoiceschanged = () => {
                this._initVoice();
                this._notify();
            };
            this._initVoice();
        }
    }

    _cleanupCurrentSpeech() {
        if (this._prefetchTimer) {
            clearTimeout(this._prefetchTimer);
            this._prefetchTimer = null;
        }
        if (this._abortController) {
            try { this._abortController.abort(); } catch (e) {}
            this._abortController = null;
        }
        if (this._prefetchAbortController) {
            try { this._prefetchAbortController.abort(); } catch (e) {}
            this._prefetchAbortController = null;
        }
        if (this._activeAudio) {
            this._activeAudio.pause();
            this._activeAudio.removeAttribute('src');
            this._activeAudio.load();
        }
        if (this._standbyAudio) {
            this._standbyAudio.pause();
            this._standbyAudio.removeAttribute('src');
            this._standbyAudio.load();
        }
        this._standbyChapterIndex = -1;
        if (this.synth) {
            try { this.synth.cancel(); } catch (e) {}
        }
        this._stopKeepAlive();
        this.currentTime = 0;
        this.duration = 0;
    }

    _initVoice() {
        if (this.synth) {
            const { male, all } = getAvailableVietnameseVoices();
            this.selectedVoice = (male.length > 0) ? male[0] : (all.length > 0 ? all[0] : null);
        }
    }

    _startKeepAlive() {
        this._stopKeepAlive();
        this.keepAliveTimer = setInterval(() => {
            if (this.synth && this.isPlaying && !this.isPaused && this.currentVoiceId === 'thayluan') {
                this.synth.pause();
                this.synth.resume();
            }
        }, 10000);
    }

    _stopKeepAlive() {
        if (this.keepAliveTimer) {
            clearInterval(this.keepAliveTimer);
            this.keepAliveTimer = null;
        }
    }

    _speakWithWebSpeech(text) {
        if (!this.synth) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = this.rate;
        utterance.pitch = this.pitch || 0.78;
        utterance.volume = this.isMuted ? 0 : this.volume;

        if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
        } else {
            this._initVoice();
            if (this.selectedVoice) {
                utterance.voice = this.selectedVoice;
            }
        }

        utterance.onstart = () => {
            this._notify();
        };

        utterance.onend = () => {
            if (this.isPlaying && !this.isPaused && this.currentVoiceId === 'thayluan') {
                this.currentIndex++;
                this._speakCurrentSentence();
            }
        };

        utterance.onerror = (event) => {
            if (event.error === 'interrupted' || event.error === 'canceled') return;
            console.warn("[TTS Engine] Utterance Error:", event.error);
            if (this.isPlaying && !this.isPaused && this.currentVoiceId === 'thayluan') {
                this.currentIndex++;
                this._speakCurrentSentence();
            }
        };

        this.currentUtterance = utterance;
        this.synth.speak(utterance);
        this._notify();
    }

    _speakCurrentSentence() {
        if (!this.isPlaying || this.isPaused) return;

        if (this.currentIndex >= this.sentences.length) {
            // TỰ ĐỘNG CHUYỂN TIẾP SANG CHƯƠNG KẾ TIẾP TRONG PLAYLIST (CONTINUOUS AUTOPLAY)
            if (this.playlist && this.playlist.length > 0 && this.currentPlaylistIndex < this.playlist.length - 1) {
                this.skipNextSection();
                return;
            }
            this.stop();
            return;
        }

        const sentenceObj = this.sentences[this.currentIndex];
        if (!sentenceObj || !sentenceObj.text) {
            this.currentIndex++;
            this._speakCurrentSentence();
            return;
        }

        this.currentExcerpt = sentenceObj.text;
        this.currentTime = this.currentIndex;

        if (this.synth) {
            this.synth.cancel();
        }
        this._speakWithWebSpeech(sentenceObj.text);
    }

    _initAudioElements() {
        if (typeof window === 'undefined') return;
        if (!this._audioA) {
            this._audioA = new Audio();
            this._audioA.crossOrigin = 'anonymous';
            this._audioA.preload = 'auto';
            this._setupAudioListeners(this._audioA);
        }
        if (!this._audioB) {
            this._audioB = new Audio();
            this._audioB.crossOrigin = 'anonymous';
            this._audioB.preload = 'auto';
            this._setupAudioListeners(this._audioB);
        }
        this._activeAudio = this._audioA;
        this._standbyAudio = this._audioB;
        this._masterAudio = this._audioA;
    }

    _setupAudioListeners(audioEl) {
        audioEl.ontimeupdate = () => {
            if (audioEl === this._activeAudio && !this._isTransitioning) {
                this.currentTime = audioEl.currentTime || 0;
                const d = audioEl.duration;
                // Chỉ cập nhật duration khi audio báo độ dài thực tế tin cậy (không phải Infinity, và >= 85% estimate)
                if (Number.isFinite(d) && d >= this.estimatedDuration * 0.85) {
                    this.duration = d;
                    this._isDurationFinal = true;
                } else if (!this._isDurationFinal && this.estimatedDuration > 0) {
                    this.duration = this.estimatedDuration;
                }
                this._notify();
            }
        };

        audioEl.onloadedmetadata = () => {
            if (audioEl === this._activeAudio) {
                const d = audioEl.duration;
                if (Number.isFinite(d) && d >= this.estimatedDuration * 0.85) {
                    this.duration = d;
                    this._isDurationFinal = true;
                    this._notify();
                }
            }
        };

        audioEl.oncanplay = () => {
            if (audioEl === this._activeAudio && this.isPlaying) {
                this.isLoading = false;
                this._notify();
            }
        };

        audioEl.onplaying = () => {
            if (audioEl === this._activeAudio) {
                this.isPlaying = true;
                this.isPaused = false;
                this.isLoading = false;
                this._notify();
            }
        };

        audioEl.onplay = () => {
            if (audioEl === this._activeAudio) {
                this.isPlaying = true;
                this.isPaused = false;
                this.isLoading = false;
                this._notify();
            }
        };

        audioEl.onpause = () => {
            // Nếu đang transition (đổi bài / đổi giọng) hoặc audio kết thúc tự nhiên, không coi là user pause thủ công
            if (this._isTransitioning || audioEl.ended) return;
            if (audioEl === this._activeAudio && this.isPlaying) {
                this.isPaused = true;
                this._notify();
            }
        };

        audioEl.onended = () => {
            if (audioEl === this._activeAudio) {
                this._handleChapterEnded();
            }
        };

        audioEl.onerror = (e) => {
            if (audioEl === this._activeAudio) {
                this._handleAudioError(e);
            }
        };
    }

    _handleChapterEnded() {
        if (!this.isPlaying) return;
        this.isPaused = false; // Reset cờ pause khi chuyển sang chương kế tiếp

        // 1. NẾU LÀ CHẾ ĐỘ NGHE TOÀN BÀI: TỰ ĐỘNG CHUYỂN TIẾP SANG CHƯƠNG KẾ TIẾP (CONTINUOUS GAPLESS AUTOPLAY)
        if (this.isContinuousPlayAll && this.playlist && this.playlist.length > 0 && this.currentPlaylistIndex < this.playlist.length - 1) {
            const nextIdx = this.currentPlaylistIndex + 1;

            // KIỂM TRA XEM CHƯƠNG KẾ TIẾP ĐÃ CÓ SẴN TRONG STANDBY AUDIO CHƯA (0ms GAPLESS)
            if (this._standbyChapterIndex === nextIdx && this._standbyAudio && this._standbyAudio.src) {
                this._performSeamlessHandover(nextIdx);
                return;
            }

            this.skipNextSection();
            return;
        }

        // 2. NẾU LÀ CHẾ ĐỘ NGHE TỪNG CHƯƠNG LẺ: HẾT CHƯƠNG THÌ DỪNG HẲN!
        // Người dùng tự ấn next hoặc tự ấn vào nghe chương tiếp theo thì mới bắt đầu tải
        this.isPlaying = false;
        this.isPaused = true;
        this.isLoading = false;
        this.currentTime = 0;
        this._notify();
    }

    _performSeamlessHandover(nextIdx) {
        if (!this.playlist || nextIdx >= this.playlist.length) return;

        // 1. Hoán đổi Active Audio và Standby Audio
        const prevActive = this._activeAudio;
        this._activeAudio = this._standbyAudio;
        this._standbyAudio = prevActive;
        this._masterAudio = this._activeAudio;

        // 2. Cập nhật Metadata cho chương mới
        this.currentPlaylistIndex = nextIdx;
        const nextSec = this.playlist[nextIdx];
        this.currentSectionId = nextSec.id;
        this.currentSectionTitle = nextSec.title || "Luận Giải Mệnh Số";
        const cleanContent = cleanMarkdownForSpeech(nextSec.content || "");
        this.currentExcerpt = cleanContent.slice(0, 150) + (cleanContent.length > 150 ? '...' : '');
        this._currentRawContent = nextSec.content || "";
        this.currentTime = 0;

        // Tính thời lượng ước tính chuẩn xác cho chương mới và khóa cố định
        const charCount = cleanContent.length;
        const effectiveSpeed = 14.5 * (this.rate || 1.0);
        this.estimatedDuration = Math.max(5, Math.round(charCount / effectiveSpeed));
        this._isDurationFinal = false;

        const d = this._activeAudio.duration;
        if (Number.isFinite(d) && d >= this.estimatedDuration * 0.85) {
            this.duration = d;
            this._isDurationFinal = true;
        } else {
            this.duration = this.estimatedDuration;
        }

        this.isLoading = false;
        this.isPlaying = true;
        this.isPaused = false;

        // 3. Đặt âm lượng và tốc độ
        this._activeAudio.defaultPlaybackRate = this.rate;
        this._activeAudio.playbackRate = this.rate;
        this._activeAudio.volume = this.isMuted ? 0 : this.volume;
        this._activeAudio.currentTime = 0;

        // 4. Phát ngay lập tức trong 0.001ms (0ms gapless!)
        const p = this._activeAudio.play();
        if (p !== undefined) {
            p.catch(e => console.warn("[TTS Engine] Seamless play notice:", e.message));
        }

        this._notify();

        // 5. Chuẩn bị tiếp nạp trước Chương N+2 vào standby audio (chỉ khi đang nghe toàn bài, hoãn 3.5s tránh xung đột)
        this._standbyChapterIndex = -1;
        if (this._prefetchTimer) {
            clearTimeout(this._prefetchTimer);
        }
        if (this.isContinuousPlayAll) {
            this._prefetchTimer = setTimeout(() => {
                if (this.isContinuousPlayAll && this.isPlaying) {
                    this._prepareStandbyChapter(nextIdx + 1);
                }
            }, 3500);
        }
    }

    async _prepareStandbyChapter(targetIdx) {
        // Chỉ nạp trước khi ở chế độ Nghe Toàn Bài
        if (!this.isContinuousPlayAll || this.currentVoiceId === 'thayluan') {
            this._standbyChapterIndex = -1;
            return;
        }
        if (!this.playlist || targetIdx >= this.playlist.length) {
            this._standbyChapterIndex = -1;
            return;
        }

        const targetSec = this.playlist[targetIdx];
        if (!targetSec || !targetSec.content) return;

        const currentVoice = this.currentVoiceId;
        const cleanContent = cleanMarkdownForSpeech(targetSec.content);

        try {
            const ticket = await this._getStreamTicket(cleanContent, currentVoice, targetSec.id);

            // Kiểm tra trạng thái còn hợp lệ (chưa đổi giọng, chưa stop)
            if (this.currentVoiceId !== currentVoice || !this._standbyAudio) return;

            const apiBase = getApiBase();
            const fullStreamUrl = `${apiBase}/tts/stream/${ticket.ticketId}`;

            this._standbyAudio.src = fullStreamUrl;
            this._standbyAudio.load();
            this._standbyAudio.defaultPlaybackRate = this.rate;
            this._standbyAudio.playbackRate = this.rate;
            this._standbyAudio.volume = this.isMuted ? 0 : this.volume;
            this._standbyChapterIndex = targetIdx;
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.warn("[TTS Engine] Standby preload notice:", err.message);
            }
        }
    }

    _prefetchToCache(targetIdx) {
        if (this.currentVoiceId === 'thayluan') return;
        if (!this.playlist || targetIdx >= this.playlist.length) return;
        const targetSec = this.playlist[targetIdx];
        if (!targetSec || !targetSec.content) return;
        const clean = cleanMarkdownForSpeech(targetSec.content);
        this._getStreamTicket(clean, this.currentVoiceId, targetSec.id).catch(() => {});
    }

    warmupFirstChapter(sections) {
        if (!sections || !Array.isArray(sections) || sections.length === 0) return;
        if (this.isPlaying || this.isLoading) return;
        if (this.currentVoiceId === 'thayluan') return;
        const first = sections[0];
        if (!first || !first.content) return;
        const clean = cleanMarkdownForSpeech(first.content);
        this._getStreamTicket(clean, this.currentVoiceId, first.id).then(ticket => {
            if (!this.isPlaying && this._activeAudio && !this._activeAudio.src) {
                const apiBase = getApiBase();
                this._activeAudio.src = `${apiBase}/tts/stream/${ticket.ticketId}`;
                this._activeAudio.load();
            }
        }).catch(() => {});
    }

    _handleAudioError(e) {
        if (!this.isPlaying || this.isPaused) return;
        if (!this._activeAudio || !this._activeAudio.src || this._activeAudio.src === window.location.href) {
            return;
        }
        console.warn("[TTS Engine] Chapter audio playback notice:", e);
        this.isLoading = false;
        this._notify();
    }

    subscribe(listener) {
        this.listeners.add(listener);
        listener(this.getState());
        return () => this.listeners.delete(listener);
    }

    _notify() {
        const state = this.getState();
        this.listeners.forEach(fn => {
            try { fn(state); } catch (e) { console.error("TTS Listener Error:", e); }
        });
    }

    getValidDuration() {
        if (Number.isFinite(this.duration) && this.duration > 0) {
            return this.duration;
        }
        if (this.estimatedDuration > 0) {
            return this.estimatedDuration;
        }
        const textLen = (this._currentRawContent || "").length;
        return textLen > 0 ? Math.max(5, Math.round(textLen / 14)) : 30;
    }

    getState() {
        const voiceObj = VOICES.find(v => v.id === this.currentVoiceId) || VOICES[0];
        const isThayLuan = this.currentVoiceId === 'thayluan';

        const validDuration = this.getValidDuration();

        const progressPercent = isThayLuan
            ? (this.sentences.length > 0 ? Math.round(((this.currentIndex + 1) / this.sentences.length) * 100) : 0)
            : (validDuration > 0 ? Math.min(100, Math.max(0, Math.round((this.currentTime / validDuration) * 100))) : 0);

        const formattedCurrentTime = isThayLuan
            ? `Câu ${this.sentences.length > 0 ? this.currentIndex + 1 : 0}`
            : formatAudioTime(this.currentTime);

        const formattedDuration = isThayLuan
            ? `${this.sentences.length} câu`
            : (validDuration > 0 ? formatAudioTime(validDuration) : "--:--");

        return {
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            isLoading: this.isLoading,
            currentSectionId: this.currentSectionId,
            currentSectionTitle: this.currentSectionTitle,
            currentSentence: isThayLuan ? (this.sentences[this.currentIndex]?.text || this.currentExcerpt) : this.currentExcerpt,
            currentExcerpt: isThayLuan ? (this.sentences[this.currentIndex]?.text || this.currentExcerpt) : this.currentExcerpt,
            currentTime: isThayLuan ? this.currentIndex : this.currentTime,
            duration: isThayLuan ? this.sentences.length : validDuration,
            formattedCurrentTime,
            formattedDuration,
            progressPercent,
            rate: this.rate,
            pitch: this.pitch,
            currentVoiceId: this.currentVoiceId,
            currentVoice: voiceObj,
            gender: this.gender,
            volume: this.volume,
            isMuted: this.isMuted,
            selectedVoice: this.selectedVoice,
            playlistLength: this.playlist ? this.playlist.length : 0,
            playlistIndex: this.currentPlaylistIndex,
            hasNextSection: this.playlist && this.currentPlaylistIndex < this.playlist.length - 1,
            hasPrevSection: this.playlist && this.currentPlaylistIndex > 0,
            currentIndex: isThayLuan ? this.currentIndex : this.currentPlaylistIndex,
            totalSentences: isThayLuan ? this.sentences.length : (this.playlist ? this.playlist.length : 1)
        };
    }

    setPlaylist(sections, currentIndex = 0) {
        if (!Array.isArray(sections) || sections.length === 0) return;
        this.playlist = sections;
        this.currentPlaylistIndex = Math.max(0, Math.min(currentIndex, sections.length - 1));
    }

    playAll(sections) {
        if (!sections || !Array.isArray(sections) || sections.length === 0) return;
        this.playlist = sections;
        this.currentPlaylistIndex = 0;
        this.isContinuousPlayAll = true;
        const first = sections[0];
        this.playChapter({
            sectionId: first.id,
            sectionTitle: first.title,
            content: first.content,
            playlist: sections,
            playlistIndex: 0,
            isContinuous: true
        });
    }

    play(content, options = {}) {
        return this.playChapter({
            content,
            sectionId: options.sectionId,
            sectionTitle: options.title || options.sectionTitle,
            playlist: options.playlist || null,
            playlistIndex: options.playlistIndex ?? -1,
            isContinuous: options.isContinuous ?? false
        });
    }

    playSection(options = {}) {
        return this.playChapter(options);
    }

    async playChapter({ sectionId, sectionTitle, content, playlist = null, playlistIndex = -1, startTime = 0, isContinuous = false }) {
        const currentToken = ++this._sessionToken;
        this._isTransitioning = true;
        this._cleanupCurrentSpeech();
        this._abortController = new AbortController();

        if (typeof isContinuous === 'boolean') {
            this.isContinuousPlayAll = isContinuous;
        }

        // Nếu là chế độ nghe từng chương lẻ: hủy nạp trước và giải phóng standby audio
        if (!this.isContinuousPlayAll) {
            this._standbyChapterIndex = -1;
            if (this._prefetchTimer) {
                clearTimeout(this._prefetchTimer);
                this._prefetchTimer = null;
            }
            if (this._standbyAudio) {
                this._standbyAudio.removeAttribute('src');
                this._standbyAudio.load();
            }
        }

        if (playlist && Array.isArray(playlist)) {
            this.playlist = playlist;
        }

        if (playlistIndex >= 0) {
            this.currentPlaylistIndex = playlistIndex;
        } else if (this.playlist && this.playlist.length > 0) {
            const foundIdx = this.playlist.findIndex(s => s.id === sectionId);
            if (foundIdx !== -1) {
                this.currentPlaylistIndex = foundIdx;
            }
        }

        this.currentSectionId = sectionId;
        this.currentSectionTitle = sectionTitle || "Luận Giải Mệnh Số";
        this._currentRawContent = content || "";
        const cleanContent = cleanMarkdownForSpeech(content || "");
        this.currentExcerpt = cleanContent.slice(0, 150) + (cleanContent.length > 150 ? '...' : '');

        // 1. NẾU LÀ GIỌNG THẦY LUẬN: SỬ DỤNG 100% WEB SPEECH API NATIVE CỦA THIẾT BỊ
        if (this.currentVoiceId === 'thayluan') {
            this.sentences = splitIntoSpeechSentences(cleanContent);
            if (this.sentences.length === 0) {
                this.isPlaying = false;
                this.isLoading = false;
                this._notify();
                return;
            }
            this.currentIndex = 0;
            this.currentTime = 0;
            this.duration = this.sentences.length;
            this.currentExcerpt = this.sentences[0].text;
            this.isPlaying = true;
            this.isPaused = false;
            this.isLoading = false;
            this._isTransitioning = false;
            this._startKeepAlive();
            this._speakCurrentSentence();
            this._notify();
            return;
        }

        // 2. CÁC GIỌNG NEURAL STUDIO: STREAM TRỰC TIẾP QUA TICKET VÀ DUAL AUDIO ELEMENT
        // Tính thời lượng ước lượng chuẩn xác và khóa cố định (Anchor) ngay từ giây đầu tiên
        const charCount = cleanContent.length;
        const effectiveSpeed = 14.5 * (this.rate || 1.0);
        this.estimatedDuration = Math.max(5, Math.round(charCount / effectiveSpeed));
        this.duration = this.estimatedDuration;
        this._isDurationFinal = false;

        this.currentTime = startTime;
        this.isPlaying = true;
        this.isPaused = false;
        this.isLoading = true;
        this._notify();

        // Khởi động Web Audio Mastering Chain cho cả Audio A và Audio B
        if (this._audioA) {
            this.webAudio.init(this._audioA, this._audioB);
            this.webAudio.resume();
        }

        try {
            const ticket = await this._getStreamTicket(cleanContent, this.currentVoiceId, sectionId);

            if (currentToken !== this._sessionToken || !this.isPlaying) {
                this._isTransitioning = false;
                return;
            }

            const apiBase = getApiBase();
            const fullStreamUrl = `${apiBase}/tts/stream/${ticket.ticketId}`;

            // Nếu stream đã có sẵn trong cache RAM của máy chủ: tắt loading ngay
            if (ticket.isCached) {
                this.isLoading = false;
            }

            this._activeAudio.src = fullStreamUrl;
            this._activeAudio.defaultPlaybackRate = this.rate;
            this._activeAudio.playbackRate = this.rate;
            this._activeAudio.volume = this.isMuted ? 0 : this.volume;
            this.webAudio.setGain(this.isMuted ? 0 : this.volume);

            if (startTime > 0) {
                this._activeAudio.currentTime = startTime;
            } else {
                this._activeAudio.currentTime = 0;
            }

            this._isTransitioning = false;

            const playPromise = this._activeAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    if (currentToken !== this._sessionToken) return;
                    console.warn("[TTS Engine] Audio play notice:", err.message);
                });
            }

            this._notify();

            // NẠP TRƯỚC CHƯƠNG KẾ TIẾP VÀO STANDBY AUDIO (Chỉ trong chế độ Nghe Toàn Bài, hoãn 3.5s tránh nghẽn WebSocket)
            if (this._prefetchTimer) {
                clearTimeout(this._prefetchTimer);
            }
            if (this.isContinuousPlayAll) {
                this._prefetchTimer = setTimeout(() => {
                    if (this.isContinuousPlayAll && this.isPlaying) {
                        this._prepareStandbyChapter(this.currentPlaylistIndex + 1);
                    }
                }, 3500);
            }
        } catch (err) {
            this._isTransitioning = false;
            if (currentToken !== this._sessionToken) return;
            this.isLoading = false;
            if (err.name === 'AbortError') {
                this._notify();
                return;
            }
            console.warn("[TTS Engine] Chapter playback notice:", err.message);
            this._notify();
        }
    }

    async _getStreamTicket(content, voiceId, sectionId) {
        const cacheKey = `${voiceId}:${sectionId || ''}:${content.slice(0, 40)}`;
        if (this._ticketCache.has(cacheKey)) {
            return this._ticketCache.get(cacheKey);
        }

        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/tts/ticket`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, voice: voiceId, sectionId }),
            signal: this._abortController?.signal || null
        });

        if (!res.ok) {
            throw new Error(`TTS Ticket API error ${res.status}`);
        }

        const data = await res.json();
        if (this._ticketCache.size > 100) {
            const firstK = this._ticketCache.keys().next().value;
            this._ticketCache.delete(firstK);
        }
        this._ticketCache.set(cacheKey, data);
        return data;
    }

    async _fetchChapterAudioBlob(content, voiceId, sectionId, signal = null) {
        const ticket = await this._getStreamTicket(content, voiceId, sectionId);
        const apiBase = getApiBase();
        return `${apiBase}/tts/stream/${ticket.ticketId}`;
    }

    seekTime(targetSeconds) {
        if (this.currentVoiceId === 'thayluan') {
            if (this.sentences.length > 0) {
                const targetIdx = Math.max(0, Math.min(Math.round(targetSeconds), this.sentences.length - 1));
                this.seekSentence(targetIdx);
            }
            return;
        }
        if (!this._activeAudio) return;
        const validDuration = this.getValidDuration();
        const validTime = Math.max(0, Math.min(targetSeconds, validDuration));
        try {
            this._activeAudio.currentTime = validTime;
            this.currentTime = validTime;
        } catch (e) {
            console.warn("[TTS Engine] Seek notice:", e.message);
        }
        this._notify();
    }

    seekPercent(percent) {
        const clampedPct = Math.max(0, Math.min(100, percent));
        if (this.currentVoiceId === 'thayluan') {
            if (this.sentences.length > 0) {
                const targetIdx = Math.round((clampedPct / 100) * (this.sentences.length - 1));
                this.seekSentence(targetIdx);
            }
            return;
        }
        const validDuration = this.getValidDuration();
        if (validDuration > 0) {
            this.seekTime((clampedPct / 100) * validDuration);
        }
    }

    seekSentence(index) {
        if (this.currentVoiceId === 'thayluan') {
            if (index < 0 || index >= this.sentences.length) return;
            this.currentIndex = index;
            if (this.synth) this.synth.cancel();
            if (this.isPlaying && !this.isPaused) {
                this._speakCurrentSentence();
            } else {
                this._notify();
            }
            return;
        }
        const validDuration = this.getValidDuration();
        if (validDuration > 0 && this.playlist && this.playlist.length > 0) {
            const pct = Math.min(1, index / this.playlist.length);
            this.seekTime(pct * validDuration);
        }
    }

    skipForward(seconds = 10) {
        if (this.currentVoiceId === 'thayluan') {
            if (this.currentIndex < this.sentences.length - 1) {
                this.seekSentence(this.currentIndex + 1);
            } else if (this.playlist && this.currentPlaylistIndex < this.playlist.length - 1) {
                this.skipNextSection();
            }
            return;
        }
        const validDuration = this.getValidDuration();
        if (validDuration > 0 && this.currentTime + seconds >= validDuration && this.playlist && this.currentPlaylistIndex < this.playlist.length - 1) {
            this.skipNextSection();
        } else {
            this.seekTime(this.currentTime + seconds);
        }
    }

    skipBackward(seconds = 10) {
        if (this.currentVoiceId === 'thayluan') {
            if (this.currentIndex > 0) {
                this.seekSentence(this.currentIndex - 1);
            } else if (this.playlist && this.currentPlaylistIndex > 0) {
                this.skipPrevSection();
            }
            return;
        }
        if (this.currentTime <= 2 && this.playlist && this.currentPlaylistIndex > 0) {
            this.skipPrevSection();
        } else {
            this.seekTime(Math.max(0, this.currentTime - seconds));
        }
    }

    skipNextSection() {
        if (this.playlist && this.currentPlaylistIndex < this.playlist.length - 1) {
            const nextIdx = this.currentPlaylistIndex + 1;
            if (this._standbyChapterIndex === nextIdx && this._standbyAudio && this._standbyAudio.src) {
                this._performSeamlessHandover(nextIdx);
                return;
            }

            this.currentPlaylistIndex = nextIdx;
            const nextSec = this.playlist[this.currentPlaylistIndex];
            if (nextSec && nextSec.content) {
                this.playChapter({
                    sectionId: nextSec.id,
                    sectionTitle: nextSec.title,
                    content: nextSec.content,
                    playlistIndex: this.currentPlaylistIndex,
                    startTime: 0,
                    isContinuous: this.isContinuousPlayAll
                });
            }
        }
    }

    skipPrevSection() {
        if (this.playlist && this.currentPlaylistIndex > 0) {
            this.currentPlaylistIndex--;
            const prevSec = this.playlist[this.currentPlaylistIndex];
            if (prevSec && prevSec.content) {
                this.playChapter({
                    sectionId: prevSec.id,
                    sectionTitle: prevSec.title,
                    content: prevSec.content,
                    playlistIndex: this.currentPlaylistIndex,
                    startTime: 0,
                    isContinuous: this.isContinuousPlayAll
                });
            }
        } else {
            this.seekTime(0);
        }
    }

    pause() {
        if (!this.isPlaying || this.isPaused) return;
        this.isPaused = true;
        if (this._activeAudio) {
            this._activeAudio.pause();
        }
        if (this.synth) {
            this.synth.pause();
        }
        this._stopKeepAlive();
        this._notify();
    }

    resume() {
        if (!this.isPlaying || !this.isPaused) return;
        this.isPaused = false;
        if (this.currentVoiceId === 'thayluan') {
            if (this.synth) {
                this.synth.resume();
            }
            this._startKeepAlive();
        } else {
            if (this._activeAudio && this._activeAudio.src) {
                this.webAudio.resume();
                this._activeAudio.play().catch(e => console.warn(e));
            }
        }
        this._notify();
    }

    togglePlayPause() {
        if (!this.isPlaying) {
            // Nếu đang dừng (ví dụ sau khi nghe hết 1 chương lẻ): phát lại từ đầu
            if (this.currentSectionId && this._currentRawContent) {
                this.playChapter({
                    sectionId: this.currentSectionId,
                    sectionTitle: this.currentSectionTitle,
                    content: this._currentRawContent,
                    playlist: this.playlist,
                    playlistIndex: this.currentPlaylistIndex,
                    isContinuous: this.isContinuousPlayAll
                });
                return;
            }
            return;
        }
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    stop(notify = true) {
        this._sessionToken++;
        this._cleanupCurrentSpeech();
        this._stopKeepAlive();
        if (this._prefetchTimer) {
            clearTimeout(this._prefetchTimer);
            this._prefetchTimer = null;
        }
        if (this._activeAudio) {
            try {
                this._activeAudio.pause();
                this._activeAudio.removeAttribute('src');
                this._activeAudio.load();
            } catch (e) {}
        }
        if (this._standbyAudio) {
            try {
                this._standbyAudio.pause();
                this._standbyAudio.removeAttribute('src');
                this._standbyAudio.load();
            } catch (e) {}
        }
        this._standbyChapterIndex = -1;
        this.isPlaying = false;
        this.isPaused = false;
        this.isLoading = false;
        this.currentSectionId = null;
        this.currentSectionTitle = "";
        this.currentExcerpt = "";
        this.sentences = [];
        this.currentIndex = 0;
        this.currentUtterance = null;
        this.currentTime = 0;
        this.duration = 0;
        if (notify) {
            this._notify();
        }
    }

    setRate(newRate) {
        this.rate = Number(newRate);
        if (this._activeAudio) {
            this._activeAudio.defaultPlaybackRate = this.rate;
            this._activeAudio.playbackRate = this.rate;
        }
        if (this._standbyAudio) {
            this._standbyAudio.defaultPlaybackRate = this.rate;
            this._standbyAudio.playbackRate = this.rate;
        }
        if (this.isPlaying && !this.isPaused && this.synth && this.currentVoiceId === 'thayluan') {
            this.synth.cancel();
            setTimeout(() => {
                if (this.isPlaying && !this.isPaused && this.currentVoiceId === 'thayluan') {
                    this._speakCurrentSentence();
                }
            }, 60);
        }
        this._notify();
    }

    setVolume(newVol) {
        this.volume = Math.max(0, Math.min(1, Number(newVol)));
        this.isMuted = this.volume === 0;
        if (this._activeAudio) {
            this._activeAudio.volume = this.isMuted ? 0 : this.volume;
        }
        if (this._standbyAudio) {
            this._standbyAudio.volume = this.isMuted ? 0 : this.volume;
        }
        this.webAudio.setGain(this.isMuted ? 0 : this.volume);
        if (this.isPlaying && !this.isPaused && this.synth && this.currentVoiceId === 'thayluan') {
            this.synth.cancel();
            setTimeout(() => {
                if (this.isPlaying && !this.isPaused && this.currentVoiceId === 'thayluan') {
                    this._speakCurrentSentence();
                }
            }, 60);
        }
        this._notify();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this._activeAudio) {
            this._activeAudio.volume = this.isMuted ? 0 : this.volume;
        }
        if (this._standbyAudio) {
            this._standbyAudio.volume = this.isMuted ? 0 : this.volume;
        }
        this.webAudio.setGain(this.isMuted ? 0 : this.volume);
        if (this.isPlaying && !this.isPaused && this.synth && this.currentVoiceId === 'thayluan') {
            this.synth.cancel();
            setTimeout(() => {
                if (this.isPlaying && !this.isPaused && this.currentVoiceId === 'thayluan') {
                    this._speakCurrentSentence();
                }
            }, 60);
        }
        this._notify();
    }

    setVoiceId(voiceId) {
        if (!VOICES.some(v => v.id === voiceId)) return;
        if (this.currentVoiceId === voiceId) return;

        this.currentVoiceId = voiceId;
        const voiceObj = VOICES.find(v => v.id === voiceId);
        if (voiceObj) {
            this.gender = voiceObj.gender;
        }
        if (voiceId === 'thayluan') {
            this.pitch = 0.78;
            this._initVoice();
        }

        // Yêu cầu của người dùng: Chuyển giọng đọc là đọc lại từ đầu chương (startTime: 0)
        if (this.isPlaying || this.isLoading) {
            const currentSec = this.playlist?.[this.currentPlaylistIndex];
            const contentToPlay = currentSec?.content || this._currentRawContent;
            if (contentToPlay) {
                this.playChapter({
                    sectionId: currentSec?.id || this.currentSectionId,
                    sectionTitle: currentSec?.title || this.currentSectionTitle,
                    content: contentToPlay,
                    playlistIndex: this.currentPlaylistIndex,
                    startTime: 0
                });
            }
        }
        this._notify();
    }

    setVoice(voice) {
        this.selectedVoice = voice;
        if (this.isPlaying && !this.isPaused && this.currentVoiceId === 'thayluan') {
            if (this.synth) this.synth.cancel();
            this._speakCurrentSentence();
        }
        this._notify();
    }

    setGender(gender, shouldRestart = true) {
        this.gender = gender === 'male' ? 'male' : 'female';
        const targetVoice = VOICES.find(v => v.gender === this.gender) || VOICES[0];
        this.setVoiceId(targetVoice.id);
    }

    toggleGender() {
        const nextGender = this.gender === 'female' ? 'male' : 'female';
        this.setGender(nextGender);
        return nextGender;
    }

    setPitch(newPitch) {
        this.pitch = newPitch;
        if (this.isPlaying && !this.isPaused && this.synth && this.currentVoiceId === 'thayluan') {
            if (this.synth) this.synth.cancel();
            this._speakCurrentSentence();
        }
    }
}

// Khởi tạo thực thể Singleton dùng chung toàn bộ ứng dụng (bảo toàn qua các chu kỳ Vite HMR)
if (typeof window !== 'undefined' && !window.__ttsEngine) {
    window.__ttsEngine = new TtsAudioEngine();
}
export const ttsEngine = (typeof window !== 'undefined' && window.__ttsEngine) ? window.__ttsEngine : new TtsAudioEngine();

