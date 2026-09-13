const crypto = require('crypto');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const TtsCacheService = require('../services/TtsCacheService');
const TtsAudioService = require('../services/TtsAudioService');
const TtsTicketService = require('../services/TtsTicketService');

class TtsController {
    static ticketCache = TtsTicketService.ticketCache;
    static synthesizeEdgeSSML = TtsAudioService.synthesizeEdgeSSML;
    static synthesizeGoogle = TtsAudioService.synthesizeGoogle;

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

            if (TtsCacheService.hasDiskCache(cacheKey)) {
                return TtsCacheService.streamFromDiskCache(cacheKey, req, res);
            }

            let audioBuffer = null;

            try {
                // Ưu tiên phát bằng Edge Neural Studio 96kbps có SSML Prosody
                audioBuffer = await TtsAudioService.synthesizeEdgeSSML(voice, cleanText);
            } catch (providerError) {
                console.warn(`[TtsController] SSML error with voice ${voice}, falling back to standard synthesis:`, providerError.message);
                try {
                    const profile = TtsAudioService.VOICE_PROFILES[voice] || TtsAudioService.VOICE_PROFILES.hoaimy;
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
                        audioBuffer = await TtsAudioService.synthesizeGoogle(cleanText, lang);
                    } catch (fallbackError) {
                        console.error('[TtsController] Fallback error:', fallbackError.message);
                        return res.status(502).json({ error: 'Failed to synthesize audio from providers' });
                    }
                }
            }

            if (!audioBuffer || audioBuffer.length === 0) {
                return res.status(500).json({ error: 'Empty audio buffer received' });
            }

            await TtsCacheService.saveDiskCache(cacheKey, audioBuffer);

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

            const cleanText = TtsAudioService.cleanChapterMarkdown(rawContent);
            if (!cleanText) {
                return res.status(400).json({ error: 'Nội dung rỗng sau khi làm sạch định dạng' });
            }

            // Tạo cache key chuẩn hóa theo giọng + sectionId + MD5 hash nội dung
            const textHash = crypto.createHash('md5').update(cleanText).digest('hex').slice(0, 16);
            const cacheKey = `chap:${voice}:${sectionId || 'sec'}:${textHash}`;

            if (TtsCacheService.hasDiskCache(cacheKey)) {
                return TtsCacheService.streamFromDiskCache(cacheKey, req, res);
            }

            // Phát hiện hủy kết nối từ phía client
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

            const chunks = TtsAudioService.splitTextIntoSemanticChunks(cleanText, 650);
            const audioBuffers = [];

            for (let i = 0; i < chunks.length; i++) {
                if (isClientDisconnected || cancelToken.isCancelled) break;
                const chunk = chunks[i];
                if (!chunk || !chunk.trim()) continue;

                let chunkBuf = null;

                for (let attempt = 1; attempt <= 2; attempt++) {
                    if (isClientDisconnected || cancelToken.isCancelled) break;
                    try {
                        chunkBuf = await TtsAudioService.synthesizeEdgeSSML(voice, chunk, 35000, cancelToken);
                        if (chunkBuf && chunkBuf.length > 0) {
                            break;
                        }
                    } catch (chunkErr) {
                        if (isClientDisconnected) break;
                        console.warn(`[TtsController.synthesizeChapter] Chunk ${i + 1}/${chunks.length} attempt ${attempt} failed with voice ${voice}:`, chunkErr.message);
                    }
                }

                if (!chunkBuf || chunkBuf.length === 0) {
                    if (isClientDisconnected) break;
                    console.warn(`[TtsController.synthesizeChapter] Falling back to Google TTS for chunk ${i + 1}/${chunks.length}`);
                    try {
                        const shortText = chunk.slice(0, 180);
                        chunkBuf = await TtsAudioService.synthesizeGoogle(shortText, 'vi');
                    } catch (googleErr) {
                        console.error('[TtsController.synthesizeChapter] Google TTS fallback error:', googleErr.message);
                    }
                }

                if (chunkBuf && chunkBuf.length > 0) {
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
            await TtsCacheService.saveDiskCache(cacheKey, completeChapterBuffer);

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

            const cleanText = TtsAudioService.cleanChapterMarkdown(rawContent);
            if (!cleanText) {
                return res.status(400).json({ error: 'Nội dung rỗng sau khi làm sạch định dạng' });
            }

            const textHash = crypto.createHash('md5').update(cleanText).digest('hex').slice(0, 16);
            const ticketId = `${voice}_${sectionId || 'sec'}_${textHash}`;
            const cacheKey = `chap:${voice}:${sectionId || 'sec'}:${textHash}`;

            const isCached = TtsCacheService.hasDiskCache(cacheKey);

            if (!isCached) {
                TtsTicketService.setTicket(ticketId, {
                    cleanText,
                    voice,
                    sectionId,
                    cacheKey
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
     */
    static async streamAudioTicket(req, res) {
        try {
            const { ticketId } = req.params;
            if (!ticketId) {
                return res.status(400).send('Ticket ID is required');
            }

            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', '*');

            const parts = ticketId.split('_');
            const voice = parts[0] || 'hoaimy';
            const textHash = parts[parts.length - 1];
            const sectionId = parts.slice(1, parts.length - 1).join('_');
            const cacheKey = `chap:${voice}:${sectionId}:${textHash}`;

            if (TtsCacheService.hasDiskCache(cacheKey)) {
                return TtsCacheService.streamFromDiskCache(cacheKey, req, res);
            }

            const ticketData = TtsTicketService.getTicket(ticketId);
            if (!ticketData || !ticketData.cleanText) {
                return res.status(404).send('Audio stream ticket expired or not found');
            }

            res.writeHead(200, {
                'Content-Type': 'audio/mpeg',
                'Transfer-Encoding': 'chunked',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            });

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
            const profile = TtsAudioService.VOICE_PROFILES[ticketData.voice] || TtsAudioService.VOICE_PROFILES.hoaimy;

            const chunks = TtsAudioService.splitTextIntoSemanticChunks(textToSpeak, 650);
            const collectedBuffers = [];

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
                        const naturalText = TtsAudioService.preprocessTextForNaturalSpeech(chunk);
                        const { audioStream } = tts.toStream(naturalText);

                        audioStream.on('data', (c) => {
                            if (isClientDisconnected || res.writableEnded) return;
                            chunkReceivedBytes += c.length;

                            if (i === 0) {
                                res.write(c);
                                collectedBuffers.push(c);
                                return;
                            }

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
                            if (chunkReceivedBytes === 0 && !isClientDisconnected && !res.writableEnded) {
                                try {
                                    const googleBuf = await TtsAudioService.synthesizeGoogle(chunk.slice(0, 180), 'vi');
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

            if (!isClientDisconnected && collectedBuffers.length > 0) {
                const completeBuffer = Buffer.concat(collectedBuffers);
                await TtsCacheService.saveDiskCache(cacheKey, completeBuffer);
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
