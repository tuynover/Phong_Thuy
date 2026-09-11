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

    // 1.4 Loại bỏ các ký tự định dạng Markdown còn lại
    text = text
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
        .replace(/["“”«»]/g, ' ');

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
];

/**
 * 4. Lớp điều khiển Audio Engine toàn cục (Singleton Pattern)
 */
class TtsAudioEngine {
    constructor() {
        this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
        this.currentAudio = null;
        this.isPlaying = false;
        this.isPaused = false;
        this.currentSectionId = null;
        this.currentSectionTitle = "";
        this.sentences = [];
        this.currentIndex = 0;
        this.rate = 1.0; // 1.0 | 1.25 | 1.5
        this.volume = 1.0; // 0.0 - 1.0
        this.isMuted = false;
        this.currentVoiceId = 'hoaimy';
        this.gender = 'female';
        this.pitch = 1.15;
        this.selectedVoice = null;
        this.listeners = new Set();
        this.keepAliveTimer = null;
        this.currentUtterance = null;
        this.playlist = [];
        this.currentPlaylistIndex = 0;
        this.preloadedAudios = new Map();

        // Tự động tải danh sách giọng khi trình duyệt sẵn sàng
        if (this.synth) {
            this.synth.onvoiceschanged = () => {
                this._initVoice();
                this._notify();
            };
            this._initVoice();
        }
    }

    _initVoice() {
        if (this.synth) {
            this.setGender(this.gender || 'female', false);
        }
    }

    subscribe(listener) {
        this.listeners.add(listener);
        // Báo cáo trạng thái ban đầu ngay khi đăng ký
        listener(this.getState());
        return () => this.listeners.delete(listener);
    }

    _notify() {
        const state = this.getState();
        this.listeners.forEach(fn => {
            try { fn(state); } catch (e) { console.error("TTS Listener Error:", e); }
        });
    }

    getState() {
        const currentObj = this.sentences[this.currentIndex];
        const voiceObj = VOICES.find(v => v.id === this.currentVoiceId) || VOICES[0];
        return {
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            currentSectionId: this.currentSectionId,
            currentSectionTitle: this.currentSectionTitle,
            currentIndex: this.currentIndex,
            totalSentences: this.sentences.length,
            currentSentence: currentObj ? currentObj.text : null,
            rate: this.rate,
            pitch: this.pitch,
            gender: this.gender,
            currentVoiceId: this.currentVoiceId,
            currentVoice: voiceObj,
            volume: this.volume,
            isMuted: this.isMuted,
            selectedVoice: this.selectedVoice,
            playlistLength: this.playlist ? this.playlist.length : 0,
            playlistIndex: this.currentPlaylistIndex,
            hasNextSection: this.playlist && this.currentPlaylistIndex < this.playlist.length - 1,
            hasPrevSection: this.playlist && this.currentPlaylistIndex > 0,
            progressPercent: this.sentences.length > 0 
                ? Math.round(((this.currentIndex) / this.sentences.length) * 100) 
                : 0
        };
    }

    /**
     * Cài đặt danh sách bài/mục luận giải (Playlist)
     */
    setPlaylist(sections, currentIndex = 0) {
        if (!Array.isArray(sections) || sections.length === 0) return;
        this.playlist = sections;
        this.currentPlaylistIndex = Math.max(0, Math.min(currentIndex, sections.length - 1));
    }

    /**
     * Bắt đầu nghe toàn bộ bài luận giải từ mục đầu tiên đến cuối cùng
     */
    playAll(sections) {
        if (!sections || !Array.isArray(sections) || sections.length === 0) return;
        this.playlist = sections;
        this.currentPlaylistIndex = 0;
        const first = sections[0];
        this.playSection({
            sectionId: first.id,
            sectionTitle: first.title,
            content: first.content,
            startIndex: 0,
            playlist: sections,
            playlistIndex: 0
        });
    }

    /**
     * Phương thức tiện ích gọi playSection
     */
    play(content, options = {}) {
        return this.playSection({
            content,
            sectionId: options.sectionId,
            sectionTitle: options.title || options.sectionTitle,
            startIndex: options.startIndex || 0,
            playlist: options.playlist || null,
            playlistIndex: options.playlistIndex ?? -1
        });
    }

    /**
     * Bắt đầu đọc một Cụm/Chương cụ thể
     */
    playSection({ sectionId, sectionTitle, content, startIndex = 0, playlist = null, playlistIndex = -1 }) {
        // Dừng tiến trình cũ nếu đang phát
        this.stop(false);

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

        const cleanedText = cleanMarkdownForSpeech(content);
        const sentences = splitIntoSpeechSentences(cleanedText);

        if (sentences.length === 0) return;

        this.currentSectionId = sectionId;
        this.currentSectionTitle = sectionTitle || "Luận Giải Mệnh Số";
        this.sentences = sentences;
        this.currentIndex = Math.max(0, Math.min(startIndex, sentences.length - 1));
        this.isPlaying = true;
        this.isPaused = false;
        this.preloadedAudios.clear();

        this._startKeepAlive();
        this._speakCurrentSentence();
        this._notify();
    }

    _speakCurrentSentence() {
        if (!this.isPlaying || this.isPaused) return;

        if (this.currentIndex >= this.sentences.length) {
            // TỰ ĐỘNG CHUYỂN TIẾP SANG MỤC TIẾP THEO TRONG PLAYLIST (CONTINUOUS AUTOPLAY)
            if (this.playlist && this.playlist.length > 0 && this.currentPlaylistIndex < this.playlist.length - 1) {
                this.currentPlaylistIndex++;
                const nextSec = this.playlist[this.currentPlaylistIndex];
                if (nextSec && nextSec.content) {
                    this.playSection({
                        sectionId: nextSec.id,
                        sectionTitle: nextSec.title,
                        content: nextSec.content,
                        startIndex: 0,
                        playlistIndex: this.currentPlaylistIndex
                    });
                    return;
                }
            }
            // Hoàn thành toàn bộ các mục trong bài luận
            this.stop();
            return;
        }

        const sentenceObj = this.sentences[this.currentIndex];
        if (!sentenceObj || !sentenceObj.text) {
            this.currentIndex++;
            this._speakCurrentSentence();
            return;
        }

        this._cleanupCurrentSpeech();

        // 1. Chế độ Giọng Bản Địa Thiết Bị (Thầy Luận): Dùng Native Web Speech API 0ms
        if (this.currentVoiceId === 'thayluan') {
            this._speakWithWebSpeech(sentenceObj.text);
            return;
        }

        // 2. Chế độ Giọng Neural & Google AI (Hoài My, Nam Minh, Ngọc Mai): Dùng HTML5 Audio qua /api/tts
        try {
            const apiBase = getApiBase();
            const audioUrl = `${apiBase}/tts?text=${encodeURIComponent(sentenceObj.text)}&voice=${this.currentVoiceId}&lang=vi`;

            let audio = null;
            if (this.preloadedAudios.has(this.currentIndex)) {
                audio = this.preloadedAudios.get(this.currentIndex);
                this.preloadedAudios.delete(this.currentIndex);
            } else {
                audio = new Audio(audioUrl);
            }

            audio.defaultPlaybackRate = this.rate;
            audio.playbackRate = this.rate;
            audio.volume = this.isMuted ? 0 : this.volume;

            audio.onloadedmetadata = () => {
                audio.defaultPlaybackRate = this.rate;
                audio.playbackRate = this.rate;
            };

            audio.onended = () => {
                if (this.isPlaying && !this.isPaused) {
                    this.currentIndex++;
                    this._speakCurrentSentence();
                }
            };

            audio.onerror = (e) => {
                console.warn("[TTS Engine] Audio error, fallback to Web Speech:", e);
                this._speakWithWebSpeech(sentenceObj.text);
            };

            this.currentAudio = audio;
            audio.play().catch(err => {
                console.warn("[TTS Engine] Audio play error, fallback:", err);
                this._speakWithWebSpeech(sentenceObj.text);
            });

            // NẠP TRƯỚC (PREFETCH) CÂU TIẾP THEO ĐỂ TRIỆT TIÊU ĐỘ TRỄ (0ms Latency)
            this._prefetchNextSentence();

            this._notify();
            return;
        } catch (err) {
            console.error("[TTS Engine] TTS init error:", err);
            this._speakWithWebSpeech(sentenceObj.text);
            return;
        }
    }

    /**
     * Nạp trước câu tiếp theo vào bộ nhớ đệm trình duyệt
     */
    _prefetchNextSentence() {
        if (this.currentVoiceId === 'thayluan') return;
        const nextIdx = this.currentIndex + 1;
        if (nextIdx < this.sentences.length) {
            const nextSentence = this.sentences[nextIdx];
            if (nextSentence && nextSentence.text && !this.preloadedAudios.has(nextIdx)) {
                const apiBase = getApiBase();
                const url = `${apiBase}/tts?text=${encodeURIComponent(nextSentence.text)}&voice=${this.currentVoiceId}&lang=vi`;
                const preAudio = new Audio();
                preAudio.preload = 'auto';
                preAudio.src = url;
                if (this.preloadedAudios.size > 5) {
                    const firstKey = this.preloadedAudios.keys().next().value;
                    this.preloadedAudios.delete(firstKey);
                }
                this.preloadedAudios.set(nextIdx, preAudio);
            }
        }
    }

    _speakWithWebSpeech(text) {
        if (!this.synth) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = this.rate;
        utterance.pitch = this.gender === 'female' ? 1.2 : 0.82;
        utterance.volume = this.isMuted ? 0 : this.volume;

        if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
        }

        utterance.onstart = () => {
            this._notify();
        };

        utterance.onend = () => {
            if (this.isPlaying && !this.isPaused) {
                this.currentIndex++;
                this._speakCurrentSentence();
            }
        };

        utterance.onerror = (event) => {
            if (event.error === 'interrupted' || event.error === 'canceled') return;
            console.warn("[TTS Engine] Utterance Error:", event.error);
            if (this.isPlaying && !this.isPaused) {
                this.currentIndex++;
                this._speakCurrentSentence();
            }
        };

        this.currentUtterance = utterance;
        this.synth.speak(utterance);
        this._notify();
    }

    _cleanupCurrentSpeech() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.onended = null;
            this.currentAudio.onerror = null;
            this.currentAudio.src = '';
            this.currentAudio = null;
        }
        if (this.synth) {
            this.synth.cancel();
        }
    }

    /**
     * Khắc phục lỗi Chromium Silent Freeze sau 15 giây
     */
    _startKeepAlive() {
        this._stopKeepAlive();
        this.keepAliveTimer = setInterval(() => {
            if (this.synth && this.isPlaying && !this.isPaused && this.gender === 'male') {
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

    pause() {
        if (!this.isPlaying || this.isPaused) return;
        this.isPaused = true;
        if (this.currentAudio) {
            this.currentAudio.pause();
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
        if (this.currentAudio) {
            this.currentAudio.play().catch(e => console.warn(e));
        }
        if (this.synth) {
            this.synth.resume();
        }
        this._startKeepAlive();
        this._notify();
    }

    togglePlayPause() {
        if (!this.isPlaying) return;
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    stop(notify = true) {
        this._cleanupCurrentSpeech();
        this._stopKeepAlive();
        this.isPlaying = false;
        this.isPaused = false;
        this.currentSectionId = null;
        this.currentSectionTitle = "";
        this.sentences = [];
        this.currentIndex = 0;
        this.currentUtterance = null;
        if (notify) {
            this._notify();
        }
    }

    setRate(newRate) {
        this.rate = Number(newRate);
        if (this.currentAudio) {
            this.currentAudio.defaultPlaybackRate = this.rate;
            this.currentAudio.playbackRate = this.rate;
        }
        if (this.isPlaying && !this.isPaused && this.synth && this.gender === 'male') {
            this.synth.cancel();
            setTimeout(() => {
                if (this.isPlaying && !this.isPaused) {
                    this._speakCurrentSentence();
                }
            }, 60);
        }
        this._notify();
    }

    setVolume(newVol) {
        this.volume = Math.max(0, Math.min(1, Number(newVol)));
        this.isMuted = this.volume === 0;
        if (this.currentAudio) {
            this.currentAudio.volume = this.isMuted ? 0 : this.volume;
        }
        if (this.isPlaying && !this.isPaused && this.synth && this.gender === 'male') {
            this.synth.cancel();
            setTimeout(() => {
                if (this.isPlaying && !this.isPaused) {
                    this._speakCurrentSentence();
                }
            }, 60);
        }
        this._notify();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.currentAudio) {
            this.currentAudio.volume = this.isMuted ? 0 : this.volume;
        }
        if (this.isPlaying && !this.isPaused && this.synth && this.gender === 'male') {
            this.synth.cancel();
            setTimeout(() => {
                if (this.isPlaying && !this.isPaused) {
                    this._speakCurrentSentence();
                }
            }, 60);
        }
        this._notify();
    }

    setVoice(voice) {
        this.selectedVoice = voice;
        if (this.isPlaying && !this.isPaused) {
            if (this.synth) this.synth.cancel();
            this._speakCurrentSentence();
        }
        this._notify();
    }

    setGender(gender, shouldRestart = true) {
        this.gender = gender === 'male' ? 'male' : 'female';
        const { female, male, all } = getAvailableVietnameseVoices();

        if (this.gender === 'female') {
            this.selectedVoice = (female.length > 0) ? female[0] : (all.length > 0 ? all[0] : null);
            this.pitch = 1.15;
        } else {
            this.selectedVoice = (male.length > 0) ? male[0] : (all.length > 0 ? all[0] : null);
            this.pitch = 0.82;
        }

        if (shouldRestart && this.isPlaying && !this.isPaused) {
            this._cleanupCurrentSpeech();
            this._speakCurrentSentence();
        }
        this._notify();
    }

    toggleGender() {
        const nextGender = this.gender === 'female' ? 'male' : 'female';
        this.setGender(nextGender);
        return nextGender;
    }

    setPitch(newPitch) {
        this.pitch = newPitch;
        if (this.isPlaying && !this.isPaused) {
            if (this.synth) this.synth.cancel();
            this._speakCurrentSentence();
        }
        this._notify();
    }

    setVoiceId(voiceId) {
        if (!VOICES.some(v => v.id === voiceId)) return;
        this.currentVoiceId = voiceId;
        const voiceObj = VOICES.find(v => v.id === voiceId);
        if (voiceObj) {
            this.gender = voiceObj.gender;
        }
        this.preloadedAudios.clear();
        if (this.isPlaying && !this.isPaused) {
            this._cleanupCurrentSpeech();
            this._speakCurrentSentence();
        }
        this._notify();
    }

    skipNextSection() {
        if (this.playlist && this.currentPlaylistIndex < this.playlist.length - 1) {
            this.currentPlaylistIndex++;
            const nextSec = this.playlist[this.currentPlaylistIndex];
            if (nextSec && nextSec.content) {
                this.playSection({
                    sectionId: nextSec.id,
                    sectionTitle: nextSec.title,
                    content: nextSec.content,
                    startIndex: 0,
                    playlistIndex: this.currentPlaylistIndex
                });
            }
        }
    }

    skipPrevSection() {
        if (this.playlist && this.currentPlaylistIndex > 0) {
            this.currentPlaylistIndex--;
            const prevSec = this.playlist[this.currentPlaylistIndex];
            if (prevSec && prevSec.content) {
                this.playSection({
                    sectionId: prevSec.id,
                    sectionTitle: prevSec.title,
                    content: prevSec.content,
                    startIndex: 0,
                    playlistIndex: this.currentPlaylistIndex
                });
            }
        }
    }

    seekSentence(index) {
        if (index < 0 || index >= this.sentences.length) return;
        this.currentIndex = index;
        this._cleanupCurrentSpeech();
        if (this.isPlaying && !this.isPaused) {
            this._speakCurrentSentence();
        } else {
            this._notify();
        }
    }

    skipForward(count = 1) {
        this.seekSentence(this.currentIndex + count);
    }

    skipBackward(count = 1) {
        this.seekSentence(this.currentIndex - count);
    }
}

// Export singleton instance
export const ttsEngine = new TtsAudioEngine();
if (typeof window !== 'undefined') {
    window.__ttsEngine = ttsEngine;
}
