const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AiRotator, GeminiRotator } = require('./AiRotator');

class AiService {
    constructor() {
        this.defaultModelName = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
        const primaryKey = process.env.GEMINI_API_KEY || (AiRotator.gemini.getKeys().length > 0 ? AiRotator.gemini.getKeys()[0] : null);
        if (primaryKey) {
            this.genAI = AiRotator.gemini.getGenAI(primaryKey);
        } else {
            this.genAI = null;
            console.warn("GEMINI_API_KEY is not set. AI Features will not work.");
        }
    }

    getModelName(options = {}) {
        return options.model || this.defaultModelName;
    }

    cleanMarkdown(text) {
        if (!text) return '';
        let cleaned = text.trim();
        // Loại bỏ ```markdown hoặc ``` ở đầu chuỗi (không phân biệt hoa thường)
        cleaned = cleaned.replace(/^```markdown\s*/i, '');
        cleaned = cleaned.replace(/^```[a-z]*\s*/i, '');
        // Loại bỏ ``` ở cuối chuỗi
        cleaned = cleaned.replace(/\s*```$/, '');
        // Khử các ký tự Hán tự thô nếu LLM như Llama/Qwen lỡ sinh ra
        cleaned = cleaned.replace(/沟通/g, 'lắng nghe và chia sẻ');
        cleaned = cleaned.replace(/夫妻/g, 'vợ chồng');
        cleaned = cleaned.replace(/[\u4e00-\u9fa5]+/g, '');

        // Tuyệt đối không để bất kỳ từ VIP nào trong bài luận giải của cả 4 phân hệ -> chuyển thành "chuyên sâu"
        cleaned = cleaned.replace(/\bbản\s+(?:báo\s+cáo\s+)?luận\s+giải\s+vip\b/gi, 'bản luận giải chuyên sâu');
        cleaned = cleaned.replace(/\bbáo\s+cáo\s+luận\s+giải\s+vip\b/gi, 'báo cáo luận giải chuyên sâu');
        cleaned = cleaned.replace(/\bluận\s+giải\s+vip\b/gi, 'luận giải chuyên sâu');
        cleaned = cleaned.replace(/\bbáo\s+cáo\s+vip\b/gi, 'báo cáo chuyên sâu');
        cleaned = cleaned.replace(/\bgói\s+vip\b/gi, 'gói chuyên sâu');
        cleaned = cleaned.replace(/\bphân\s+tích\s+vip\b/gi, 'phân tích chuyên sâu');
        cleaned = cleaned.replace(/\bvip\b/gi, 'chuyên sâu');
        cleaned = cleaned.replace(/\bbản\s+bản\b/gi, 'bản');

        return cleaned.trim();
    }

    /**
     * Thực thi hành động gọi AI qua danh sách các mô hình dự phòng (Fallback Chain)
     * Kèm cơ chế xoay tua 2 Gemini Keys khi vào fallback hoặc gặp lỗi Rate Limit (429 / Resource Exhausted)
     * @param {Function} action - Hàm bất đồng bộ nhận (modelName, activeKey) để thực thi gọi API
     * @param {Object} options - Các tùy chọn bổ sung
     */
    async _executeWithFallback(action, options = {}) {
        const chain = [
            options.model || this.defaultModelName,
            process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
            "gemini-3.1-flash-lite",
            "gemini-2.5-flash-lite",
            "gemini-2.5-flash",
            "gemini-flash-lite-latest"
        ];
        
        // Loại bỏ trùng lặp và giữ nguyên thứ tự ưu tiên thử nghiệm
        const modelsToTry = Array.from(new Set(chain.filter(Boolean)));
        
        let lastError = null;
        let activeKey = options.apiKey || (options.useFallbackKey ? GeminiRotator.getFallbackKey() : GeminiRotator.getNextKey());

        for (const modelName of modelsToTry) {
            try {
                return await action(modelName, activeKey);
            } catch (error) {
                console.error(`[AiService] Mô hình ${modelName} gặp lỗi:`, error.message);
                lastError = error;

                // Kiểm tra lỗi Rate Limit (429 / Resource has been exhausted / quota)
                const isRateLimit =
                    error.message?.includes('429') ||
                    error.message?.includes('Resource has been exhausted') ||
                    error.message?.includes('quota') ||
                    error.message?.includes('RATE_LIMIT_EXCEEDED');

                if (isRateLimit && activeKey) {
                    GeminiRotator.markKeyRateLimited(activeKey, 60000);
                    const alternativeKey = GeminiRotator.getFallbackKey(activeKey);
                    if (alternativeKey && alternativeKey !== activeKey) {
                        console.warn(`[AiService] Key [${GeminiRotator.getKeyLabel(activeKey)}] bị Rate Limit (429). Xoay tua sang [${GeminiRotator.getKeyLabel(alternativeKey)}]...`);
                        activeKey = alternativeKey;
                        // Thử lại ngay lập tức với key xoay tua
                        try {
                            return await action(modelName, activeKey);
                        } catch (retryErr) {
                            console.error(`[AiService] Thử lại với key xoay tua thất bại:`, retryErr.message);
                            lastError = retryErr;
                        }
                    }
                }
            }
        }
        throw lastError;
    }

    async generateInterpretation(prompt, options = {}, retries = 2) {
        if (!this.genAI && GeminiRotator.getKeys().length === 0) {
            throw new Error("Hệ thống chưa được cấu hình API Key của AI.");
        }

        try {
            return await this._executeWithFallback(async (modelName, activeKey) => {
                const client = activeKey ? GeminiRotator.getGenAI(activeKey) : this.genAI;
                const model = client.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        maxOutputTokens: 8192
                    }
                });
                for (let attempt = 1; attempt <= retries + 1; attempt++) {
                    try {
                        const timeoutPromise = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('AI Request Timeout')), 45000)
                        );

                        const generatePromise = model.generateContent(prompt);
                        const result = await Promise.race([generatePromise, timeoutPromise]);
                        const response = result.response;
                        return this.cleanMarkdown(response.text());
                    } catch (error) {
                        const waitTime = attempt * 2000;
                        console.error(`AI Generation Error (Attempt ${attempt}/${retries + 1} on ${modelName}): ${error.message} - Retrying in ${waitTime}ms...`);
                        if (attempt === retries + 1) {
                            throw error;
                        }
                        await new Promise(res => setTimeout(res, waitTime));
                    }
                }
            }, options);
        } catch (error) {
            console.error("All AI fallback models failed for generateInterpretation:", error);
            if (error.message.includes('SAFETY')) {
                throw new Error('Nội dung phân tích vi phạm chính sách an toàn của AI.');
            }
            throw new Error('Tính năng luận giải AI đang bảo trì, quý khách vui lòng thử lại sau.');
        }
    }

    async generateInterpretationStream(prompt, options = {}) {
        if (!this.genAI && GeminiRotator.getKeys().length === 0) {
            throw new Error("Hệ thống chưa được cấu hình API Key của AI.");
        }

        try {
            return await this._executeWithFallback(async (modelName, activeKey) => {
                const client = activeKey ? GeminiRotator.getGenAI(activeKey) : this.genAI;
                const model = client.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        maxOutputTokens: 8192
                    }
                });
                const resultStream = await model.generateContentStream(prompt);
                
                // Mấu chốt: Bắt lỗi Promise response để ngăn chặn UnhandledRejection làm crash Node.js
                // Lỗi thực tế sẽ được bắt và xử lý bởi vòng lặp 'for await' khi đọc stream ở Controller.
                if (resultStream && resultStream.response) {
                    resultStream.response.catch(() => {});
                }
                
                return resultStream;
            }, options);
        } catch (error) {
            console.error("All AI fallback models failed for stream generation:", error);
            if (error.message.includes('SAFETY')) {
                throw new Error('Nội dung phân tích vi phạm chính sách an toàn của AI.');
            }
            throw new Error('Tính năng luận giải AI đang bảo trì, quý khách vui lòng thử lại sau.');
        }
    }

    async countTokens(prompt, options = {}) {
        const client = this.genAI || (GeminiRotator.getKeys().length > 0 ? GeminiRotator.getGenAI(GeminiRotator.getNextKey()) : null);
        if (!client) return 0;
        try {
            const modelName = this.getModelName(options);
            const model = client.getGenerativeModel({ model: modelName });
            const countResult = await model.countTokens(prompt);
            return countResult.totalTokens || 0;
        } catch (e) {
            console.error("Error counting tokens with Gemini API, falling back to estimation:", e.message);
            // Fallback: estimate ~4 characters per token for English/Vietnamese mix
            return Math.ceil((prompt || '').length / 4);
        }
    }

    async generateStructuredOutput(prompt, schema, options = {}, retries = 2) {
        if (!this.genAI && GeminiRotator.getKeys().length === 0) {
            throw new Error("Hệ thống chưa được cấu hình API Key của AI.");
        }

        try {
            return await this._executeWithFallback(async (modelName, activeKey) => {
                const client = activeKey ? GeminiRotator.getGenAI(activeKey) : this.genAI;
                const model = client.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: schema
                    }
                });

                for (let attempt = 1; attempt <= retries + 1; attempt++) {
                    try {
                        const timeoutPromise = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('AI Request Timeout')), 30000)
                        );

                        const generatePromise = model.generateContent(prompt);
                        const result = await Promise.race([generatePromise, timeoutPromise]);
                        const response = result.response;
                        const text = response.text();
                        return JSON.parse(text);
                    } catch (error) {
                        console.error(`AI Structured Generation Error (Attempt ${attempt} on ${modelName}):`, error.message);
                        if (attempt === retries + 1) {
                            throw error;
                        }
                        await new Promise(res => setTimeout(res, 2000));
                    }
                }
            }, options);
        } catch (error) {
            console.error("All AI fallback models failed for structured output:", error);
            throw new Error('Tính năng luận giải AI đang bảo trì, quý khách vui lòng thử lại sau.');
        }
    }
}

module.exports = new AiService();

